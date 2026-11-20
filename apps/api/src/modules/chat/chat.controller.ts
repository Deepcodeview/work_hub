import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ChatService, CreateConversationDto, SendMessageDto } from './chat.service';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  async getConversations(@Req() req: any) {
    return this.chatService.findUserConversations(req.user.employeeId);
  }

  @Post('conversations')
  async createConversation(@Body() dto: CreateConversationDto, @Req() req: any) {
    return this.chatService.createConversation(req.user.employeeId, dto);
  }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string, @Req() req: any) {
    return this.chatService.getConversation(id, req.user.employeeId);
  }

  @Get('conversations/:id/messages')
  async getMessages(@Param('id') id: string, @Req() req: any, @Query('limit') limit?: string) {
    return this.chatService.getMessages(id, req.user.employeeId, limit ? parseInt(limit, 10) : 50);
  }

  @Post('conversations/:id/messages')
  async sendMessage(@Param('id') id: string, @Body() dto: SendMessageDto, @Req() req: any) {
    return this.chatService.sendMessage(id, req.user.employeeId, dto);
  }

  @Post('messages/:id/reactions')
  async addReaction(@Param('id') id: string, @Body('emoji') emoji: string, @Req() req: any) {
    return this.chatService.addReaction(id, req.user.employeeId, emoji);
  }

  @Post('conversations/:id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    return this.chatService.markAsRead(id, req.user.employeeId);
  }
}
