import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async findAll(query?: {
    search?: string;
    departmentId?: string;
    teamId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.departmentId) {
      where.departmentId = query.departmentId;
    }
    if (query?.teamId) {
      where.teamId = query.teamId;
    }
    if (query?.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { employeeCode: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: { select: { id: true, name: true, code: true } },
          team: { select: { id: true, name: true } },
          designation: { select: { id: true, title: true, code: true, level: true } },
          reportingHistoryAsEmployee: {
            where: { isPrimary: true, effectiveTo: null },
            include: {
              manager: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
            take: 1,
          },
          user: {
            select: {
              id: true,
              userRoles: {
                include: { role: { select: { id: true, name: true } } },
              },
            },
          },
        },
        orderBy: { firstName: 'asc' },
      }),
    ]);

    return {
      items: items.map((emp) => ({
        ...emp,
        primaryManager: emp.reportingHistoryAsEmployee[0]?.manager || null,
        roles: emp.user?.userRoles.map((ur) => ur.role.name) || [],
      })),
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  async findById(id: string): Promise<any> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        team: true,
        designation: true,
        profile: true,
        reportingHistoryAsEmployee: {
          where: { isPrimary: true, effectiveTo: null },
          include: {
            manager: {
              select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
            },
          },
          take: 1,
        },
        user: {
          select: {
            id: true,
            isActive: true,
            userRoles: {
              include: { role: true },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return {
      ...employee,
      primaryManager: employee.reportingHistoryAsEmployee[0]?.manager || null,
      roles: employee.user?.userRoles.map((ur) => ur.role.name) || [],
    };
  }

  async create(
    data: {
      employeeCode?: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      departmentId?: string;
      teamId?: string;
      designationId?: string;
      managerId?: string;
      password?: string;
      role?: string;
      baseSalary?: number;
      paymentMethod?: string;
    },
    actorId?: string
  ): Promise<any> {
    const emailLower = data.email.toLowerCase().trim();
    const code = data.employeeCode?.trim() || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const existing = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { email: emailLower },
          { employeeCode: code },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Employee with this email or code already exists');
    }

    // Provision User account if password provided or user account requested
    let userId: string | null = null;
    let user = await this.prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (!user && data.password) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(data.password, salt);
      user = await this.prisma.user.create({
        data: {
          email: emailLower,
          passwordHash,
          isActive: true,
        },
      });

      const roleName = data.role || 'EMPLOYEE';
      const roleRecord = await this.prisma.role.findUnique({
        where: { name: roleName },
      });
      if (roleRecord) {
        await this.prisma.userRole.create({
          data: {
            userId: user.id,
            roleId: roleRecord.id,
          },
        });
      }
    }

    if (user) {
      userId = user.id;
    }

    const employee = await this.prisma.employee.create({
      data: {
        userId,
        employeeCode: code,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: emailLower,
        phone: data.phone?.trim() || null,
        departmentId: data.departmentId || null,
        teamId: data.teamId || null,
        designationId: data.designationId || null,
        status: 'ACTIVE',
        ...(data.managerId && {
          reportingHistoryAsEmployee: {
            create: {
              managerId: data.managerId,
              isPrimary: true,
              assignedById: actorId,
            },
          },
        }),
      },
      include: {
        department: true,
        designation: true,
      },
    });

    // Automatically set up Compensation / Salary Assignment if specified
    if (data.baseSalary && data.baseSalary > 0) {
      let structure = await this.prisma.salaryStructure.findFirst();
      if (!structure) {
        structure = await this.prisma.salaryStructure.create({
          data: {
            name: 'Standard Corporate Package',
            code: 'STD_CORP',
            currency: 'USD',
            components: {
              create: [
                { name: 'Base Pay', type: 'EARNING', amount: 0.85 },
                { name: 'Standard Allowance', type: 'EARNING', amount: 0.15 },
                { name: 'Statutory Withholding', type: 'DEDUCTION', amount: 0.15, isStatutory: true },
              ],
            },
          },
        });
      }

      await this.prisma.employeeSalaryAssignment.upsert({
        where: { employeeId: employee.id },
        update: {
          baseSalary: Number(data.baseSalary),
          paymentMethod: data.paymentMethod || 'DIRECT_DEPOSIT',
          structureId: structure.id,
        },
        create: {
          employeeId: employee.id,
          structureId: structure.id,
          baseSalary: Number(data.baseSalary),
          paymentMethod: data.paymentMethod || 'DIRECT_DEPOSIT',
        },
      });
    }

    // Automatically provision initial annual leave balances for all available leave types
    const leaveTypes = await this.prisma.leaveType.findMany();
    const currentYear = new Date().getFullYear();
    for (const lt of leaveTypes) {
      await this.prisma.leaveBalance.upsert({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: employee.id,
            leaveTypeId: lt.id,
            year: currentYear,
          },
        },
        update: {},
        create: {
          employeeId: employee.id,
          leaveTypeId: lt.id,
          year: currentYear,
          totalAccruedDays: lt.annualQuotaDays || 12,
          usedDays: 0,
          pendingDays: 0,
        },
      });
    }

    await this.audit.log({
      actorId,
      action: 'employee.onboarded',
      entity: 'employee',
      entityId: employee.id,
      details: { email: employee.email, code: employee.employeeCode, hasUserAccount: !!userId },
    });

    return employee;
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      departmentId?: string;
      teamId?: string;
      designationId?: string;
      status?: string;
    },
    actorId?: string
  ): Promise<any> {
    await this.findById(id);

    const updated = await this.prisma.employee.update({
      where: { id },
      data,
    });

    await this.audit.log({
      actorId,
      action: 'employee.updated',
      entity: 'employee',
      entityId: id,
      details: data,
    });

    return updated;
  }
}
