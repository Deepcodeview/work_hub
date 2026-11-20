import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTaskDto {
  projectId: string;
  taskCode: string;
  title: string;
  description?: string;
  priority?: string;
  milestoneId?: string;
  parentTaskId?: string;
  dueDate?: string;
  estimatedMinutes?: number;
  assigneeIds?: string[];
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  milestoneId?: string;
  dueDate?: string;
  estimatedMinutes?: number;
}

export interface LogTimeDto {
  durationMinutes: number;
  workDate: string;
  description?: string;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findByProject(projectId: string, filters?: { status?: string; assigneeId?: string }): Promise<any[]> {
    const where: any = { projectId };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.assigneeId) {
      where.assignees = { some: { employeeId: filters.assigneeId } };
    }

    return this.prisma.task.findMany({
      where,
      include: {
        assignees: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
        milestone: { select: { id: true, title: true } },
        dependencies: { select: { dependsOnTaskId: true, dependencyType: true } },
        _count: { select: { checklists: true, comments: true, subtasks: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<any> {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, code: true } },
        creator: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        assignees: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
        milestone: true,
        parentTask: { select: { id: true, title: true, taskCode: true } },
        subtasks: true,
        dependencies: {
          include: {
            dependsOnTask: { select: { id: true, title: true, taskCode: true, status: true } },
          },
        },
        dependents: {
          include: {
            task: { select: { id: true, title: true, taskCode: true, status: true } },
          },
        },
        checklists: { orderBy: { sortOrder: 'asc' } },
        comments: {
          include: {
            author: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        timeLogs: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
          orderBy: { workDate: 'desc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(creatorEmployeeId: string, dto: CreateTaskDto): Promise<any> {
    const existing = await this.prisma.task.findUnique({ where: { taskCode: dto.taskCode } });
    if (existing) {
      throw new BadRequestException(`Task code ${dto.taskCode} already exists`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      const task = await tx.task.create({
        data: {
          projectId: dto.projectId,
          taskCode: dto.taskCode.toUpperCase(),
          title: dto.title,
          description: dto.description,
          priority: dto.priority || 'MEDIUM',
          milestoneId: dto.milestoneId,
          parentTaskId: dto.parentTaskId,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          estimatedMinutes: dto.estimatedMinutes || 0,
          creatorId: creatorEmployeeId,
        },
      });

      if (dto.assigneeIds && dto.assigneeIds.length > 0) {
        for (let i = 0; i < dto.assigneeIds.length; i++) {
          await tx.taskAssignee.create({
            data: {
              taskId: task.id,
              employeeId: dto.assigneeIds[i],
              isPrimary: i === 0,
            },
          });
        }
      }

      await tx.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: creatorEmployeeId,
          action: 'TASK_CREATED',
          details: { title: task.title, taskCode: task.taskCode },
        },
      });

      return task;
    });
  }

  async update(id: string, actorEmployeeId: string, dto: UpdateTaskDto): Promise<any> {
    const task = await this.findById(id);

    // If changing status to DONE, verify all prerequisite dependencies are completed
    if (dto.status === 'DONE' && task.status !== 'DONE') {
      const pendingDependencies = task.dependencies.filter(
        (dep: any) => dep.dependsOnTask.status !== 'DONE',
      );
      if (pendingDependencies.length > 0) {
        const blockingCodes = pendingDependencies.map((d: any) => d.dependsOnTask.taskCode).join(', ');
        throw new BadRequestException(
          `Cannot mark task as DONE because prerequisite dependencies are incomplete: ${blockingCodes}`,
        );
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      const updated = await tx.task.update({
        where: { id },
        data: {
          ...(dto.title && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.status && { status: dto.status }),
          ...(dto.priority && { priority: dto.priority }),
          ...(dto.milestoneId !== undefined && { milestoneId: dto.milestoneId }),
          ...(dto.dueDate !== undefined && { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }),
          ...(dto.estimatedMinutes !== undefined && { estimatedMinutes: dto.estimatedMinutes }),
        },
      });

      if (dto.status && dto.status !== task.status) {
        await tx.taskActivity.create({
          data: {
            taskId: id,
            actorId: actorEmployeeId,
            action: 'STATUS_CHANGED',
            details: { from: task.status, to: dto.status },
          },
        });
      }

      return updated;
    });
  }

  async assign(taskId: string, actorEmployeeId: string, employeeId: string, isPrimary: boolean = false): Promise<any> {
    await this.findById(taskId);

    const existing = await this.prisma.taskAssignee.findUnique({
      where: { taskId_employeeId: { taskId, employeeId } },
    });
    if (existing) {
      throw new BadRequestException('Employee is already assigned to this task');
    }

    const assignment = await this.prisma.taskAssignee.create({
      data: {
        taskId,
        employeeId,
        isPrimary,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });

    await this.prisma.taskActivity.create({
      data: {
        taskId,
        actorId: actorEmployeeId,
        action: 'ASSIGNEE_ADDED',
        details: { employeeId },
      },
    });

    return assignment;
  }

  async unassign(taskId: string, actorEmployeeId: string, employeeId: string): Promise<any> {
    await this.findById(taskId);

    const deleted = await this.prisma.taskAssignee.delete({
      where: { taskId_employeeId: { taskId, employeeId } },
    });

    await this.prisma.taskActivity.create({
      data: {
        taskId,
        actorId: actorEmployeeId,
        action: 'ASSIGNEE_REMOVED',
        details: { employeeId },
      },
    });

    return deleted;
  }

  async addDependency(taskId: string, dependsOnTaskId: string, dependencyType: string = 'FINISH_TO_START'): Promise<any> {
    if (taskId === dependsOnTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    await this.findById(taskId);
    await this.findById(dependsOnTaskId);

    // Cycle detection: traverse dependencies starting from dependsOnTaskId to see if taskId is reachable
    const visited = new Set<string>();
    const queue = [dependsOnTaskId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === taskId) {
        throw new BadRequestException('Circular dependency detected between tasks');
      }

      if (!visited.has(current)) {
        visited.add(current);
        const deps = await this.prisma.taskDependency.findMany({
          where: { taskId: current },
          select: { dependsOnTaskId: true },
        });
        for (const dep of deps) {
          queue.push(dep.dependsOnTaskId);
        }
      }
    }

    return this.prisma.taskDependency.create({
      data: {
        taskId,
        dependsOnTaskId,
        dependencyType,
      },
    });
  }

  async removeDependency(taskId: string, dependsOnTaskId: string): Promise<any> {
    return this.prisma.taskDependency.delete({
      where: { taskId_dependsOnTaskId: { taskId, dependsOnTaskId } },
    });
  }

  async addChecklist(taskId: string, title: string): Promise<any> {
    await this.findById(taskId);
    return this.prisma.taskChecklist.create({
      data: {
        taskId,
        title,
      },
    });
  }

  async toggleChecklist(checklistId: string, isCompleted: boolean): Promise<any> {
    return this.prisma.taskChecklist.update({
      where: { id: checklistId },
      data: { isCompleted },
    });
  }

  async addComment(taskId: string, authorEmployeeId: string, content: string): Promise<any> {
    await this.findById(taskId);
    return this.prisma.taskComment.create({
      data: {
        taskId,
        authorId: authorEmployeeId,
        content,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
    });
  }

  async logTime(taskId: string, employeeId: string, dto: LogTimeDto): Promise<any> {
    if (dto.durationMinutes <= 0) {
      throw new BadRequestException('Duration must be greater than zero minutes');
    }

    await this.findById(taskId);

    return this.prisma.$transaction(async (tx: any) => {
      const log = await tx.taskTimeLog.create({
        data: {
          taskId,
          employeeId,
          durationMinutes: dto.durationMinutes,
          workDate: new Date(dto.workDate),
          description: dto.description,
        },
      });

      await tx.task.update({
        where: { id: taskId },
        data: { actualMinutes: { increment: dto.durationMinutes } },
      });

      return log;
    });
  }
}
