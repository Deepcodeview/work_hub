import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TasksService, CreateTaskDto, UpdateTaskDto, LogTimeDto } from './tasks.service';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get('project/:projectId')
  async getTasksByProject(
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasksService.findByProject(projectId, { status, assigneeId });
  }

  @Get(':id')
  async getTask(@Param('id') id: string) {
    return this.tasksService.findById(id);
  }

  @Post()
  async createTask(@Body() dto: CreateTaskDto, @Req() req: any) {
    return this.tasksService.create(req.user.employeeId, dto);
  }

  @Patch(':id')
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto, @Req() req: any) {
    return this.tasksService.update(id, req.user.employeeId, dto);
  }

  @Post(':id/assign')
  async assignTask(
    @Param('id') id: string,
    @Body('employeeId') employeeId: string,
    @Body('isPrimary') isPrimary: boolean,
    @Req() req: any,
  ) {
    return this.tasksService.assign(id, req.user.employeeId, employeeId, isPrimary);
  }

  @Delete(':id/assign/:employeeId')
  async unassignTask(
    @Param('id') id: string,
    @Param('employeeId') employeeId: string,
    @Req() req: any,
  ) {
    return this.tasksService.unassign(id, req.user.employeeId, employeeId);
  }

  @Post(':id/dependencies')
  async addDependency(
    @Param('id') id: string,
    @Body('dependsOnTaskId') dependsOnTaskId: string,
    @Body('dependencyType') dependencyType: string,
  ) {
    return this.tasksService.addDependency(id, dependsOnTaskId, dependencyType);
  }

  @Delete(':id/dependencies/:dependsOnTaskId')
  async removeDependency(
    @Param('id') id: string,
    @Param('dependsOnTaskId') dependsOnTaskId: string,
  ) {
    return this.tasksService.removeDependency(id, dependsOnTaskId);
  }

  @Post(':id/checklists')
  async addChecklist(@Param('id') id: string, @Body('title') title: string) {
    return this.tasksService.addChecklist(id, title);
  }

  @Patch('checklists/:checklistId')
  async toggleChecklist(@Param('checklistId') checklistId: string, @Body('isCompleted') isCompleted: boolean) {
    return this.tasksService.toggleChecklist(checklistId, isCompleted);
  }

  @Post(':id/comments')
  async addComment(@Param('id') id: string, @Body('content') content: string, @Req() req: any) {
    return this.tasksService.addComment(id, req.user.employeeId, content);
  }

  @Post(':id/time-logs')
  async logTime(@Param('id') id: string, @Body() dto: LogTimeDto, @Req() req: any) {
    return this.tasksService.logTime(id, req.user.employeeId, dto);
  }
}
