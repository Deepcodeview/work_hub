import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { HrmsService, ApplyLeaveDto, CreatePayrollRunDto } from './hrms.service';

@Controller('hrms')
@UseGuards(JwtAuthGuard)
export class HrmsController {
  constructor(private readonly hrmsService: HrmsService) {}

  @Get('leave-types')
  async getLeaveTypes() {
    return this.hrmsService.getLeaveTypes();
  }

  @Get('leave-balances')
  async getLeaveBalances(@Req() req: any, @Query('year') year?: string) {
    try {
      const employeeId = await this.hrmsService.resolveEmployeeId(req.user);
      return this.hrmsService.getLeaveBalances(employeeId, year ? parseInt(year, 10) : undefined);
    } catch {
      return [];
    }
  }

  @Post('leaves/apply')
  async applyLeave(@Body() dto: ApplyLeaveDto, @Req() req: any) {
    const employeeId = await this.hrmsService.resolveEmployeeId(req.user);
    return this.hrmsService.applyLeave(employeeId, dto);
  }

  @Get('leaves/my-requests')
  async getMyLeaves(@Req() req: any) {
    try {
      const employeeId = await this.hrmsService.resolveEmployeeId(req.user);
      return this.hrmsService.getMyLeaveRequests(employeeId);
    } catch {
      return [];
    }
  }

  @Get('leaves/pending-approvals')
  async getPendingLeaves(@Req() req: any) {
    try {
      const employeeId = await this.hrmsService.resolveEmployeeId(req.user);
      const isSuperAdmin =
        req.user?.roles?.includes('SYSTEM_ADMIN') || req.user?.roles?.includes('HR_ADMIN');
      return this.hrmsService.getPendingApprovals(employeeId, isSuperAdmin);
    } catch {
      return [];
    }
  }

  @Patch('leaves/:id/approve')
  async approveLeave(@Param('id') id: string, @Body('comments') comments: string, @Req() req: any) {
    const employeeId = await this.hrmsService.resolveEmployeeId(req.user);
    return this.hrmsService.approveLeave(id, employeeId, comments);
  }

  @Patch('leaves/:id/reject')
  async rejectLeave(@Param('id') id: string, @Body('comments') comments: string, @Req() req: any) {
    const employeeId = await this.hrmsService.resolveEmployeeId(req.user);
    return this.hrmsService.rejectLeave(id, employeeId, comments);
  }

  @Get('payroll/runs')
  async getPayrollRuns() {
    return this.hrmsService.getPayrollRuns();
  }

  @Post('payroll/runs')
  async createPayrollRun(@Body() dto: CreatePayrollRunDto, @Req() req: any) {
    return this.hrmsService.createPayrollRun(req.user.employeeId, dto);
  }

  @Get('payroll/payslips')
  async getMyPayslips(@Req() req: any) {
    return this.hrmsService.getPayslips(req.user.employeeId);
  }

  @Get('payroll/all-payslips')
  async getAllPayslips(@Query('runId') runId?: string) {
    return this.hrmsService.getAllPayslips(runId);
  }

  @Get('payroll/assignments')
  async getSalaryAssignments() {
    return this.hrmsService.getSalaryAssignments();
  }

  @Post('payroll/assignments')
  async assignSalary(
    @Body()
    dto: {
      employeeId: string;
      baseSalary: number;
      paymentMethod?: string;
      structureId?: string;
    }
  ) {
    return this.hrmsService.assignSalary(dto);
  }

  @Get('payroll/salary-structures')
  async getSalaryStructures() {
    return this.hrmsService.getSalaryStructures();
  }

  @Post('payroll/salary-structures')
  async createSalaryStructure(
    @Body()
    dto: {
      name: string;
      code: string;
      currency?: string;
      components?: { name: string; type: string; amount: number; isStatutory?: boolean }[];
    }
  ) {
    return this.hrmsService.createSalaryStructure(dto);
  }
}
