import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  async getTeams(@Query('departmentId') departmentId?: string): Promise<ApiResponse<any>> {
    const teams = await this.teamsService.findAll(departmentId);
    return {
      success: true,
      data: teams,
    };
  }

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
  async createTeam(
    @Body() body: any,
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const team = await this.teamsService.create(body, actorId);
    return {
      success: true,
      data: team,
    };
  }
}
