import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateEventDto {
  title: string;
  description?: string;
  location?: string;
  videoMeeting?: boolean;
  startTime: string;
  endTime: string;
  isAllDay?: boolean;
  attendeeIds?: string[];
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreatePrimaryCalendar(employeeId: string): Promise<any> {
    let calendar = await this.prisma.calendar.findFirst({
      where: { ownerId: employeeId, isPrimary: true },
    });

    if (!calendar) {
      calendar = await this.prisma.calendar.create({
        data: {
          ownerId: employeeId,
          name: 'Primary Calendar',
          isPrimary: true,
          color: '#FF8A00',
        },
      });
    }

    return calendar;
  }

  async getEvents(employeeId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const where: any = {
      OR: [
        { organizerId: employeeId },
        { attendees: { some: { employeeId } } },
      ],
      status: { not: 'CANCELLED' },
    };

    if (startDate && endDate) {
      where.startTime = { gte: new Date(startDate) };
      where.endTime = { lte: new Date(endDate) };
    }

    return this.prisma.calendarEvent.findMany({
      where,
      include: {
        organizer: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        attendees: {
          include: {
            employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
        notes: true,
        actionItems: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createEvent(organizerId: string, dto: CreateEventDto): Promise<any> {
    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);

    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }

    const calendar = await this.getOrCreatePrimaryCalendar(organizerId);

    const videoMeetingUrl = dto.videoMeeting
      ? `https://meet.workhub.internal/room-${Math.random().toString(36).substring(2, 9)}`
      : null;

    return this.prisma.$transaction(async (tx: any) => {
      const event = await tx.calendarEvent.create({
        data: {
          calendarId: calendar.id,
          title: dto.title,
          description: dto.description,
          location: dto.location,
          videoMeetingUrl,
          startTime: start,
          endTime: end,
          isAllDay: dto.isAllDay || false,
          organizerId,
        },
      });

      // Add organizer as ACCEPTED attendee
      await tx.calendarAttendee.create({
        data: {
          eventId: event.id,
          employeeId: organizerId,
          status: 'ACCEPTED',
        },
      });

      if (dto.attendeeIds && dto.attendeeIds.length > 0) {
        for (const attId of dto.attendeeIds) {
          if (attId !== organizerId) {
            await tx.calendarAttendee.create({
              data: {
                eventId: event.id,
                employeeId: attId,
                status: 'PENDING',
              },
            });
          }
        }
      }

      return event;
    });
  }

  async respondToEvent(eventId: string, employeeId: string, status: string): Promise<any> {
    const attendee = await this.prisma.calendarAttendee.findUnique({
      where: { eventId_employeeId: { eventId, employeeId } },
    });

    if (!attendee) {
      throw new ForbiddenException('You are not invited to this event');
    }

    return this.prisma.calendarAttendee.update({
      where: { eventId_employeeId: { eventId, employeeId } },
      data: { status },
    });
  }

  async addMeetingNote(eventId: string, employeeId: string, content: string): Promise<any> {
    return this.prisma.meetingNote.create({
      data: {
        eventId,
        content,
        createdById: employeeId,
      },
    });
  }

  async addActionItem(eventId: string, title: string, assigneeId?: string, dueDate?: string): Promise<any> {
    return this.prisma.meetingActionItem.create({
      data: {
        eventId,
        title,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });
  }
}
