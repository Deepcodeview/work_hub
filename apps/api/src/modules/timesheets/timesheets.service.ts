import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface TimesheetEntryInput {
  projectId?: string;
  taskId?: string;
  description: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
}

@Injectable()
export class TimesheetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  /**
   * Get or initialize daily timesheet for employee on given work date
   */
  async getDailyTimesheet(employeeId: string, workDateStr: string): Promise<any> {
    const workDate = new Date(workDateStr);

    let timesheet = await this.prisma.timesheet.findFirst({
      where: {
        employeeId,
        workDate,
      },
      include: {
        entries: true,
        approvals: {
          orderBy: { createdAt: 'desc' },
        },
        approverManager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    if (!timesheet) {
      timesheet = await this.prisma.timesheet.create({
        data: {
          employeeId,
          workDate,
          status: 'DRAFT',
          totalMinutes: 0,
        },
        include: {
          entries: true,
          approvals: true,
          approverManager: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });
    }

    return timesheet;
  }

  /**
   * Save draft timesheet entries (replaces entries for the day)
   */
  async saveDraftEntries(
    employeeId: string,
    workDateStr: string,
    entries: TimesheetEntryInput[]
  ): Promise<any> {
    const workDate = new Date(workDateStr);

    let timesheet = await this.prisma.timesheet.findFirst({
      where: { employeeId, workDate },
    });

    if (!timesheet) {
      timesheet = await this.prisma.timesheet.create({
        data: {
          employeeId,
          workDate,
          status: 'DRAFT',
          totalMinutes: 0,
        },
      });
    }

    if (timesheet.status === 'APPROVED') {
      throw new BadRequestException(
        'Cannot modify an already approved timesheet. Use the correction request workflow.'
      );
    }

    // Delete existing entries and insert new ones
    await this.prisma.timesheetEntry.deleteMany({
      where: { timesheetId: timesheet.id },
    });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    const validEntries = (entries || []).map((entry) => {
      const desc =
        entry.description ||
        (entry as any).taskSummary ||
        (entry as any).title ||
        'Core Work Activity';
      const duration = Math.max(0, Number(entry.durationMinutes) || 0);
      const validProjectId =
        entry.projectId && uuidRegex.test(entry.projectId) ? entry.projectId : undefined;
      const validTaskId =
        entry.taskId && uuidRegex.test(entry.taskId) ? entry.taskId : undefined;

      return {
        timesheetId: timesheet!.id,
        projectId: validProjectId,
        taskId: validTaskId,
        description: desc,
        durationMinutes: duration,
        startTime: entry.startTime ? new Date(entry.startTime) : undefined,
        endTime: entry.endTime ? new Date(entry.endTime) : undefined,
      };
    });

    const totalMinutes = validEntries.reduce((sum, e) => sum + e.durationMinutes, 0);

    if (validEntries.length > 0) {
      await Promise.all(
        validEntries.map((e) =>
          this.prisma.timesheetEntry.create({
            data: e,
          })
        )
      );
    }

    const updatedTimesheet = await this.prisma.timesheet.update({
      where: { id: timesheet.id },
      data: {
        totalMinutes,
        status: timesheet.status === 'SUBMITTED' ? 'DRAFT' : timesheet.status,
      },
      include: { entries: true },
    });

    return updatedTimesheet;
  }

  /**
   * Submit timesheet: locks the current primary reporting manager as approverManagerId,
   * creates immutable TimesheetApproval record, changes status to SUBMITTED.
   */
  async submitTimesheet(timesheetId: string, employeeId: string): Promise<any> {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id: timesheetId },
      include: { entries: true },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.employeeId !== employeeId) {
      throw new ForbiddenException('You can only submit your own timesheet');
    }

    if (timesheet.entries.length === 0) {
      throw new BadRequestException(
        'Cannot submit a timesheet with no entries. Please add at least one project activity with logged hours.'
      );
    }

    // Capture current primary reporting manager to lock approval routing
    const activeReporting = await this.prisma.employeeReportingHistory.findFirst({
      where: {
        employeeId,
        isPrimary: true,
        effectiveTo: null,
      },
      select: { managerId: true },
    });

    // Fallback to any active manager or HR admin if employee has no reporting history yet
    let approverManagerId = activeReporting?.managerId || null;
    if (!approverManagerId) {
      const adminEmp = await this.prisma.employee.findFirst({
        where: {
          id: { not: employeeId },
          status: 'ACTIVE',
        },
        select: { id: true },
      });
      if (adminEmp) {
        approverManagerId = adminEmp.id;
      }
    }

    const now = new Date();
    const updated = await this.prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'SUBMITTED',
        submittedAt: now,
        approverManagerId,
        rejectionReason: null,
      },
      include: { entries: true },
    });

    // Record immutable audit record for submission
    await this.prisma.timesheetApproval.create({
      data: {
        timesheetId,
        version: timesheet.version,
        action: 'SUBMIT',
        actorId: employeeId,
      },
    });

    await this.audit.log({
      actorId: employeeId,
      action: 'timesheet.submitted',
      entity: 'timesheet',
      entityId: timesheetId,
      details: {
        workDate: timesheet.workDate,
        totalMinutes: timesheet.totalMinutes,
        approverManagerId: activeReporting?.managerId,
      },
    });

    return updated;
  }

  /**
   * Approve timesheet:
   * Rule: User must NEVER approve their own timesheet, even if they hold multiple roles.
   * Rule: Preserves immutable approval version history.
   */
  async approveTimesheet(
    timesheetId: string,
    managerEmployeeId: string,
    comments?: string,
    isSuperAdmin: boolean = false
  ): Promise<any> {
    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    // Absolute Rule: Never approve own timesheet
    if (timesheet.employeeId === managerEmployeeId) {
      throw new ForbiddenException('A user must never approve their own timesheet');
    }

    // Must be the assigned manager or SuperAdmin
    if (!isSuperAdmin && timesheet.approverManagerId !== managerEmployeeId) {
      throw new ForbiddenException('You are not the designated approving manager for this timesheet');
    }

    if (timesheet.status !== 'SUBMITTED') {
      throw new BadRequestException('Only submitted timesheets can be approved');
    }

    const now = new Date();
    const updated = await this.prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'APPROVED',
        approvedAt: now,
      },
    });

    // Create immutable approval record
    await this.prisma.timesheetApproval.create({
      data: {
        timesheetId,
        version: timesheet.version,
        action: 'APPROVE',
        actorId: managerEmployeeId,
        comments,
      },
    });

    await this.audit.log({
      actorId: managerEmployeeId,
      action: 'timesheet.approved',
      entity: 'timesheet',
      entityId: timesheetId,
      details: { approverId: managerEmployeeId, comments },
    });

    return updated;
  }

  /**
   * Reject timesheet with mandatory reason
   */
  async rejectTimesheet(
    timesheetId: string,
    managerEmployeeId: string,
    reason: string,
    isSuperAdmin: boolean = false
  ): Promise<any> {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }

    const timesheet = await this.prisma.timesheet.findUnique({
      where: { id: timesheetId },
    });

    if (!timesheet) {
      throw new NotFoundException('Timesheet not found');
    }

    if (timesheet.employeeId === managerEmployeeId) {
      throw new ForbiddenException('A user cannot reject/review their own timesheet');
    }

    if (!isSuperAdmin && timesheet.approverManagerId !== managerEmployeeId) {
      throw new ForbiddenException('You are not the designated approving manager for this timesheet');
    }

    const updated = await this.prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        version: timesheet.version + 1, // Bump version upon rejection so corrections form next version
      },
    });

    // Create immutable approval audit record
    await this.prisma.timesheetApproval.create({
      data: {
        timesheetId,
        version: timesheet.version,
        action: 'REJECT',
        actorId: managerEmployeeId,
        comments: reason,
      },
    });

    await this.audit.log({
      actorId: managerEmployeeId,
      action: 'timesheet.rejected',
      entity: 'timesheet',
      entityId: timesheetId,
      details: { approverId: managerEmployeeId, reason },
    });

    return updated;
  }

  /**
   * List pending timesheet approvals assigned to manager (or all if SuperAdmin/HR)
   */
  async getPendingApprovals(managerEmployeeId: string, isSuperAdmin: boolean = false): Promise<any[]> {
    return this.prisma.timesheet.findMany({
      where: isSuperAdmin
        ? { status: 'SUBMITTED' }
        : {
            status: 'SUBMITTED',
            OR: [
              { approverManagerId: managerEmployeeId },
              { approverManagerId: null },
            ],
          },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
        entries: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
  }
}
