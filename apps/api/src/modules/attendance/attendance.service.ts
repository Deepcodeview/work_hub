import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface LocationCoordinates {
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  address?: string;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  /**
   * Clock-in: ensures exactly one open session per employee.
   * Captures GPS location event if provided.
   */
  async clockIn(
    employeeId: string,
    location?: LocationCoordinates,
    deviceType: string = 'WEB',
    actorUserId?: string
  ): Promise<any> {
    const existingOpenSession = await this.prisma.attendanceSession.findFirst({
      where: {
        employeeId,
        status: 'OPEN',
      },
    });

    if (existingOpenSession) {
      throw new BadRequestException('An active attendance session is already open. Please clock out before starting a new session.');
    }

    const now = new Date();
    const session = await this.prisma.attendanceSession.create({
      data: {
        employeeId,
        clockInAt: now,
        status: 'OPEN',
        deviceType,
        clockInLatitude: location?.latitude,
        clockInLongitude: location?.longitude,
        clockInAccuracy: location?.accuracy,
        clockInAddress: location?.address,
      },
    });

    await this.audit.log({
      actorId: actorUserId,
      action: 'attendance.clock_in',
      entity: 'attendance_session',
      entityId: session.id,
      details: { employeeId, time: now.toISOString(), deviceType, location },
    });

    return session;
  }

  /**
   * Clock-out: closes open session and any open break, calculates integer minutes worked.
   */
  async clockOut(
    employeeId: string,
    location?: LocationCoordinates,
    deviceType: string = 'WEB',
    actorUserId?: string
  ): Promise<any> {
    const session = await this.prisma.attendanceSession.findFirst({
      where: {
        employeeId,
        status: 'OPEN',
      },
      include: {
        breaks: true,
      },
    });

    if (!session) {
      throw new BadRequestException('No active attendance session found to clock out');
    }

    const now = new Date();

    // Close any dangling open breaks
    for (const brk of session.breaks) {
      if (!brk.endTime) {
        const breakDuration = Math.max(0, Math.round((now.getTime() - brk.startTime.getTime()) / 60000));
        await this.prisma.attendanceBreak.update({
          where: { id: brk.id },
          data: {
            endTime: now,
            durationMinutes: breakDuration,
          },
        });
      }
    }

    // Reload breaks to get updated total break time
    const updatedBreaks = await this.prisma.attendanceBreak.findMany({
      where: { sessionId: session.id },
    });
    const totalBreakMinutes = updatedBreaks.reduce(
      (sum, b) => sum + (b.durationMinutes || 0),
      0
    );

    const grossMinutes = Math.max(
      0,
      Math.round((now.getTime() - session.clockInAt.getTime()) / 60000)
    );
    const netWorkMinutes = Math.max(0, grossMinutes - totalBreakMinutes);

    const closedSession = await this.prisma.attendanceSession.update({
      where: { id: session.id },
      data: {
        clockOutAt: now,
        status: 'CLOSED',
        totalDurationMinutes: netWorkMinutes,
        clockOutLatitude: location?.latitude,
        clockOutLongitude: location?.longitude,
        clockOutAccuracy: location?.accuracy,
        clockOutAddress: location?.address,
      },
    });

    await this.audit.log({
      actorId: actorUserId,
      action: 'attendance.clock_out',
      entity: 'attendance_session',
      entityId: session.id,
      details: {
        employeeId,
        grossMinutes,
        totalBreakMinutes,
        netWorkMinutes,
      },
    });

    return closedSession;
  }

  /**
   * Start a break (Lunch, Tea, Personal)
   */
  async startBreak(employeeId: string, breakType: string = 'PERSONAL'): Promise<any> {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { employeeId, status: 'OPEN' },
      include: { breaks: { where: { endTime: null } } },
    });

    if (!session) {
      throw new BadRequestException('Cannot start a break without an active attendance session');
    }

    if (session.breaks.length > 0) {
      throw new BadRequestException('You already have an active break in progress');
    }

    return this.prisma.attendanceBreak.create({
      data: {
        sessionId: session.id,
        breakType,
        startTime: new Date(),
      },
    });
  }

  /**
   * End the current break
   */
  async endBreak(employeeId: string): Promise<any> {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { employeeId, status: 'OPEN' },
      include: { breaks: { where: { endTime: null } } },
    });

    if (!session || session.breaks.length === 0) {
      throw new BadRequestException('No active break found to end');
    }

    const currentBreak = session.breaks[0];
    const now = new Date();
    const durationMinutes = Math.max(0, Math.round((now.getTime() - currentBreak.startTime.getTime()) / 60000));

    return this.prisma.attendanceBreak.update({
      where: { id: currentBreak.id },
      data: {
        endTime: now,
        durationMinutes,
      },
    });
  }

  /**
   * Get current attendance status for an employee
   */
  async getStatus(employeeId: string): Promise<any> {
    const activeSession = await this.prisma.attendanceSession.findFirst({
      where: { employeeId, status: 'OPEN' },
      include: {
        breaks: {
          orderBy: { startTime: 'desc' },
        },
      },
    });

    const activeBreak = activeSession?.breaks.find((b) => !b.endTime) || null;

    // Calculate today's total closed minutes & breaks
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const closedToday = await this.prisma.attendanceSession.findMany({
      where: {
        employeeId,
        status: 'CLOSED',
        clockInAt: { gte: startOfDay },
      },
      include: {
        breaks: true,
      },
    });

    const completedMinutesToday = closedToday.reduce(
      (sum, s) => sum + (s.totalDurationMinutes || 0),
      0
    );

    const totalBreakMinutesToday =
      closedToday.reduce((sum, s) => sum + s.breaks.reduce((bSum, b) => bSum + (b.durationMinutes || 0), 0), 0) +
      (activeSession?.breaks?.reduce((sum, b) => sum + (b.durationMinutes || 0), 0) || 0);

    // Calculate this week's completed minutes (starting from Monday)
    const startOfWeek = new Date();
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const closedThisWeek = await this.prisma.attendanceSession.findMany({
      where: {
        employeeId,
        status: 'CLOSED',
        clockInAt: { gte: startOfWeek },
      },
    });

    const completedMinutesThisWeek = closedThisWeek.reduce(
      (sum, s) => sum + (s.totalDurationMinutes || 0),
      0
    );

    return {
      isClockedIn: !!activeSession,
      hasOpenSession: !!activeSession,
      activeSession,
      currentSession: activeSession,
      isOnBreak: !!activeBreak,
      activeBreak,
      currentBreak: activeBreak,
      completedMinutesToday,
      totalBreakMinutesToday,
      completedMinutesThisWeek,
    };
  }

  /**
   * Get historical sessions for an employee
   */
  async getHistory(employeeId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const where: any = { employeeId };
    if (startDate || endDate) {
      where.clockInAt = {};
      if (startDate) where.clockInAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.clockInAt.lte = end;
      }
    }

    return this.prisma.attendanceSession.findMany({
      where,
      include: {
        breaks: true,
      },
      orderBy: { clockInAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Get team attendance for manager
   */
  async getTeamStatus(managerEmployeeId: string): Promise<any[]> {
    const directReports = await this.prisma.employeeReportingHistory.findMany({
      where: {
        managerId: managerEmployeeId,
        isPrimary: true,
        effectiveTo: null,
      },
      include: {
        employee: {
          include: {
            department: { select: { name: true } },
            designation: { select: { title: true } },
          },
        },
      },
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const teamStatusList = await Promise.all(
      directReports.map(async (dr) => {
        const active = await this.prisma.attendanceSession.findFirst({
          where: { employeeId: dr.employee.id, status: 'OPEN' },
          include: { breaks: { where: { endTime: null } } },
        });

        let status = 'NOT_CLOCKED_IN';
        if (active) {
          status = active.breaks.length > 0 ? 'ON_BREAK' : 'CLOCKED_IN';
        }

        return {
          employee: dr.employee,
          status,
          clockInAt: active?.clockInAt || null,
        };
      })
    );

    return teamStatusList;
  }

  /**
   * Request attendance correction
   */
  async requestCorrection(
    employeeId: string,
    data: {
      sessionId?: string;
      requestedClockInAt: string;
      requestedClockOutAt: string;
      reason: string;
    }
  ): Promise<any> {
    return this.prisma.attendanceCorrection.create({
      data: {
        employeeId,
        sessionId: data.sessionId,
        requestedClockInAt: new Date(data.requestedClockInAt),
        requestedClockOutAt: new Date(data.requestedClockOutAt),
        reason: data.reason,
        status: 'PENDING',
      },
    });
  }

  /**
   * Review attendance correction (Approve / Reject)
   */
  async reviewCorrection(
    correctionId: string,
    reviewerEmployeeId: string,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string
  ): Promise<any> {
    const correction = await this.prisma.attendanceCorrection.findUnique({
      where: { id: correctionId },
    });

    if (!correction) {
      throw new NotFoundException('Correction request not found');
    }

    if (correction.status !== 'PENDING') {
      throw new BadRequestException('This correction request has already been reviewed');
    }

    const updated = await this.prisma.attendanceCorrection.update({
      where: { id: correctionId },
      data: {
        status: decision,
        reviewedById: reviewerEmployeeId,
        reviewedAt: new Date(),
        comments,
      },
    });

    // If approved, update or create the session
    if (decision === 'APPROVED') {
      const durationMinutes = Math.max(
        0,
        Math.round(
          (correction.requestedClockOutAt.getTime() - correction.requestedClockInAt.getTime()) /
            60000
        )
      );

      if (correction.sessionId) {
        await this.prisma.attendanceSession.update({
          where: { id: correction.sessionId },
          data: {
            clockInAt: correction.requestedClockInAt,
            clockOutAt: correction.requestedClockOutAt,
            status: 'CLOSED',
            totalDurationMinutes: durationMinutes,
          },
        });
      } else {
        await this.prisma.attendanceSession.create({
          data: {
            employeeId: correction.employeeId,
            clockInAt: correction.requestedClockInAt,
            clockOutAt: correction.requestedClockOutAt,
            status: 'CLOSED',
            totalDurationMinutes: durationMinutes,
            deviceType: 'WEB',
          },
        });
      }
    }

    await this.audit.log({
      actorId: reviewerEmployeeId,
      action: `attendance.correction_${decision.toLowerCase()}`,
      entity: 'attendance_correction',
      entityId: correctionId,
      details: { decision, comments },
    });

    return updated;
  }
}
