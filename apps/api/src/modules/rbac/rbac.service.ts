import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role as RoleEnum, Permissions as PermEnum } from '@workhub/permissions';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RbacService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async onModuleInit() {
    await this.seedDefaults();
  }

  async seedDefaults() {
    try {
      // 1. Seed Roles
      const defaultRoles = [
        { name: RoleEnum.SYSTEM_ADMIN, description: 'Full system and company administration' },
        { name: RoleEnum.HR_ADMIN, description: 'HR operations, employees, and policies' },
        { name: RoleEnum.DEPARTMENT_HEAD, description: 'Department and team management' },
        { name: RoleEnum.REPORTING_MANAGER, description: 'Reporting team supervision and approvals' },
        { name: RoleEnum.PROJECT_MANAGER, description: 'Project and task leadership' },
        { name: RoleEnum.FINANCE, description: 'Financial operations and payroll' },
        { name: RoleEnum.EMPLOYEE, description: 'Standard employee access' },
      ];

      for (const r of defaultRoles) {
        await this.prisma.role.upsert({
          where: { name: r.name },
          update: { description: r.description },
          create: r,
        });
      }

      // 2. Seed Permissions
      const allPermissions = Object.values(PermEnum);
      for (const key of allPermissions) {
        await this.prisma.permission.upsert({
          where: { key },
          update: {},
          create: { key, description: `Permission for ${key}` },
        });
      }
    } catch {
      // Allow startup when database is not yet connected
    }
  }

  async listRoles(): Promise<any[]> {
    return this.prisma.role.findMany({
      include: {
        _count: { select: { userRoles: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async assignRole(userId: string, roleName: string, actorId?: string): Promise<any> {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    const userRole = await this.prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId: role.id },
      },
      update: {},
      create: { userId, roleId: role.id },
    });

    await this.audit.log({
      actorId,
      action: 'role.assigned',
      entity: 'user',
      entityId: userId,
      details: { roleName, roleId: role.id },
    });

    return userRole;
  }

  async removeRole(userId: string, roleName: string, actorId?: string) {
    const role = await this.prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    await this.prisma.userRole.deleteMany({
      where: { userId, roleId: role.id },
    });

    await this.audit.log({
      actorId,
      action: 'role.removed',
      entity: 'user',
      entityId: userId,
      details: { roleName, roleId: role.id },
    });

    return { success: true };
  }
}
