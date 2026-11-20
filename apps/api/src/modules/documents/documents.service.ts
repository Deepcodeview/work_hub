import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateFolderDto {
  name: string;
  parentFolderId?: string;
}

export interface UploadFileDto {
  folderId?: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

export interface AddVersionDto {
  storagePath: string;
  sizeBytes: number;
}

@Injectable()
export class DocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFolders(ownerId: string, parentFolderId?: string): Promise<any[]> {
    return this.prisma.docFolder.findMany({
      where: {
        ownerId,
        parentFolderId: parentFolderId || null,
      },
      include: {
        _count: { select: { files: true, subfolders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createFolder(ownerId: string, dto: CreateFolderDto): Promise<any> {
    return this.prisma.docFolder.create({
      data: {
        name: dto.name,
        parentFolderId: dto.parentFolderId,
        ownerId,
      },
    });
  }

  async getFiles(ownerId: string, folderId?: string): Promise<any[]> {
    return this.prisma.docFile.findMany({
      where: {
        ownerId,
        folderId: folderId || null,
      },
      include: {
        versions: { orderBy: { versionNumber: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadFile(ownerId: string, dto: UploadFileDto): Promise<any> {
    return this.prisma.$transaction(async (tx: any) => {
      const file = await tx.docFile.create({
        data: {
          folderId: dto.folderId,
          name: dto.name,
          mimeType: dto.mimeType,
          sizeBytes: dto.sizeBytes,
          storagePath: dto.storagePath,
          currentVersion: 1,
          ownerId,
        },
      });

      await tx.docVersion.create({
        data: {
          fileId: file.id,
          versionNumber: 1,
          storagePath: dto.storagePath,
          sizeBytes: dto.sizeBytes,
          uploadedById: ownerId,
        },
      });

      return file;
    });
  }

  async uploadNewVersion(fileId: string, employeeId: string, dto: AddVersionDto): Promise<any> {
    const file = await this.prisma.docFile.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException('Document not found');
    }

    if (file.ownerId !== employeeId) {
      const perm = await this.prisma.docPermission.findFirst({
        where: { fileId, employeeId, role: { in: ['EDITOR', 'ADMIN'] } },
      });
      if (!perm) {
        throw new ForbiddenException('You do not have permission to upload new versions to this file');
      }
    }

    const nextVersion = file.currentVersion + 1;

    return this.prisma.$transaction(async (tx: any) => {
      const version = await tx.docVersion.create({
        data: {
          fileId,
          versionNumber: nextVersion,
          storagePath: dto.storagePath,
          sizeBytes: dto.sizeBytes,
          uploadedById: employeeId,
        },
      });

      await tx.docFile.update({
        where: { id: fileId },
        data: {
          currentVersion: nextVersion,
          sizeBytes: dto.sizeBytes,
          storagePath: dto.storagePath,
        },
      });

      return version;
    });
  }
}
