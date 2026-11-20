import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async getInvitations(): Promise<ApiResponse<any>> {
    const invites = await this.invitationsService.findAll();
    return {
      success: true,
      data: invites,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async createInvitation(
    @Body() body: { email: string; role?: string; departmentId?: string },
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const invite = await this.invitationsService.create(body, actorId);
    return {
      success: true,
      data: invite,
    };
  }

  @Post('accept')
  async acceptInvitation(
    @Body()
    body: {
      token: string;
      password: string;
      firstName: string;
      lastName: string;
      employeeCode: string;
      phone?: string;
    }
  ): Promise<ApiResponse<any>> {
    const res = await this.invitationsService.accept(body.token, body.password, {
      firstName: body.firstName,
      lastName: body.lastName,
      employeeCode: body.employeeCode,
      phone: body.phone,
    });
    return {
      success: true,
      data: res,
    };
  }
}
