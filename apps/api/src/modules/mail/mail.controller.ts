import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { MailService, SendMailDto, ConvertEmailToTaskDto } from './mail.service';

@Controller('mail')
@UseGuards(JwtAuthGuard)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Get('account')
  async getAccount(@Req() req: any) {
    return this.mailService.getOrCreateDefaultAccount(req.user.employeeId);
  }

  @Get('accounts/:accountId/folders')
  async getFolders(@Param('accountId') accountId: string, @Req() req: any) {
    return this.mailService.getFolders(accountId, req.user.employeeId);
  }

  @Get('accounts/:accountId/folders/:folderId/messages')
  async getMessages(
    @Param('accountId') accountId: string,
    @Param('folderId') folderId: string,
    @Req() req: any,
    @Query('limit') limit?: string,
  ) {
    return this.mailService.getMessages(accountId, req.user.employeeId, folderId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('messages/:id')
  async getMessage(@Param('id') id: string, @Req() req: any) {
    return this.mailService.getMessage(id, req.user.employeeId);
  }

  @Post('send')
  async sendMail(@Body() dto: SendMailDto, @Req() req: any) {
    return this.mailService.sendMail(req.user.employeeId, dto);
  }

  @Post('messages/:id/convert-to-task')
  async convertToTask(@Param('id') id: string, @Body() dto: ConvertEmailToTaskDto, @Req() req: any) {
    return this.mailService.convertEmailToTask(id, req.user.employeeId, dto);
  }
}
