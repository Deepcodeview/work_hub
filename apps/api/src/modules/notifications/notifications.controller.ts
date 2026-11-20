import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService, CreateNotificationDto } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@Req() req: any, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.findAll(req.user.employeeId, unreadOnly === 'true');
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: any) {
    return this.notificationsService.markAsRead(id, req.user.employeeId);
  }

  @Post('mark-all-read')
  async markAllRead(@Req() req: any) {
    return this.notificationsService.markAllAsRead(req.user.employeeId);
  }

  @Post()
  async sendNotification(@Body() dto: CreateNotificationDto, @Req() req: any) {
    return this.notificationsService.create({
      ...dto,
      actorId: req.user.employeeId,
    });
  }

  @Get('preferences')
  async getPreferences(@Req() req: any) {
    return this.notificationsService.getPreferences(req.user.employeeId);
  }

  @Post('preferences')
  async updatePreference(
    @Req() req: any,
    @Body('channel') channel: string,
    @Body('type') type: string,
    @Body('isEnabled') isEnabled: boolean,
  ) {
    return this.notificationsService.setPreference(req.user.employeeId, channel, type, isEnabled);
  }
}
