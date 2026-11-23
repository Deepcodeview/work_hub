import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateProjectDto {
  code: string;
  name: string;
  description?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  departmentId?: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: string;
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

export interface AddProjectMemberDto {
  employeeId: string;
  role?: string;
}

export interface CreateMilestoneDto {
  title: string;
  description?: string;
  dueDate?: string;
}

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(employeeId: string, isAdmin: boolean = false): Promise<any[]> {
    const where = isAdmin
      ? undefined
      : {
          OR: [
            { ownerId: employeeId },
            { members: { some: { employeeId } } },
          ],
        };

    const raw = await this.prisma.project.findMany({
      ...(where && { where }),
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        tasks: { select: { status: true } },
        _count: { select: { tasks: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const projects = Array.isArray(raw) ? raw : [];
    return projects.map((p: any) => {
      const taskList = Array.isArray(p.tasks) ? p.tasks : [];
      const total = taskList.length;
      const done = taskList.filter((t: any) => t.status === 'DONE' || t.status === 'COMPLETED').length;
      const progress = total > 0 ? Math.round((done / total) * 100) : (p.status === 'COMPLETED' ? 100 : 0);
      const { tasks, ...rest } = p;
      return { ...rest, progress };
    });
  }

  async findById(id: string, employeeId?: string, isAdmin: boolean = false): Promise<any> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, firstName: true, lastName: true, employeeCode: true, email: true } },
        members: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
        milestones: { orderBy: { dueDate: 'asc' } },
        _count: { select: { tasks: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    if (employeeId && !isAdmin) {
      const isMember = project.ownerId === employeeId || project.members.some((m: any) => m.employeeId === employeeId);
      if (!isMember) {
        throw new ForbiddenException('You do not have access to this project');
      }
    }

    return project;
  }

  async create(ownerEmployeeId: string, dto: CreateProjectDto): Promise<any> {
    const existing = await this.prisma.project.findUnique({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException(`Project code ${dto.code} already exists`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      const project = await tx.project.create({
        data: {
          code: dto.code.toUpperCase(),
          name: dto.name,
          description: dto.description,
          priority: dto.priority || 'MEDIUM',
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          budget: dto.budget,
          departmentId: dto.departmentId,
          ownerId: ownerEmployeeId,
        },
      });

      // Automatically add owner as OWNER member
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          employeeId: ownerEmployeeId,
          role: 'OWNER',
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: ownerEmployeeId,
          action: 'PROJECT_CREATED',
          entity: 'Project',
          entityId: project.id,
          details: { code: project.code, name: project.name },
        },
      });

      return project;
    });
  }

  async update(id: string, actorEmployeeId: string, dto: UpdateProjectDto, isAdmin: boolean = false): Promise<any> {
    const project = await this.findById(id);

    if (!isAdmin && project.ownerId !== actorEmployeeId) {
      const membership = await this.prisma.projectMember.findUnique({
        where: { projectId_employeeId: { projectId: id, employeeId: actorEmployeeId } },
      });
      if (!membership || (membership.role !== 'OWNER' && membership.role !== 'MANAGER')) {
        throw new ForbiddenException('Only project owners or managers can modify project details');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.budget !== undefined && { budget: dto.budget }),
      },
    });
  }

  async addMember(projectId: string, actorEmployeeId: string, dto: AddProjectMemberDto, isAdmin: boolean = false): Promise<any> {
    const project = await this.findById(projectId);
    if (!isAdmin && project.ownerId !== actorEmployeeId) {
      const member = await this.prisma.projectMember.findUnique({
        where: { projectId_employeeId: { projectId, employeeId: actorEmployeeId } },
      });
      if (!member || (member.role !== 'OWNER' && member.role !== 'MANAGER')) {
        throw new ForbiddenException('Only project owners or managers can add members');
      }
    }

    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_employeeId: { projectId, employeeId: dto.employeeId } },
    });
    if (existing) {
      throw new BadRequestException('Employee is already a member of this project');
    }

    return this.prisma.projectMember.create({
      data: {
        projectId,
        employeeId: dto.employeeId,
        role: dto.role || 'MEMBER',
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  async removeMember(projectId: string, actorEmployeeId: string, targetEmployeeId: string, isAdmin: boolean = false): Promise<any> {
    const project = await this.findById(projectId);
    if (project.ownerId === targetEmployeeId) {
      throw new BadRequestException('Cannot remove the project owner from members');
    }

    if (!isAdmin && project.ownerId !== actorEmployeeId) {
      throw new ForbiddenException('Only project owner or system admin can remove members');
    }

    return this.prisma.projectMember.delete({
      where: { projectId_employeeId: { projectId, employeeId: targetEmployeeId } },
    });
  }

  async createMilestone(projectId: string, actorEmployeeId: string, dto: CreateMilestoneDto, isAdmin: boolean = false): Promise<any> {
    await this.findById(projectId, actorEmployeeId, isAdmin);

    return this.prisma.projectMilestone.create({
      data: {
        projectId,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
    });
  }

  async updateMilestone(milestoneId: string, status: string): Promise<any> {
    return this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: { status },
    });
  }
}
