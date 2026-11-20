import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      conversation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      conversationMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      message: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      messageAttachment: {
        create: jest.fn(),
      },
      messageReaction: {
        upsert: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should reject viewing messages if user is not a member of the conversation', async () => {
    prisma.conversationMember.findUnique.mockResolvedValue(null);

    await expect(
      service.getMessages('conv-1', 'emp-intruder'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should reject sending message if user is not a member of the conversation', async () => {
    prisma.conversationMember.findUnique.mockResolvedValue(null);

    await expect(
      service.sendMessage('conv-1', 'emp-intruder', { content: 'Hello' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should create conversation and enroll creator as ADMIN member', async () => {
    prisma.conversation.create.mockResolvedValue({
      id: 'conv-1',
      type: 'CHANNEL',
      title: 'General',
    });

    const result = await service.createConversation('emp-admin', {
      type: 'CHANNEL',
      title: 'General',
      memberIds: ['emp-2', 'emp-3'],
    });

    expect(result.id).toBe('conv-1');
    expect(prisma.conversationMember.create).toHaveBeenCalledWith({
      data: {
        conversationId: 'conv-1',
        employeeId: 'emp-admin',
        role: 'ADMIN',
      },
    });
  });

  it('should send message and update conversation timestamp when sender is a member', async () => {
    prisma.conversationMember.findUnique.mockResolvedValue({ id: 'mem-1' });
    prisma.message.create.mockResolvedValue({
      id: 'msg-1',
      content: 'Hello Team',
      conversationId: 'conv-1',
      senderId: 'emp-1',
    });

    const result = await service.sendMessage('conv-1', 'emp-1', {
      content: 'Hello Team',
    });

    expect(result.id).toBe('msg-1');
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { updatedAt: expect.any(Date) },
    });
  });
});
