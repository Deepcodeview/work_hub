import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('organization')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('tree')
  async getOrgTree(): Promise<ApiResponse<any>> {
    const tree = await this.orgService.getOrgTree();
    return {
      success: true,
      data: tree,
    };
  }

  @Get('reporting-team/:managerId')
  async getReportingTeam(
    @Param('managerId') managerId: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ApiResponse<any>> {
    // If not Admin or HR, users can only query their own reporting team
    if (
      !user.roles.includes('SYSTEM_ADMIN') &&
      !user.roles.includes('HR_ADMIN') &&
      user.employeeId !== managerId
    ) {
      throw new ForbiddenException('You can only view your own authorized reporting team');
    }

    const team = await this.orgService.getReportingTeam(managerId);
    return {
      success: true,
      data: team,
    };
  }

  @Post('assign-manager')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
  async assignManager(
    @Body() body: { employeeId: string; managerId: string | null; reason?: string },
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const result = await this.orgService.assignManager(
      body.employeeId,
      body.managerId,
      body.reason,
      actorId
    );
    return {
      success: true,
      data: result.data,
    };
  }
}
