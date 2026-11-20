import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentsService', () => {
  let service: DocumentsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      docFolder: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      docFile: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      docVersion: {
        create: jest.fn(),
      },
      docPermission: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('should upload file and initialize version 1 record', async () => {
    prisma.docFile.create.mockResolvedValue({
      id: 'file-1',
      name: 'Architecture.pdf',
      currentVersion: 1,
    });

    const file = await service.uploadFile('emp-1', {
      name: 'Architecture.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      storagePath: '/s3/docs/architecture.pdf',
    });

    expect(file.id).toBe('file-1');
    expect(prisma.docVersion.create).toHaveBeenCalledWith({
      data: {
        fileId: 'file-1',
        versionNumber: 1,
        storagePath: '/s3/docs/architecture.pdf',
        sizeBytes: 1024,
        uploadedById: 'emp-1',
      },
    });
  });

  it('should upload new version and increment version number', async () => {
    prisma.docFile.findUnique.mockResolvedValue({
      id: 'file-1',
      ownerId: 'emp-1',
      currentVersion: 1,
    });
    prisma.docVersion.create.mockResolvedValue({
      id: 'ver-2',
      versionNumber: 2,
    });

    const version = await service.uploadNewVersion('file-1', 'emp-1', {
      storagePath: '/s3/docs/architecture-v2.pdf',
      sizeBytes: 2048,
    });

    expect(version.versionNumber).toBe(2);
    expect(prisma.docFile.update).toHaveBeenCalledWith({
      where: { id: 'file-1' },
      data: {
        currentVersion: 2,
        sizeBytes: 2048,
        storagePath: '/s3/docs/architecture-v2.pdf',
      },
    });
  });

  it('should reject version upload if user is not owner and lacks editor permission', async () => {
    prisma.docFile.findUnique.mockResolvedValue({
      id: 'file-1',
      ownerId: 'emp-owner',
      currentVersion: 1,
    });
    prisma.docPermission.findFirst.mockResolvedValue(null);

    await expect(
      service.uploadNewVersion('file-1', 'emp-intruder', {
        storagePath: '/s3/hack.pdf',
        sizeBytes: 100,
      }),
    ).rejects.toThrow(ForbiddenException);
  });
});
