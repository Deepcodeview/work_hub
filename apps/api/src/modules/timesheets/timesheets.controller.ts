import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { TimesheetsService, TimesheetEntryInput } from './timesheets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('timesheets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimesheetsController {
  constructor(private readonly timesheetsService: TimesheetsService) {}

  @Get('daily')
  async getDailyTimesheet(
    @CurrentUser() user: AuthenticatedUser,
    @Query('workDate') workDate?: string
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const targetDate = workDate || new Date().toISOString().split('T')[0];
    const ts = await this.timesheetsService.getDailyTimesheet(user.employeeId, targetDate);
    return {
      success: true,
      data: ts,
    };
  }

  @Post('daily')
  async saveDraftEntries(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { workDate: string; entries: TimesheetEntryInput[] }
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const ts = await this.timesheetsService.saveDraftEntries(
      user.employeeId,
      body.workDate,
      body.entries || []
    );
    return {
      success: true,
      data: ts,
    };
  }

  @Post(':id/submit')
  async submitTimesheet(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const submitted = await this.timesheetsService.submitTimesheet(id, user.employeeId);
    return {
      success: true,
      data: submitted,
    };
  }

  @Post(':id/approve')
  @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async approveTimesheet(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('comments') comments?: string
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const isSuperAdmin = user.roles.includes('SYSTEM_ADMIN');
    const approved = await this.timesheetsService.approveTimesheet(
      id,
      user.employeeId,
      comments,
      isSuperAdmin
    );
    return {
      success: true,
      data: approved,
    };
  }

  @Post(':id/reject')
  @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async rejectTimesheet(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('reason') reason: string
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const isSuperAdmin = user.roles.includes('SYSTEM_ADMIN');
    const rejected = await this.timesheetsService.rejectTimesheet(
      id,
      user.employeeId,
      reason,
      isSuperAdmin
    );
    return {
      success: true,
      data: rejected,
    };
  }

  @Get('pending-approvals')
  @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getPendingApprovals(@CurrentUser() user: AuthenticatedUser): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      return { success: true, data: [] };
    }
    const isSuperAdmin =
      user.roles.includes('SYSTEM_ADMIN') || user.roles.includes('HR_ADMIN');
    const pending = await this.timesheetsService.getPendingApprovals(
      user.employeeId,
      isSuperAdmin
    );
    return {
      success: true,
      data: pending,
    };
  }
}
