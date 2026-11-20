import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardSummary(employeeId: string, roles: string[] = []): Promise<any> {
    const isManager = roles.some((r) => ['REPORTING_MANAGER', 'DEPARTMENT_HEAD', 'SYSTEM_ADMIN'].includes(r));
    const isAdmin = roles.includes('SYSTEM_ADMIN');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Personal attendance session
    const activeSession: any = await this.prisma.attendanceSession.findFirst({
      where: {
        employeeId,
        clockInAt: { gte: today },
      },
      include: {
        breaks: { where: { endTime: null } },
      },
    });

    // Assigned open tasks
    const openTasks = await this.prisma.task.count({
      where: {
        assignees: { some: { employeeId } },
        status: { notIn: ['DONE'] },
      },
    });

    // Active projects count
    const activeProjects = await this.prisma.project.count({
      where: {
        OR: [
          { ownerId: employeeId },
          { members: { some: { employeeId } } },
        ],
        status: 'ACTIVE',
      },
    });

    // Pending notifications
    const unreadNotifications = await this.prisma.notification.count({
      where: { recipientId: employeeId, isRead: false },
    });

    let managerSummary = null;
    if (isManager) {
      // Find reporting team
      const reports = await this.prisma.employeeReportingHistory.findMany({
        where: { managerId: employeeId, effectiveTo: null },
        select: { employeeId: true },
      });
      const teamEmployeeIds = reports.map((r: any) => r.employeeId);

      const teamTotal = teamEmployeeIds.length;

      const teamClockedIn = teamEmployeeIds.length > 0 ? await this.prisma.attendanceSession.count({
        where: {
          employeeId: { in: teamEmployeeIds },
          clockInAt: { gte: today },
          status: 'OPEN',
        },
      }) : 0;

      const pendingTimesheets = await this.prisma.timesheet.count({
        where: {
          approverManagerId: employeeId,
          status: 'SUBMITTED',
        },
      });

      managerSummary = {
        teamTotal,
        teamClockedIn,
        pendingTimesheetApprovals: pendingTimesheets,
      };
    }

    let adminSummary = null;
    if (isAdmin) {
      const [totalEmployees, totalDepartments, totalProjects] = await Promise.all([
        this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
        this.prisma.department.count(),
        this.prisma.project.count(),
      ]);

      adminSummary = {
        totalEmployees,
        totalDepartments,
        totalProjects,
      };
    }

    return {
      personal: {
        attendance: {
          hasActiveSession: !!activeSession && activeSession.status === 'OPEN',
          isOnBreak: activeSession?.breaks?.length ? activeSession.breaks.length > 0 : false,
          clockInTime: activeSession?.clockInAt,
          netDurationMinutes: activeSession?.totalDurationMinutes || 0,
        },
        openTasksCount: openTasks,
        activeProjectsCount: activeProjects,
        unreadNotificationsCount: unreadNotifications,
      },
      manager: managerSummary,
      admin: adminSummary,
    };
  }
}
