import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ProjectsService, CreateProjectDto, UpdateProjectDto, AddProjectMemberDto, CreateMilestoneDto } from './projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  async getProjects(@Req() req: any) {
    const isAdmin = req.user?.roles?.includes('SYSTEM_ADMIN');
    return this.projectsService.findAll(req.user.employeeId, isAdmin);
  }

  @Get(':id')
  async getProject(@Param('id') id: string, @Req() req: any) {
    const isAdmin = req.user?.roles?.includes('SYSTEM_ADMIN');
    return this.projectsService.findById(id, req.user.employeeId, isAdmin);
  }

  @Post()
  async createProject(@Body() dto: CreateProjectDto, @Req() req: any) {
    return this.projectsService.create(req.user.employeeId, dto);
  }

  @Patch(':id')
  async updateProject(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Req() req: any) {
    const isAdmin = req.user?.roles?.includes('SYSTEM_ADMIN');
    return this.projectsService.update(id, req.user.employeeId, dto, isAdmin);
  }

  @Post(':id/members')
  async addMember(@Param('id') id: string, @Body() dto: AddProjectMemberDto, @Req() req: any) {
    const isAdmin = req.user?.roles?.includes('SYSTEM_ADMIN');
    return this.projectsService.addMember(id, req.user.employeeId, dto, isAdmin);
  }

  @Delete(':id/members/:employeeId')
  async removeMember(@Param('id') id: string, @Param('employeeId') employeeId: string, @Req() req: any) {
    const isAdmin = req.user?.roles?.includes('SYSTEM_ADMIN');
    return this.projectsService.removeMember(id, req.user.employeeId, employeeId, isAdmin);
  }

  @Post(':id/milestones')
  async createMilestone(@Param('id') id: string, @Body() dto: CreateMilestoneDto, @Req() req: any) {
    const isAdmin = req.user?.roles?.includes('SYSTEM_ADMIN');
    return this.projectsService.createMilestone(id, req.user.employeeId, dto, isAdmin);
  }

  @Patch('milestones/:milestoneId')
  async updateMilestone(@Param('milestoneId') milestoneId: string, @Body('status') status: string) {
    return this.projectsService.updateMilestone(milestoneId, status);
  }
}
