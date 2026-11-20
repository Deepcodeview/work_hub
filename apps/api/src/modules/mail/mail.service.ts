import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SendMailDto {
  accountId?: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

export interface ConvertEmailToTaskDto {
  projectId: string;
  taskCode: string;
  priority?: string;
  dueDate?: string;
}

@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateDefaultAccount(employeeId: string): Promise<any> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: { email: true, firstName: true, lastName: true },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    let account = await this.prisma.mailAccount.findFirst({
      where: { employeeId, isPrimary: true },
      include: { folders: true },
    });

    if (!account) {
      account = await this.prisma.$transaction(async (tx: any) => {
        const acc = await tx.mailAccount.create({
          data: {
            employeeId,
            emailAddress: employee.email,
            displayName: `${employee.firstName} ${employee.lastName}`,
            provider: 'IMAP_SMTP',
            isPrimary: true,
          },
        });

        // Initialize standard mail folders
        const standardFolders = ['INBOX', 'SENT', 'DRAFTS', 'TRASH'];
        for (const f of standardFolders) {
          await tx.mailFolder.create({
            data: {
              accountId: acc.id,
              name: f,
              folderType: f,
            },
          });
        }

        return tx.mailAccount.findUnique({
          where: { id: acc.id },
          include: { folders: true },
        });
      });
    }

    return account;
  }

  async getFolders(accountId: string, employeeId: string): Promise<any[]> {
    const account = await this.prisma.mailAccount.findFirst({
      where: { id: accountId, employeeId },
    });
    if (!account) {
      throw new ForbiddenException('You do not have access to this mail account');
    }

    return this.prisma.mailFolder.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
    });
  }

  async getMessages(accountId: string, employeeId: string, folderId: string, limit: number = 50): Promise<any[]> {
    const account = await this.prisma.mailAccount.findFirst({
      where: { id: accountId, employeeId },
    });
    if (!account) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.mailMessage.findMany({
      where: { accountId, folderId },
      include: {
        recipients: true,
        _count: { select: { attachments: true } },
      },
      orderBy: { receivedAt: 'desc' },
      take: limit,
    });
  }

  async getMessage(id: string, employeeId: string): Promise<any> {
    const message = await this.prisma.mailMessage.findUnique({
      where: { id },
      include: {
        account: true,
        recipients: true,
        attachments: true,
      },
    });

    if (!message || message.account.employeeId !== employeeId) {
      throw new NotFoundException('Mail message not found or access denied');
    }

    if (!message.isRead) {
      await this.prisma.mailMessage.update({
        where: { id },
        data: { isRead: true },
      });
    }

    return message;
  }

  async sendMail(employeeId: string, dto: SendMailDto): Promise<any> {
    const account = dto.accountId
      ? await this.prisma.mailAccount.findFirst({ where: { id: dto.accountId, employeeId } })
      : await this.getOrCreateDefaultAccount(employeeId);

    if (!account) {
      throw new BadRequestException('Valid mail account required to send email');
    }

    let sentFolder = await this.prisma.mailFolder.findUnique({
      where: { accountId_name: { accountId: account.id, name: 'SENT' } },
    });

    if (!sentFolder) {
      sentFolder = await this.prisma.mailFolder.create({
        data: { accountId: account.id, name: 'SENT', folderType: 'SENT' },
      });
    }

    return this.prisma.$transaction(async (tx: any) => {
      const message = await tx.mailMessage.create({
        data: {
          accountId: account.id,
          folderId: sentFolder.id,
          fromAddress: account.emailAddress,
          fromName: account.displayName,
          subject: dto.subject,
          bodyHtml: dto.bodyHtml,
          bodyText: dto.bodyText || dto.bodyHtml.replace(/<[^>]*>?/gm, ''),
          snippet: dto.subject,
          isRead: true,
          sentAt: new Date(),
          receivedAt: new Date(),
        },
      });

      for (const toEmail of dto.to) {
        await tx.mailRecipient.create({
          data: {
            messageId: message.id,
            recipientType: 'TO',
            emailAddress: toEmail,
          },
        });
      }

      if (dto.cc) {
        for (const ccEmail of dto.cc) {
          await tx.mailRecipient.create({
            data: {
              messageId: message.id,
              recipientType: 'CC',
              emailAddress: ccEmail,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: employeeId,
          action: 'MAIL_SENT',
          entity: 'MailMessage',
          entityId: message.id,
          details: { subject: dto.subject, to: dto.to },
        },
      });

      return message;
    });
  }

  async convertEmailToTask(messageId: string, employeeId: string, dto: ConvertEmailToTaskDto): Promise<any> {
    const message = await this.getMessage(messageId, employeeId);

    if (message.convertedTaskId) {
      throw new BadRequestException('This email has already been converted to a task');
    }

    return this.prisma.$transaction(async (tx: any) => {
      const task = await tx.task.create({
        data: {
          projectId: dto.projectId,
          taskCode: dto.taskCode.toUpperCase(),
          title: `[Email] ${message.subject}`,
          description: `Created from Email by ${message.fromAddress}:\n\n${message.bodyText || message.bodyHtml}`,
          priority: dto.priority || 'MEDIUM',
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          creatorId: employeeId,
        },
      });

      await tx.taskAssignee.create({
        data: {
          taskId: task.id,
          employeeId,
          isPrimary: true,
        },
      });

      await tx.mailMessage.update({
        where: { id: messageId },
        data: { convertedTaskId: task.id },
      });

      await tx.taskActivity.create({
        data: {
          taskId: task.id,
          actorId: employeeId,
          action: 'CREATED_FROM_EMAIL',
          details: { emailSubject: message.subject, messageId },
        },
      });

      return task;
    });
  }
}
