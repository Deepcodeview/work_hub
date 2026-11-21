import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ApplyLeaveDto {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
}

export interface CreatePayrollRunDto {
  month: number;
  year: number;
}

@Injectable()
export class HrmsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaveTypes(): Promise<any[]> {
    return this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
  }

  async getLeaveBalances(employeeId: string, year: number = new Date().getFullYear()): Promise<any[]> {
    return this.prisma.leaveBalance.findMany({
      where: { employeeId, year },
      include: { leaveType: true },
    });
  }

  async applyLeave(employeeId: string, dto: ApplyLeaveDto): Promise<any> {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);

    if (end < start) {
      throw new BadRequestException('End date cannot precede start date');
    }
    if (dto.daysCount <= 0) {
      throw new BadRequestException('Days count must be greater than zero');
    }

    const year = start.getFullYear();
    const balance = await this.prisma.leaveBalance.findUnique({
      where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId: dto.leaveTypeId, year } },
    });

    if (balance) {
      const remaining = balance.totalAccruedDays - balance.usedDays - balance.pendingDays;
      if (dto.daysCount > remaining) {
        throw new BadRequestException(
          `Insufficient leave balance: requested ${dto.daysCount} days, only ${remaining} available`,
        );
      }
    }

    // Resolve primary reporting manager
    const reporting = await this.prisma.employeeReportingHistory.findFirst({
      where: { employeeId, effectiveTo: null, isPrimary: true },
    });

    return this.prisma.$transaction(async (tx: any) => {
      const request = await tx.leaveRequest.create({
        data: {
          employeeId,
          leaveTypeId: dto.leaveTypeId,
          startDate: start,
          endDate: end,
          daysCount: dto.daysCount,
          reason: dto.reason,
          approverManagerId: reporting?.managerId || null,
          status: 'PENDING',
        },
        include: { leaveType: true },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { increment: dto.daysCount } },
        });
      }

      return request;
    });
  }

  async approveLeave(requestId: string, approverEmployeeId: string, comments?: string): Promise<any> {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { leaveType: true },
    });

    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(`Cannot approve request in ${request.status} status`);
    }

    // Strict self-approval prevention
    if (request.employeeId === approverEmployeeId) {
      throw new BadRequestException('Self-approval of leave requests is strictly prohibited');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          decisionComments: comments,
          decidedAt: new Date(),
        },
      });

      const year = request.startDate.getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: { decrement: request.daysCount },
            usedDays: { increment: request.daysCount },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: approverEmployeeId,
          action: 'LEAVE_APPROVED',
          entity: 'LeaveRequest',
          entityId: requestId,
          details: { daysCount: request.daysCount, employeeId: request.employeeId },
        },
      });

      return updated;
    });
  }

  async rejectLeave(requestId: string, approverEmployeeId: string, comments: string): Promise<any> {
    const request = await this.prisma.leaveRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Leave request not found');
    }

    if (request.employeeId === approverEmployeeId) {
      throw new BadRequestException('Cannot reject own leave request');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          decisionComments: comments,
          decidedAt: new Date(),
        },
      });

      const year = request.startDate.getFullYear();
      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: { pendingDays: { decrement: request.daysCount } },
        });
      }

      return updated;
    });
  }

  async getMyLeaveRequests(employeeId: string): Promise<any[]> {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingApprovals(managerEmployeeId: string, isSuperAdmin: boolean = false): Promise<any[]> {
    return this.prisma.leaveRequest.findMany({
      where: isSuperAdmin
        ? { status: 'PENDING' }
        : {
            status: 'PENDING',
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
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // -------------------------------------------------------------
  // Payroll Operations
  // -------------------------------------------------------------

  async createPayrollRun(actorEmployeeId: string, dto: CreatePayrollRunDto): Promise<any> {
    const existing = await this.prisma.payrollRun.findUnique({
      where: {
        payPeriodMonth_payPeriodYear: {
          payPeriodMonth: dto.month,
          payPeriodYear: dto.year,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Payroll run for ${dto.month}/${dto.year} already exists`);
    }

    let assignments = await this.prisma.employeeSalaryAssignment.findMany({
      include: {
        structure: {
          include: { components: true },
        },
        employee: true,
      },
    });

    // If no explicit assignments exist in the database, automatically initialize active employees with standard package
    if (assignments.length === 0) {
      const activeEmployees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
      });
      if (activeEmployees.length > 0) {
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

        for (const emp of activeEmployees) {
          await this.prisma.employeeSalaryAssignment.create({
            data: {
              employeeId: emp.id,
              structureId: structure.id,
              baseSalary: 6500,
              paymentMethod: 'DIRECT_DEPOSIT',
            },
          });
        }

        assignments = await this.prisma.employeeSalaryAssignment.findMany({
          include: {
            structure: {
              include: { components: true },
            },
            employee: true,
          },
        });
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;

      const run = await tx.payrollRun.create({
        data: {
          payPeriodMonth: dto.month,
          payPeriodYear: dto.year,
          status: 'APPROVED',
          processedById: actorEmployeeId,
          approvedAt: new Date(),
        },
      });

      for (const assign of assignments) {
        const gross = assign.baseSalary;
        // Standard statutory tax deduction calculation (15% statutory withholding)
        const deductions = Math.round(gross * 0.15 * 100) / 100;
        const net = gross - deductions;

        totalGross += gross;
        totalDeductions += deductions;
        totalNet += net;

        await tx.payslip.create({
          data: {
            payrollRunId: run.id,
            employeeId: assign.employeeId,
            grossPay: gross,
            deductions,
            netPay: net,
            daysWorked: 30,
            status: 'ISSUED',
          },
        });
      }

      const updatedRun = await tx.payrollRun.update({
        where: { id: run.id },
        data: {
          totalGrossPay: totalGross,
          totalDeductions,
          totalNetPay: totalNet,
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: actorEmployeeId,
          action: 'PAYROLL_EXECUTED',
          entity: 'PayrollRun',
          entityId: run.id,
          details: { month: dto.month, year: dto.year, totalNetPay: totalNet, employeesCount: assignments.length },
        },
      });

      return updatedRun || run;
    });
  }

  async getPayslips(employeeId: string): Promise<any[]> {
    return this.prisma.payslip.findMany({
      where: { employeeId },
      include: {
        payrollRun: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPayslips(runId?: string): Promise<any[]> {
    const where: any = {};
    if (runId) {
      where.payrollRunId = runId;
    }
    return this.prisma.payslip.findMany({
      where,
      include: {
        payrollRun: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayrollRuns(): Promise<any[]> {
    return this.prisma.payrollRun.findMany({
      include: {
        _count: { select: { payslips: true } },
      },
      orderBy: [{ payPeriodYear: 'desc' }, { payPeriodMonth: 'desc' }],
    });
  }

  async getSalaryAssignments(): Promise<any[]> {
    return this.prisma.employeeSalaryAssignment.findMany({
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: { select: { id: true, name: true } },
            designation: { select: { id: true, title: true } },
          },
        },
        structure: {
          include: { components: true },
        },
      },
      orderBy: { effectiveDate: 'desc' },
    });
  }

  async assignSalary(data: {
    employeeId: string;
    baseSalary: number;
    paymentMethod?: string;
    structureId?: string;
  }): Promise<any> {
    let structureId = data.structureId;
    if (!structureId) {
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
      structureId = structure.id;
    }

    return this.prisma.employeeSalaryAssignment.upsert({
      where: { employeeId: data.employeeId },
      update: {
        baseSalary: Number(data.baseSalary),
        paymentMethod: data.paymentMethod || 'DIRECT_DEPOSIT',
        structureId,
        effectiveDate: new Date(),
      },
      create: {
        employeeId: data.employeeId,
        baseSalary: Number(data.baseSalary),
        paymentMethod: data.paymentMethod || 'DIRECT_DEPOSIT',
        structureId,
        effectiveDate: new Date(),
      },
      include: {
        employee: true,
        structure: true,
      },
    });
  }

  async getSalaryStructures(): Promise<any[]> {
    return this.prisma.salaryStructure.findMany({
      include: {
        components: true,
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSalaryStructure(data: {
    name: string;
    code: string;
    currency?: string;
    components?: { name: string; type: string; amount: number; isStatutory?: boolean }[];
  }): Promise<any> {
    return this.prisma.salaryStructure.create({
      data: {
        name: data.name,
        code: data.code,
        currency: data.currency || 'USD',
        ...(data.components && data.components.length > 0 && {
          components: {
            create: data.components.map((c) => ({
              name: c.name,
              type: c.type,
              amount: c.amount,
              isStatutory: !!c.isStatutory,
            })),
          },
        }),
      },
      include: {
        components: true,
      },
    });
  }
}
