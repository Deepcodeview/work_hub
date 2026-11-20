import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AutomationsService', () => {
  let service: AutomationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      automationRule: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      automationRun: {
        create: jest.fn(),
      },
      notification: {
        create: jest.fn(),
      },
      aiActionConfirmation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      task: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AutomationsService>(AutomationsService);
  });

  describe('triggerEvent', () => {
    it('executes actions and records SUCCESS when conditions match', async () => {
      prisma.automationRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          name: 'Notify on Task Created',
          triggerEvent: 'TASK_CREATED',
          isActive: true,
          conditions: { priority: 'URGENT' },
          actions: [{ type: 'SEND_NOTIFICATION' }],
        },
      ]);
      prisma.automationRun.create.mockResolvedValue({ id: 'run-1', status: 'SUCCESS' });
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' });

      const results = await service.triggerEvent('TASK_CREATED', {
        priority: 'URGENT',
        recipientId: 'emp-1',
      });

      expect(results).toHaveLength(1);
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            recipientId: 'emp-1',
            type: 'SYSTEM',
          }),
        }),
      );
      expect(prisma.automationRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: 'rule-1',
            status: 'SUCCESS',
          }),
        }),
      );
    });

    it('records SKIPPED when conditions do not match', async () => {
      prisma.automationRule.findMany.mockResolvedValue([
        {
          id: 'rule-1',
          name: 'Notify on Task Created',
          triggerEvent: 'TASK_CREATED',
          isActive: true,
          conditions: { priority: 'URGENT' },
          actions: [{ type: 'SEND_NOTIFICATION' }],
        },
      ]);
      prisma.automationRun.create.mockResolvedValue({ id: 'run-skipped', status: 'SKIPPED' });

      const results = await service.triggerEvent('TASK_CREATED', {
        priority: 'LOW',
        recipientId: 'emp-1',
      });

      expect(results).toHaveLength(0);
      expect(prisma.notification.create).not.toHaveBeenCalled();
      expect(prisma.automationRun.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            ruleId: 'rule-1',
            status: 'SKIPPED',
          }),
        }),
      );
    });
  });

  describe('AI Action Confirmation', () => {
    it('proposes an AI action with PENDING_CONFIRMATION status', async () => {
      prisma.aiActionConfirmation.create.mockResolvedValue({
        id: 'conf-1',
        employeeId: 'emp-1',
        actionType: 'CREATE_TASK',
        status: 'PENDING_CONFIRMATION',
      });

      const res = await service.proposeAiAction('emp-1', {
        actionType: 'CREATE_TASK',
        proposedPayload: { projectId: 'p1', taskCode: 'DEV-1', title: 'Test Task' },
      });

      expect(res.status).toBe('PENDING_CONFIRMATION');
      expect(prisma.aiActionConfirmation.create).toHaveBeenCalled();
    });

    it('confirms and executes AI action with audit logging', async () => {
      prisma.aiActionConfirmation.findUnique.mockResolvedValue({
        id: 'conf-1',
        employeeId: 'emp-1',
        actionType: 'CREATE_TASK',
        proposedPayload: {
          projectId: 'p1',
          taskCode: 'DEV-1',
          title: 'Automated Task',
          description: 'Created via AI confirmation',
        },
        status: 'PENDING_CONFIRMATION',
      });
      prisma.aiActionConfirmation.update.mockResolvedValue({
        id: 'conf-1',
        status: 'CONFIRMED',
      });

      const res = await service.confirmAiAction('conf-1', 'emp-1');

      expect(res.status).toBe('CONFIRMED');
      expect(prisma.task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            taskCode: 'DEV-1',
            title: 'Automated Task',
            creatorId: 'emp-1',
          }),
        }),
      );
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            actorId: 'emp-1',
            action: 'AI_ACTION_CONFIRMED',
          }),
        }),
      );
    });

    it('rejects confirmation if employee is unauthorized', async () => {
      prisma.aiActionConfirmation.findUnique.mockResolvedValue({
        id: 'conf-1',
        employeeId: 'emp-1',
        status: 'PENDING_CONFIRMATION',
      });

      await expect(service.confirmAiAction('conf-1', 'emp-other')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('rejects confirmation if not found', async () => {
      prisma.aiActionConfirmation.findUnique.mockResolvedValue(null);

      await expect(service.confirmAiAction('non-existent', 'emp-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
