import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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
      employeeCode: string;
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      departmentId?: string;
      teamId?: string;
      designationId?: string;
      managerId?: string;
    },
    actorId?: string
  ): Promise<any> {
    const existing = await this.prisma.employee.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase() },
          { employeeCode: data.employeeCode },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Employee with this email or code already exists');
    }

    const employee = await this.prisma.employee.create({
      data: {
        employeeCode: data.employeeCode,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        departmentId: data.departmentId,
        teamId: data.teamId,
        designationId: data.designationId,
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
    });

    await this.audit.log({
      actorId,
      action: 'employee.created',
      entity: 'employee',
      entityId: employee.id,
      details: { email: employee.email, code: employee.employeeCode },
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
