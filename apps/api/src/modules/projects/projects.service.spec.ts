import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      project: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      projectMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
  });

  it('should prevent creating a project with an existing code', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'proj-1', code: 'PRJ-1' });

    await expect(
      service.create('emp-1', { code: 'PRJ-1', name: 'Alpha' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create project and automatically add owner as OWNER member', async () => {
    prisma.project.findUnique.mockResolvedValue(null);
    prisma.project.create.mockResolvedValue({
      id: 'proj-1',
      code: 'PRJ-1',
      name: 'Alpha',
      ownerId: 'emp-1',
    });

    const result = await service.create('emp-1', { code: 'PRJ-1', name: 'Alpha' });

    expect(result.id).toBe('proj-1');
    expect(prisma.projectMember.create).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-1',
        employeeId: 'emp-1',
        role: 'OWNER',
      },
    });
    expect(prisma.auditLog.create).toHaveBeenCalled();
  });

  it('should reject access to project if employee is not a member or owner', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      ownerId: 'emp-other',
      members: [{ employeeId: 'emp-another' }],
    });

    await expect(
      service.findById('proj-1', 'emp-1', false),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should permit access to project for project owner', async () => {
    prisma.project.findUnique.mockResolvedValue({
      id: 'proj-1',
      ownerId: 'emp-1',
      members: [],
    });

    const result = await service.findById('proj-1', 'emp-1', false);
    expect(result.id).toBe('proj-1');
  });
});
