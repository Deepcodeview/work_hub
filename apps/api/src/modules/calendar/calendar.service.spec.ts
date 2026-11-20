import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CalendarService', () => {
  let service: CalendarService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      calendar: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      calendarEvent: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      calendarAttendee: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      meetingNote: {
        create: jest.fn(),
      },
      meetingActionItem: {
        create: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should reject creating event if end time is before or equal to start time', async () => {
    await expect(
      service.createEvent('emp-1', {
        title: 'Standup',
        startTime: '2026-11-19T10:00:00Z',
        endTime: '2026-11-19T09:30:00Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should create event and automatically enroll organizer as ACCEPTED attendee', async () => {
    prisma.calendar.findFirst.mockResolvedValue({ id: 'cal-1' });
    prisma.calendarEvent.create.mockResolvedValue({
      id: 'event-1',
      title: 'Sprint Planning',
      organizerId: 'emp-1',
    });

    const result = await service.createEvent('emp-1', {
      title: 'Sprint Planning',
      startTime: '2026-11-19T10:00:00Z',
      endTime: '2026-11-19T11:00:00Z',
      videoMeeting: true,
      attendeeIds: ['emp-2'],
    });

    expect(result.id).toBe('event-1');
    expect(prisma.calendarAttendee.create).toHaveBeenCalledWith({
      data: {
        eventId: 'event-1',
        employeeId: 'emp-1',
        status: 'ACCEPTED',
      },
    });
    expect(prisma.calendarAttendee.create).toHaveBeenCalledWith({
      data: {
        eventId: 'event-1',
        employeeId: 'emp-2',
        status: 'PENDING',
      },
    });
  });

  it('should reject response if employee is not an attendee of the event', async () => {
    prisma.calendarAttendee.findUnique.mockResolvedValue(null);

    await expect(
      service.respondToEvent('event-1', 'emp-stranger', 'ACCEPTED'),
    ).rejects.toThrow(ForbiddenException);
  });
});
