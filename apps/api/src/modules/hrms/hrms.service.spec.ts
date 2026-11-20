import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { HrmsService } from './hrms.service';
import { PrismaService } from '../prisma/prisma.service';

describe('HrmsService', () => {
  let service: HrmsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      leaveType: {
        findMany: jest.fn(),
      },
      leaveBalance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      leaveRequest: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employeeReportingHistory: {
        findFirst: jest.fn(),
      },
      employeeSalaryAssignment: {
        findMany: jest.fn(),
      },
      payrollRun: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      payslip: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HrmsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<HrmsService>(HrmsService);
  });

  it('should reject leave application if requested days exceed available balance', async () => {
    prisma.leaveBalance.findUnique.mockResolvedValue({
      id: 'bal-1',
      totalAccruedDays: 10,
      usedDays: 8,
      pendingDays: 1, // only 1 day remaining
    });

    await expect(
      service.applyLeave('emp-1', {
        leaveTypeId: 'lt-1',
        startDate: '2026-11-20',
        endDate: '2026-11-23',
        daysCount: 3,
        reason: 'Vacation',
      }),
    ).rejects.toThrow('Insufficient leave balance');
  });

  it('should strictly prohibit self-approval of leave requests', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      employeeId: 'emp-applicant',
      status: 'PENDING',
      leaveType: { name: 'PTO' },
    });

    await expect(
      service.approveLeave('req-1', 'emp-applicant', 'Self approved'),
    ).rejects.toThrow('Self-approval of leave requests is strictly prohibited');
  });

  it('should approve leave and update pending and used balances', async () => {
    prisma.leaveRequest.findUnique.mockResolvedValue({
      id: 'req-1',
      employeeId: 'emp-applicant',
      status: 'PENDING',
      daysCount: 2,
      leaveTypeId: 'lt-1',
      startDate: new Date('2026-11-20'),
      leaveType: { name: 'PTO' },
    });
    prisma.leaveRequest.update.mockResolvedValue({ id: 'req-1', status: 'APPROVED' });
    prisma.leaveBalance.findUnique.mockResolvedValue({ id: 'bal-1' });

    const result = await service.approveLeave('req-1', 'emp-manager', 'Approved');

    expect(result.status).toBe('APPROVED');
    expect(prisma.leaveBalance.update).toHaveBeenCalledWith({
      where: { id: 'bal-1' },
      data: {
        pendingDays: { decrement: 2 },
        usedDays: { increment: 2 },
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should execute payroll run and compute net pay with statutory deductions', async () => {
    prisma.payrollRun.findUnique.mockResolvedValue(null);
    prisma.employeeSalaryAssignment.findMany.mockResolvedValue([
      {
        employeeId: 'emp-1',
        baseSalary: 10000,
        structure: { components: [] },
      },
    ]);
    prisma.payrollRun.create.mockResolvedValue({ id: 'run-1' });

    const run = await service.createPayrollRun('emp-admin', { month: 11, year: 2026 });

    expect(run.id).toBe('run-1');
    expect(prisma.payslip.create).toHaveBeenCalledWith({
      data: {
        payrollRunId: 'run-1',
        employeeId: 'emp-1',
        grossPay: 10000,
        deductions: 1500, // 15% statutory withholding
        netPay: 8500,
        daysWorked: 30,
        status: 'ISSUED',
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });
});
