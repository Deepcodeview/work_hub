import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateConversationDto {
  type: 'DIRECT' | 'CHANNEL' | 'GROUP';
  title?: string;
  description?: string;
  memberIds: string[];
}

export interface SendMessageDto {
  content: string;
  parentMessageId?: string;
  attachments?: { fileName: string; fileUrl: string; fileSize: number; mimeType: string }[];
}

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  async findUserConversations(employeeId: string): Promise<any[]> {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { employeeId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
              },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    return memberships.map((m: any) => ({
      ...m.conversation,
      myRole: m.role,
      lastReadAt: m.lastReadAt,
    }));
  }

  async getConversation(conversationId: string, employeeId: string): Promise<any> {
    const isMember = await this.prisma.conversationMember.findUnique({
      where: { conversationId_employeeId: { conversationId, employeeId } },
    });

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async createConversation(creatorEmployeeId: string, dto: CreateConversationDto): Promise<any> {
    return this.prisma.$transaction(async (tx: any) => {
      const conversation = await tx.conversation.create({
        data: {
          type: dto.type,
          title: dto.title,
          description: dto.description,
          creatorId: creatorEmployeeId,
        },
      });

      const uniqueMembers = Array.from(new Set([creatorEmployeeId, ...(dto.memberIds || [])]));

      for (const empId of uniqueMembers) {
        await tx.conversationMember.create({
          data: {
            conversationId: conversation.id,
            employeeId: empId,
            role: empId === creatorEmployeeId ? 'ADMIN' : 'MEMBER',
          },
        });
      }

      return conversation;
    });
  }

  async getMessages(conversationId: string, employeeId: string, limit: number = 50): Promise<any[]> {
    const isMember = await this.prisma.conversationMember.findUnique({
      where: { conversationId_employeeId: { conversationId, employeeId } },
    });

    if (!isMember) {
      throw new ForbiddenException('You must be a conversation member to view messages');
    }

    return this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        attachments: true,
        reactions: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        _count: { select: { replies: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async sendMessage(conversationId: string, senderEmployeeId: string, dto: SendMessageDto): Promise<any> {
    const isMember = await this.prisma.conversationMember.findUnique({
      where: { conversationId_employeeId: { conversationId, employeeId: senderEmployeeId } },
    });

    if (!isMember) {
      throw new ForbiddenException('Cannot send message to a conversation you do not belong to');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: senderEmployeeId,
          content: dto.content,
          parentMessageId: dto.parentMessageId,
        },
        include: {
          sender: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        },
      });

      if (dto.attachments && dto.attachments.length > 0) {
        for (const att of dto.attachments) {
          await tx.messageAttachment.create({
            data: {
              messageId: message.id,
              fileName: att.fileName,
              fileUrl: att.fileUrl,
              fileSize: att.fileSize,
              mimeType: att.mimeType,
            },
          });
        }
      }

      await tx.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      return message;
    });
  }

  async addReaction(messageId: string, employeeId: string, emoji: string): Promise<any> {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const isMember = await this.prisma.conversationMember.findUnique({
      where: { conversationId_employeeId: { conversationId: message.conversationId, employeeId } },
    });
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this conversation');
    }

    return this.prisma.messageReaction.upsert({
      where: {
        messageId_employeeId_emoji: { messageId, employeeId, emoji },
      },
      create: { messageId, employeeId, emoji },
      update: {},
    });
  }

  async markAsRead(conversationId: string, employeeId: string): Promise<any> {
    return this.prisma.conversationMember.update({
      where: { conversationId_employeeId: { conversationId, employeeId } },
      data: { lastReadAt: new Date() },
    });
  }
}
