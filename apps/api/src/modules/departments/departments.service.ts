import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DepartmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async findAll(): Promise<any[]> {
    return this.prisma.department.findMany({
      include: {
        head: {
          select: { id: true, firstName: true, lastName: true, email: true, employeeCode: true },
        },
        teams: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: { employees: true, teams: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string): Promise<any> {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        head: true,
        teams: {
          include: {
            leader: true,
            _count: { select: { employees: true } },
          },
        },
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            designation: { select: { title: true } },
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async create(data: { name: string; code: string; description?: string; headId?: string }, actorId?: string): Promise<any> {
    const existing = await this.prisma.department.findFirst({
      where: {
        OR: [{ name: data.name }, { code: data.code.toUpperCase() }],
      },
    });

    if (existing) {
      throw new ConflictException('Department with this name or code already exists');
    }

    const department = await this.prisma.department.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description,
        headId: data.headId,
      },
      include: { head: true },
    });

    // If headId provided, ensure employee is assigned DEPARTMENT_HEAD role
    if (data.headId) {
      await this.ensureDepartmentHeadRole(data.headId);
    }

    await this.audit.log({
      actorId,
      action: 'department.created',
      entity: 'department',
      entityId: department.id,
      details: { name: department.name, code: department.code, headId: department.headId },
    });

    return department;
  }

  async update(id: string, data: { name?: string; description?: string; headId?: string }, actorId?: string): Promise<any> {
    const dept = await this.findById(id);

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.headId !== undefined && { headId: data.headId }),
      },
      include: { head: true },
    });

    if (data.headId && data.headId !== dept.headId) {
      await this.ensureDepartmentHeadRole(data.headId);
    }

    await this.audit.log({
      actorId,
      action: 'department.updated',
      entity: 'department',
      entityId: id,
      details: data,
    });

    return updated;
  }

  async delete(id: string, actorId?: string): Promise<any> {
    const dept = await this.findById(id);

    // Reassign any employees belonging to this department to null
    await this.prisma.employee.updateMany({
      where: { departmentId: id },
      data: { departmentId: null },
    });

    const deleted = await this.prisma.department.delete({
      where: { id },
    });

    await this.audit.log({
      actorId,
      action: 'department.deleted',
      entity: 'department',
      entityId: id,
      details: { name: deleted.name, code: deleted.code },
    });

    return { success: true, message: `Department ${deleted.name} deleted successfully` };
  }

  private async ensureDepartmentHeadRole(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { userId: true },
    });

    if (employee?.userId) {
      const deptHeadRole = await this.prisma.role.findUnique({
        where: { name: 'DEPARTMENT_HEAD' },
      });
      if (deptHeadRole) {
        await this.prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: employee.userId,
              roleId: deptHeadRole.id,
            },
          },
          update: {},
          create: {
            userId: employee.userId,
            roleId: deptHeadRole.id,
          },
        });
      }
    }
  }
}
