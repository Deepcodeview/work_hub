import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DocumentsService, CreateFolderDto, UploadFileDto, AddVersionDto } from './documents.service';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('folders')
  async getFolders(@Req() req: any, @Query('parentFolderId') parentFolderId?: string) {
    return this.documentsService.getFolders(req.user.employeeId, parentFolderId);
  }

  @Post('folders')
  async createFolder(@Body() dto: CreateFolderDto, @Req() req: any) {
    return this.documentsService.createFolder(req.user.employeeId, dto);
  }

  @Get('files')
  async getFiles(@Req() req: any, @Query('folderId') folderId?: string) {
    return this.documentsService.getFiles(req.user.employeeId, folderId);
  }

  @Post('files')
  async uploadFile(@Body() dto: UploadFileDto, @Req() req: any) {
    return this.documentsService.uploadFile(req.user.employeeId, dto);
  }

  @Post('files/:id/versions')
  async uploadVersion(@Param('id') id: string, @Body() dto: AddVersionDto, @Req() req: any) {
    return this.documentsService.uploadNewVersion(id, req.user.employeeId, dto);
  }
}
