import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as crypto from 'crypto';

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async create(data: { email: string; role?: string; departmentId?: string }, invitedById?: string) {
    const email = data.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new BadRequestException('A user with this email already exists in WorkHub');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.prisma.invitation.create({
      data: {
        email,
        role: data.role || 'EMPLOYEE',
        departmentId: data.departmentId,
        tokenHash,
        expiresAt,
        invitedById,
      },
    });

    await this.audit.log({
      actorId: invitedById,
      action: 'invitation.created',
      entity: 'invitation',
      entityId: invite.id,
      details: { email, role: invite.role },
    });

    return {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteToken: rawToken, // Provided once to send via email/link
    };
  }

  async findAll(): Promise<any[]> {
    return this.prisma.invitation.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: { select: { email: true } },
      },
    });
  }

  async accept(token: string, password: string, employeeInfo: { firstName: string; lastName: string; employeeCode: string; phone?: string }) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const invite = await this.prisma.invitation.findUnique({
      where: { tokenHash },
    });

    if (!invite) {
      throw new NotFoundException('Invitation not found or invalid token');
    }

    if (invite.acceptedAt) {
      throw new BadRequestException('This invitation has already been used');
    }

    if (new Date() > invite.expiresAt) {
      throw new BadRequestException('This invitation has expired');
    }

    // Mark invitation as accepted
    await this.prisma.invitation.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });

    return {
      email: invite.email,
      role: invite.role,
      departmentId: invite.departmentId,
    };
  }
}
