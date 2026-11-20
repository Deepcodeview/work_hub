import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { DesignationsService } from './designations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('designations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DesignationsController {
  constructor(private readonly designationsService: DesignationsService) {}

  @Get()
  async getDesignations(): Promise<ApiResponse<any>> {
    const list = await this.designationsService.findAll();
    return {
      success: true,
      data: list,
    };
  }

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async createDesignation(@Body() body: any): Promise<ApiResponse<any>> {
    const item = await this.designationsService.create(body);
    return {
      success: true,
      data: item,
    };
  }
}
