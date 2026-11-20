import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditEntry {
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry): Promise<any> {
    try {
      return await this.prisma.auditLog.create({
        data: {
          actorId: entry.actorId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          details: entry.details,
          ipAddress: entry.ipAddress,
        },
      });
    } catch (err: any) {
      console.error('Failed to write audit log:', err.message);
      return null;
    }
  }

  async list(filter?: { entity?: string; action?: string; limit?: number }): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: {
        ...(filter?.entity && { entity: filter.entity }),
        ...(filter?.action && { action: filter.action }),
      },
      orderBy: { createdAt: 'desc' },
      take: filter?.limit || 50,
    });
  }
}
