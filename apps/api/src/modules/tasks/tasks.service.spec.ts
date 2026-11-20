import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      task: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      taskAssignee: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      taskDependency: {
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      taskActivity: {
        create: jest.fn(),
      },
      taskTimeLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should reject creating task with duplicate code', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', taskCode: 'TSK-1' });

    await expect(
      service.create('emp-1', { projectId: 'p-1', taskCode: 'TSK-1', title: 'Task' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject a task depending on itself', async () => {
    await expect(
      service.addDependency('task-1', 'task-1'),
    ).rejects.toThrow('A task cannot depend on itself');
  });

  it('should detect and reject circular dependencies between tasks', async () => {
    prisma.task.findUnique
      .mockResolvedValueOnce({ id: 'task-A', taskCode: 'TSK-A' })
      .mockResolvedValueOnce({ id: 'task-B', taskCode: 'TSK-B' });

    // task-B already depends on task-A
    prisma.taskDependency.findMany.mockImplementation(async ({ where }: any) => {
      if (where.taskId === 'task-B') {
        return [{ dependsOnTaskId: 'task-A' }];
      }
      return [];
    });

    // Trying to make task-A depend on task-B must fail
    await expect(
      service.addDependency('task-A', 'task-B'),
    ).rejects.toThrow('Circular dependency detected between tasks');
  });

  it('should reject marking task as DONE if prerequisite dependencies are incomplete', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: 'task-1',
      taskCode: 'TSK-1',
      status: 'IN_PROGRESS',
      dependencies: [
        {
          dependsOnTaskId: 'dep-1',
          dependsOnTask: { id: 'dep-1', taskCode: 'TSK-DEP', status: 'IN_PROGRESS' },
        },
      ],
    });

    await expect(
      service.update('task-1', 'emp-1', { status: 'DONE' }),
    ).rejects.toThrow('Cannot mark task as DONE because prerequisite dependencies are incomplete');
  });

  it('should record time log and increment actualMinutes on task', async () => {
    prisma.task.findUnique.mockResolvedValue({
      id: 'task-1',
      actualMinutes: 30,
    });
    prisma.taskTimeLog.create.mockResolvedValue({ id: 'log-1', durationMinutes: 45 });
    prisma.task.update.mockResolvedValue({ id: 'task-1', actualMinutes: 75 });

    const result = await service.logTime('task-1', 'emp-1', {
      durationMinutes: 45,
      workDate: '2026-11-19',
      description: 'Feature work',
    });

    expect(result.id).toBe('log-1');
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { actualMinutes: { increment: 45 } },
    });
  });
});
