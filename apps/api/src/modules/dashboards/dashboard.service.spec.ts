import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      attendanceSession: {
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      task: {
        count: jest.fn(),
      },
      project: {
        count: jest.fn(),
      },
      notification: {
        count: jest.fn(),
      },
      employeeReportingHistory: {
        findMany: jest.fn(),
      },
      timesheet: {
        count: jest.fn(),
      },
      employee: {
        count: jest.fn(),
      },
      department: {
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should return aggregated personal metrics for an employee', async () => {
    prisma.attendanceSession.findFirst.mockResolvedValue({
      id: 'session-1',
      status: 'OPEN',
      clockInAt: new Date(),
      totalDurationMinutes: 120,
      breaks: [],
    });
    prisma.task.count.mockResolvedValue(5);
    prisma.project.count.mockResolvedValue(2);
    prisma.notification.count.mockResolvedValue(3);

    const summary = await service.getDashboardSummary('emp-1', ['EMPLOYEE']);

    expect(summary.personal.attendance.hasActiveSession).toBe(true);
    expect(summary.personal.attendance.netDurationMinutes).toBe(120);
    expect(summary.personal.openTasksCount).toBe(5);
    expect(summary.personal.activeProjectsCount).toBe(2);
    expect(summary.personal.unreadNotificationsCount).toBe(3);
    expect(summary.manager).toBeNull();
  });

  it('should include team metrics when user has REPORTING_MANAGER role', async () => {
    prisma.attendanceSession.findFirst.mockResolvedValue(null);
    prisma.task.count.mockResolvedValue(0);
    prisma.project.count.mockResolvedValue(0);
    prisma.notification.count.mockResolvedValue(0);
    prisma.employeeReportingHistory.findMany.mockResolvedValue([
      { employeeId: 'sub-1' },
      { employeeId: 'sub-2' },
    ]);
    prisma.attendanceSession.count.mockResolvedValue(1);
    prisma.timesheet.count.mockResolvedValue(3);

    const summary = await service.getDashboardSummary('emp-mgr', ['REPORTING_MANAGER']);

    expect(summary.manager).toBeDefined();
    expect(summary.manager.teamTotal).toBe(2);
    expect(summary.manager.teamClockedIn).toBe(1);
    expect(summary.manager.pendingTimesheetApprovals).toBe(3);
  });
});
