import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      notificationPreference: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should silence notification if recipient has disabled this notification type', async () => {
    prisma.notificationPreference.findUnique.mockResolvedValue({
      id: 'pref-1',
      isEnabled: false,
    });

    const result = await service.create({
      recipientId: 'emp-1',
      title: 'Task Assigned',
      body: 'You were assigned to WH-101',
      type: 'TASK',
    });

    expect(result).toBeNull();
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });

  it('should deliver notification when preference is enabled or default', async () => {
    prisma.notificationPreference.findUnique.mockResolvedValue(null);
    prisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      recipientId: 'emp-1',
      title: 'Task Assigned',
      body: 'You were assigned',
    });

    const result = await service.create({
      recipientId: 'emp-1',
      title: 'Task Assigned',
      body: 'You were assigned',
      type: 'TASK',
    });

    expect(result.id).toBe('notif-1');
    expect(prisma.notification.create).toHaveBeenCalled();
  });

  it('should mark notification as read', async () => {
    prisma.notification.findFirst.mockResolvedValue({ id: 'notif-1', recipientId: 'emp-1' });
    prisma.notification.update.mockResolvedValue({ id: 'notif-1', isRead: true });

    const result = await service.markAsRead('notif-1', 'emp-1');
    expect(result.isRead).toBe(true);
  });
});
