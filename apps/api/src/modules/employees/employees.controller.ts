import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@workhub/permissions';
import { ApiResponse } from '@workhub/contracts';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  async getEmployees(
    @Query('search') search?: string,
    @Query('departmentId') departmentId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ): Promise<ApiResponse<any>> {
    const result = await this.employeesService.findAll({
      search,
      departmentId,
      teamId,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });

    return {
      success: true,
      data: result.items,
      meta: result.meta,
    };
  }

  @Get(':id')
  async getEmployeeById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const employee = await this.employeesService.findById(id);
    return {
      success: true,
      data: employee,
    };
  }

  @Post()
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN)
  async createEmployee(
    @Body() body: any,
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const employee = await this.employeesService.create(body, actorId);
    return {
      success: true,
      data: employee,
    };
  }

  @Patch(':id')
  @Roles(Role.SYSTEM_ADMIN, Role.HR_ADMIN, Role.DEPARTMENT_HEAD)
  async updateEmployee(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser('id') actorId: string
  ): Promise<ApiResponse<any>> {
    const updated = await this.employeesService.update(id, body, actorId);
    return {
      success: true,
      data: updated,
    };
  }
}
