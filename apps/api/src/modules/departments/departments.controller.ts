import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  async getDepartments(): Promise<ApiResponse<any>> {
    const list = await this.departmentsService.findAll();
    return {
      success: true,
      data: list,
    };
  }

  @Get(':id')
  async getDepartmentById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const dept = await this.departmentsService.findById(id);
    return {
      success: true,
      data: dept,
    };
  }

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async createDepartment(
    @Body() body: any,
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const dept = await this.departmentsService.create(body, actorId);
    return {
      success: true,
      data: dept,
    };
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
  async updateDepartment(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<ApiResponse<any>> {
    // If user is DEPARTMENT_HEAD and not ADMIN, they can only edit their own department
    if (!user.roles.includes('SYSTEM_ADMIN') && !user.roles.includes('HR_ADMIN')) {
      const dept = await this.departmentsService.findById(id);
      if (dept.headId !== user.employeeId) {
        throw new ForbiddenException('Department Heads can only manage their authorized department');
      }
    }

    const updated = await this.departmentsService.update(id, body, user.id);
    return {
      success: true,
      data: updated,
    };
  }

  @Delete(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async deleteDepartment(
    @Param('id') id: string,
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const res = await this.departmentsService.delete(id, actorId);
    return {
      success: true,
      data: res,
    };
  }
}
