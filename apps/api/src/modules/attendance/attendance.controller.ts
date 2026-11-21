import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  async clockIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { latitude?: number; longitude?: number; accuracy?: number; address?: string; deviceType?: string }
  ): Promise<ApiResponse<any>> {
    const employeeId = await this.attendanceService.resolveEmployeeId(user);
    const session = await this.attendanceService.clockIn(
      employeeId,
      body,
      body.deviceType || 'WEB',
      user.id
    );
    return {
      success: true,
      data: session,
    };
  }

  @Post('clock-out')
  async clockOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { latitude?: number; longitude?: number; accuracy?: number; address?: string; deviceType?: string }
  ): Promise<ApiResponse<any>> {
    const employeeId = await this.attendanceService.resolveEmployeeId(user);
    const session = await this.attendanceService.clockOut(
      employeeId,
      body,
      body.deviceType || 'WEB',
      user.id
    );
    return {
      success: true,
      data: session,
    };
  }

  @Post('breaks/start')
  async startBreak(
    @CurrentUser() user: AuthenticatedUser,
    @Body('breakType') breakType?: string
  ): Promise<ApiResponse<any>> {
    const employeeId = await this.attendanceService.resolveEmployeeId(user);
    const brk = await this.attendanceService.startBreak(employeeId, breakType);
    return {
      success: true,
      data: brk,
    };
  }

  @Post('breaks/end')
  async endBreak(@CurrentUser() user: AuthenticatedUser): Promise<ApiResponse<any>> {
    const employeeId = await this.attendanceService.resolveEmployeeId(user);
    const brk = await this.attendanceService.endBreak(employeeId);
    return {
      success: true,
      data: brk,
    };
  }

  @Get('status')
  async getStatus(@CurrentUser() user: AuthenticatedUser): Promise<ApiResponse<any>> {
    try {
      const employeeId = await this.attendanceService.resolveEmployeeId(user);
      const status = await this.attendanceService.getStatus(employeeId);
      return {
        success: true,
        data: status,
      };
    } catch {
      return {
        success: true,
        data: { isClockedIn: false, isOnBreak: false, completedMinutesToday: 0 },
      };
    }
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ): Promise<ApiResponse<any>> {
    try {
      const employeeId = await this.attendanceService.resolveEmployeeId(user);
      const history = await this.attendanceService.getHistory(employeeId, startDate, endDate);
      return {
        success: true,
        data: history,
      };
    } catch {
      return { success: true, data: [] };
    }
  }

  @Get('team')
  @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async getTeamAttendance(@CurrentUser() user: AuthenticatedUser): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      return { success: true, data: [] };
    }
    const team = await this.attendanceService.getTeamStatus(user.employeeId);
    return {
      success: true,
      data: team,
    };
  }

  @Post('corrections')
  async requestCorrection(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      sessionId?: string;
      requestedClockInAt: string;
      requestedClockOutAt: string;
      reason: string;
    }
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const correction = await this.attendanceService.requestCorrection(user.employeeId, body);
    return {
      success: true,
      data: correction,
    };
  }

  @Patch('corrections/:id')
  @Roles(Role.REPORTING_MANAGER, Role.HR_ADMIN, Role.SYSTEM_ADMIN)
  async reviewCorrection(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; comments?: string }
  ): Promise<ApiResponse<any>> {
    if (!user.employeeId) {
      throw new BadRequestException('No associated employee profile');
    }
    const reviewed = await this.attendanceService.reviewCorrection(
      id,
      user.employeeId,
      body.decision,
      body.comments
    );
    return {
      success: true,
      data: reviewed,
    };
  }
}
