import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailNotificationTemplates, renderEmailWrapper, EmailTemplatePayload } from './email-templates';

export interface CreateNotificationDto {
  recipientId: string;
  actorId?: string;
  type?: string;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(recipientId: string, unreadOnly: boolean = false): Promise<any[]> {
    const where: any = { recipientId };
    if (unreadOnly) {
      where.isRead = false;
    }

    return this.prisma.notification.findMany({
      where,
      include: {
        actor: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(id: string, recipientId: string): Promise<any> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, recipientId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(recipientId: string): Promise<any> {
    return this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async create(dto: CreateNotificationDto): Promise<any> {
    const type = dto.type || 'SYSTEM';

    // Check if recipient has disabled this notification type
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        employeeId_channel_type: {
          employeeId: dto.recipientId,
          channel: 'IN_APP',
          type,
        },
      },
    });

    if (preference && !preference.isEnabled) {
      // Notification silenced by user preference
      return null;
    }

    return this.prisma.notification.create({
      data: {
        recipientId: dto.recipientId,
        actorId: dto.actorId,
        type,
        title: dto.title,
        body: dto.body,
        entityType: dto.entityType,
        entityId: dto.entityId,
      },
    });
  }

  async getPreferences(employeeId: string): Promise<any[]> {
    return this.prisma.notificationPreference.findMany({
      where: { employeeId },
    });
  }

  async setPreference(employeeId: string, channel: string, type: string, isEnabled: boolean): Promise<any> {
    return this.prisma.notificationPreference.upsert({
      where: {
        employeeId_channel_type: { employeeId, channel, type },
      },
      update: { isEnabled },
      create: { employeeId, channel, type, isEnabled },
    });
  }

  /**
   * Generates a branded action-triggered email template
   */
  generateEmailTemplate(type: keyof typeof EmailNotificationTemplates, data: any) {
    const generator = EmailNotificationTemplates[type] as any;
    if (!generator) {
      throw new NotFoundException(`Email template ${String(type)} not found`);
    }
    return generator(data);
  }
}
