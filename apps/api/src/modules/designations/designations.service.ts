import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DesignationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return this.prisma.designation.findMany({
      include: {
        _count: { select: { employees: true } },
      },
      orderBy: { level: 'asc' },
    });
  }

  async create(data: { title: string; code: string; level?: number; description?: string }): Promise<any> {
    const existing = await this.prisma.designation.findFirst({
      where: {
        OR: [{ title: data.title }, { code: data.code.toUpperCase() }],
      },
    });

    if (existing) {
      throw new ConflictException('Designation with this title or code already exists');
    }

    return this.prisma.designation.create({
      data: {
        title: data.title,
        code: data.code.toUpperCase(),
        level: data.level || 1,
        description: data.description,
      },
    });
  }
}
