import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService
  ) {}

  async findAll(departmentId?: string): Promise<any[]> {
    return this.prisma.team.findMany({
      where: departmentId ? { departmentId } : undefined,
      include: {
        department: { select: { id: true, name: true, code: true } },
        leader: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; departmentId: string; code?: string; leaderId?: string }, actorId?: string): Promise<any> {
    const existing = await this.prisma.team.findFirst({
      where: { departmentId: data.departmentId, name: data.name },
    });

    if (existing) {
      throw new ConflictException('Team with this name already exists in the department');
    }

    const team = await this.prisma.team.create({
      data,
      include: { department: true, leader: true },
    });

    await this.audit.log({
      actorId,
      action: 'team.created',
      entity: 'team',
      entityId: team.id,
      details: data,
    });

    return team;
  }
}
