import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateRuleDto {
  name: string;
  description?: string;
  triggerEvent: string;
  conditions: Record<string, any>;
  actions: { type: string; target?: string; payload?: any }[];
}

export interface ProposeAiActionDto {
  actionType: 'CREATE_TASK' | 'ASSIGN_MANAGER' | 'APPROVE_TIMESHEET' | 'EXECUTE_PAYROLL';
  proposedPayload: Record<string, any>;
}

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRules(): Promise<any[]> {
    return this.prisma.automationRule.findMany({
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        _count: { select: { runs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRule(creatorId: string, dto: CreateRuleDto): Promise<any> {
    return this.prisma.automationRule.create({
      data: {
        name: dto.name,
        description: dto.description,
        triggerEvent: dto.triggerEvent,
        conditions: dto.conditions,
        actions: dto.actions,
        creatorId,
      },
    });
  }

  async triggerEvent(triggerEvent: string, payload: Record<string, any>): Promise<any[]> {
    const rules = await this.prisma.automationRule.findMany({
      where: { triggerEvent, isActive: true },
    });

    const results = [];

    for (const rule of rules) {
      const conditions = (rule.conditions as Record<string, any>) || {};
      let matches = true;

      for (const [key, expectedValue] of Object.entries(conditions)) {
        if (payload[key] !== expectedValue) {
          matches = false;
          break;
        }
      }

      if (!matches) {
        await this.prisma.automationRun.create({
          data: {
            ruleId: rule.id,
            triggerEvent,
            status: 'SKIPPED',
            inputPayload: payload,
            executionLog: { reason: 'Conditions did not match' },
          },
        });
        continue;
      }

      // Execute actions
      const actions = (rule.actions as any[]) || [];
      const logDetails = [];

      for (const action of actions) {
        if (action.type === 'SEND_NOTIFICATION') {
          await this.prisma.notification.create({
            data: {
              recipientId: payload.recipientId || payload.creatorId,
              title: `[Automation] ${rule.name}`,
              body: `Rule triggered by event: ${triggerEvent}`,
              type: 'SYSTEM',
            },
          });
          logDetails.push({ action: 'SEND_NOTIFICATION', status: 'DELIVERED' });
        }
      }

      const run = await this.prisma.automationRun.create({
        data: {
          ruleId: rule.id,
          triggerEvent,
          status: 'SUCCESS',
          inputPayload: payload,
          executionLog: logDetails,
        },
      });

      results.push(run);
    }

    return results;
  }

  // -------------------------------------------------------------
  // AI Human-In-The-Loop Write Confirmations
  // -------------------------------------------------------------

  async proposeAiAction(employeeId: string, dto: ProposeAiActionDto): Promise<any> {
    return this.prisma.aiActionConfirmation.create({
      data: {
        employeeId,
        actionType: dto.actionType,
        proposedPayload: dto.proposedPayload,
        status: 'PENDING_CONFIRMATION',
      },
    });
  }

  async getPendingConfirmations(employeeId: string): Promise<any[]> {
    return this.prisma.aiActionConfirmation.findMany({
      where: { employeeId, status: 'PENDING_CONFIRMATION' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async confirmAiAction(confirmationId: string, employeeId: string): Promise<any> {
    const confirmation = await this.prisma.aiActionConfirmation.findUnique({
      where: { id: confirmationId },
    });

    if (!confirmation) {
      throw new NotFoundException('Confirmation request not found');
    }

    if (confirmation.employeeId !== employeeId) {
      throw new ForbiddenException('Only the requested employee or admin can confirm this AI action');
    }

    if (confirmation.status !== 'PENDING_CONFIRMATION') {
      throw new BadRequestException(`Cannot confirm action in ${confirmation.status} state`);
    }

    return this.prisma.$transaction(async (tx: any) => {
      const payload = confirmation.proposedPayload as Record<string, any>;

      // Execute confirmed write operation
      if (confirmation.actionType === 'CREATE_TASK') {
        await tx.task.create({
          data: {
            projectId: payload.projectId,
            taskCode: payload.taskCode.toUpperCase(),
            title: payload.title,
            description: payload.description,
            creatorId: employeeId,
          },
        });
      }

      const updated = await tx.aiActionConfirmation.update({
        where: { id: confirmationId },
        data: {
          status: 'CONFIRMED',
          confirmedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorId: employeeId,
          action: 'AI_ACTION_CONFIRMED',
          entity: 'AiActionConfirmation',
          entityId: confirmationId,
          details: { actionType: confirmation.actionType, payload },
        },
      });

      return updated;
    });
  }

  async rejectAiAction(confirmationId: string, employeeId: string): Promise<any> {
    const confirmation = await this.prisma.aiActionConfirmation.findUnique({
      where: { id: confirmationId },
    });

    if (!confirmation) {
      throw new NotFoundException('Confirmation request not found');
    }

    return this.prisma.aiActionConfirmation.update({
      where: { id: confirmationId },
      data: { status: 'REJECTED' },
    });
  }
}
