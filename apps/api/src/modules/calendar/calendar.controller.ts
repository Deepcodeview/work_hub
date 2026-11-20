import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CalendarService, CreateEventDto } from './calendar.service';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  async getEvents(@Req() req: any, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    return this.calendarService.getEvents(req.user.employeeId, startDate, endDate);
  }

  @Post('events')
  async createEvent(@Body() dto: CreateEventDto, @Req() req: any) {
    return this.calendarService.createEvent(req.user.employeeId, dto);
  }

  @Patch('events/:id/respond')
  async respond(@Param('id') id: string, @Body('status') status: string, @Req() req: any) {
    return this.calendarService.respondToEvent(id, req.user.employeeId, status);
  }

  @Post('events/:id/notes')
  async addNote(@Param('id') id: string, @Body('content') content: string, @Req() req: any) {
    return this.calendarService.addMeetingNote(id, req.user.employeeId, content);
  }

  @Post('events/:id/actions')
  async addAction(
    @Param('id') id: string,
    @Body('title') title: string,
    @Body('assigneeId') assigneeId?: string,
    @Body('dueDate') dueDate?: string,
  ) {
    return this.calendarService.addActionItem(id, title, assigneeId, dueDate);
  }
}
