import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MailService } from './mail.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MailService', () => {
  let service: MailService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      employee: {
        findUnique: jest.fn(),
      },
      mailAccount: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      mailFolder: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      mailMessage: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      mailRecipient: {
        create: jest.fn(),
      },
      task: {
        create: jest.fn(),
      },
      taskAssignee: {
        create: jest.fn(),
      },
      taskActivity: {
        create: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should send email and record message in SENT folder with recipients and audit log', async () => {
    prisma.employee.findUnique.mockResolvedValue({
      id: 'emp-1',
      email: 'user@workhub.internal',
      firstName: 'User',
      lastName: 'Name',
    });
    prisma.mailAccount.findFirst.mockResolvedValue({
      id: 'acc-1',
      emailAddress: 'user@workhub.internal',
      displayName: 'User Name',
    });
    prisma.mailFolder.findUnique.mockResolvedValue({ id: 'folder-sent', name: 'SENT' });
    prisma.mailMessage.create.mockResolvedValue({
      id: 'msg-1',
      subject: 'Weekly Review',
    });

    const result = await service.sendMail('emp-1', {
      to: ['client@example.com'],
      subject: 'Weekly Review',
      bodyHtml: '<p>Attached review</p>',
    });

    expect(result.id).toBe('msg-1');
    expect(prisma.mailRecipient.create).toHaveBeenCalledWith({
      data: {
        messageId: 'msg-1',
        recipientType: 'TO',
        emailAddress: 'client@example.com',
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should convert email to task and update convertedTaskId', async () => {
    prisma.mailMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      subject: 'Bug in login flow',
      bodyText: 'Details of the bug',
      fromAddress: 'qa@workhub.internal',
      convertedTaskId: null,
      account: { employeeId: 'emp-1' },
      recipients: [],
      attachments: [],
    });
    prisma.task.create.mockResolvedValue({ id: 'task-101' });

    const task = await service.convertEmailToTask('msg-1', 'emp-1', {
      projectId: 'proj-1',
      taskCode: 'BUG-101',
    });

    expect(task.id).toBe('task-101');
    expect(prisma.mailMessage.update).toHaveBeenCalledWith({
      where: { id: 'msg-1' },
      data: { convertedTaskId: 'task-101' },
    });
  });

  it('should reject converting email if already converted to a task', async () => {
    prisma.mailMessage.findUnique.mockResolvedValue({
      id: 'msg-1',
      convertedTaskId: 'task-already-exists',
      account: { employeeId: 'emp-1' },
      recipients: [],
      attachments: [],
    });

    await expect(
      service.convertEmailToTask('msg-1', 'emp-1', {
        projectId: 'proj-1',
        taskCode: 'BUG-102',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
