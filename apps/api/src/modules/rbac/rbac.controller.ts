import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Get()
  async getRoles(): Promise<ApiResponse<any>> {
    const roles = await this.rbacService.listRoles();
    return {
      success: true,
      data: roles,
    };
  }

  @Post('assign')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async assignRole(
    @Body() body: { userId: string; role: string },
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const res = await this.rbacService.assignRole(body.userId, body.role, actorId);
    return {
      success: true,
      data: res,
    };
  }

  @Delete('remove')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async removeRole(
    @Body() body: { userId: string; role: string },
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const res = await this.rbacService.removeRole(body.userId, body.role, actorId);
    return {
      success: true,
      data: res,
    };
  }
}
