import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface OrgNode {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  designation?: string;
  department?: string;
  managerId?: string | null;
  directReportsCount: number;
  reports?: OrgNode[];
}

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  /**
   * Assign or reassign reporting manager with validation, cycle check, and audit trail.
   */
  async assignManager(
    employeeId: string,
    managerId: string | null,
    reason?: string,
    assignedById?: string
  ) {
    if (managerId && employeeId === managerId) {
      throw new BadRequestException('An employee cannot report to themselves');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    if (managerId) {
      const manager = await this.prisma.employee.findUnique({
        where: { id: managerId },
      });
      if (!manager) {
        throw new NotFoundException(`Manager with ID ${managerId} not found`);
      }

      // Check for cycles in the reporting hierarchy
      const wouldFormCycle = await this.detectCycle(employeeId, managerId);
      if (wouldFormCycle) {
        throw new BadRequestException(
          'Circular reporting hierarchy detected. This assignment would create a reporting cycle.'
        );
      }
    }

    const now = new Date();

    // End previous active reporting relationship
    await this.prisma.employeeReportingHistory.updateMany({
      where: {
        employeeId,
        isPrimary: true,
        effectiveTo: null,
      },
      data: {
        effectiveTo: now,
      },
    });

    let newRecord = null;
    if (managerId) {
      newRecord = await this.prisma.employeeReportingHistory.create({
        data: {
          employeeId,
          managerId,
          effectiveFrom: now,
          isPrimary: true,
          changeReason: reason || 'Manager reassignment',
          assignedById,
        },
      });

      // Ensure the manager has REPORTING_MANAGER role
      await this.ensureReportingManagerRole(managerId);
    }

    // Write audit log
    await this.audit.log({
      actorId: assignedById,
      action: 'organization.manager_assigned',
      entity: 'employee',
      entityId: employeeId,
      details: {
        employeeId,
        newManagerId: managerId,
        reason,
        effectiveFrom: now.toISOString(),
      },
    });

    return {
      success: true,
      data: newRecord,
    };
  }

  /**
   * Traverses up the chain from target manager to root to see if it reaches employeeId
   */
  async detectCycle(employeeId: string, potentialManagerId: string): Promise<boolean> {
    let currentManagerId: string | null = potentialManagerId;
    const visited = new Set<string>();

    while (currentManagerId) {
      if (currentManagerId === employeeId) {
        return true; // Cycle found
      }

      if (visited.has(currentManagerId)) {
        return true; // Pre-existing loop found
      }
      visited.add(currentManagerId);

      const activeReport = await this.prisma.employeeReportingHistory.findFirst({
        where: {
          employeeId: currentManagerId,
          isPrimary: true,
          effectiveTo: null,
        },
      });

      currentManagerId = activeReport?.managerId || null;
    }

    return false;
  }

  /**
   * Retrieves the full hierarchical organization chart tree
   */
  async getOrgTree(): Promise<OrgNode[]> {
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        department: { select: { name: true } },
        designation: { select: { title: true } },
        reportingHistoryAsEmployee: {
          where: { isPrimary: true, effectiveTo: null },
          select: { managerId: true },
          take: 1,
        },
      },
      orderBy: { firstName: 'asc' },
    });

    const nodeMap = new Map<string, OrgNode>();
    employees.forEach((emp) => {
      nodeMap.set(emp.id, {
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        department: emp.department?.name,
        designation: emp.designation?.title,
        managerId: emp.reportingHistoryAsEmployee[0]?.managerId || null,
        directReportsCount: 0,
        reports: [],
      });
    });

    const roots: OrgNode[] = [];

    nodeMap.forEach((node) => {
      if (node.managerId && nodeMap.has(node.managerId)) {
        const managerNode = nodeMap.get(node.managerId)!;
        managerNode.reports!.push(node);
        managerNode.directReportsCount += 1;
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  /**
   * Retrieves authorized reporting team (direct and indirect reports) for a manager
   */
  async getReportingTeam(managerId: string) {
    const directReports = await this.prisma.employeeReportingHistory.findMany({
      where: {
        managerId,
        isPrimary: true,
        effectiveTo: null,
      },
      include: {
        employee: {
          include: {
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
            reportingHistoryAsManager: {
              where: { isPrimary: true, effectiveTo: null },
              select: { id: true },
            },
          },
        },
      },
    });

    return directReports.map((dr) => ({
      ...dr.employee,
      directReportsCount: dr.employee.reportingHistoryAsManager.length,
      reportingSince: dr.effectiveFrom,
    }));
  }

  private async ensureReportingManagerRole(managerEmployeeId: string) {
    const manager = await this.prisma.employee.findUnique({
      where: { id: managerEmployeeId },
      select: { userId: true },
    });

    if (manager?.userId) {
      const role = await this.prisma.role.findUnique({
        where: { name: 'REPORTING_MANAGER' },
      });
      if (role) {
        await this.prisma.userRole.upsert({
          where: {
            userId_roleId: {
              userId: manager.userId,
              roleId: role.id,
            },
          },
          update: {},
          create: {
            userId: manager.userId,
            roleId: role.id,
          },
        });
      }
    }
  }
}
