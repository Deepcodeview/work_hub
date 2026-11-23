import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockPrisma = {
    attendanceSession: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    attendanceBreak: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    employeeReportingHistory: {
      findMany: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.attendanceSession.findMany.mockResolvedValue([]);
    mockPrisma.attendanceBreak.findMany.mockResolvedValue([]);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('clockIn', () => {
    it('should reject clock in if an open session already exists', async () => {
      mockPrisma.attendanceSession.findFirst.mockResolvedValueOnce({
        id: 'sess-open',
        employeeId: 'emp-1',
        status: 'OPEN',
      });

      await expect(service.clockIn('emp-1')).rejects.toThrow(BadRequestException);
    });

    it('should create a new open attendance session with GPS coords', async () => {
      mockPrisma.attendanceSession.findFirst.mockResolvedValueOnce(null);
      mockPrisma.attendanceSession.create.mockResolvedValueOnce({
        id: 'sess-new',
        employeeId: 'emp-1',
        status: 'OPEN',
        clockInLatitude: 37.7749,
        clockInLongitude: -122.4194,
      });

      const session = await service.clockIn('emp-1', {
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10,
      });

      expect(session.id).toBe('sess-new');
      expect(mockPrisma.attendanceSession.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            employeeId: 'emp-1',
            status: 'OPEN',
            clockInLatitude: 37.7749,
          }),
        })
      );
      expect(mockAudit.log).toHaveBeenCalled();
    });
  });

  describe('clockOut', () => {
    it('should reject clock out if no open session exists', async () => {
      mockPrisma.attendanceSession.findFirst.mockResolvedValueOnce(null);

      await expect(service.clockOut('emp-1')).rejects.toThrow(BadRequestException);
    });

    it('should close open session and subtract break minutes', async () => {
      const clockInTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago = 240 mins
      mockPrisma.attendanceSession.findFirst.mockResolvedValueOnce({
        id: 'sess-1',
        employeeId: 'emp-1',
        clockInAt: clockInTime,
        status: 'OPEN',
        breaks: [
          {
            id: 'brk-1',
            startTime: new Date(Date.now() - 60 * 60 * 1000), // 30 mins break
            endTime: new Date(Date.now() - 30 * 60 * 1000),
            durationMinutes: 30,
          },
        ],
      });
      mockPrisma.attendanceBreak.findMany.mockResolvedValueOnce([
        { id: 'brk-1', durationMinutes: 30 },
      ]);
      mockPrisma.attendanceSession.update.mockResolvedValueOnce({
        id: 'sess-1',
        status: 'CLOSED',
        totalDurationMinutes: 210, // 240 gross - 30 break = 210 net minutes
      });

      const closed = await service.clockOut('emp-1');

      expect(closed.status).toBe('CLOSED');
      expect(mockPrisma.attendanceSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'sess-1' },
          data: expect.objectContaining({
            status: 'CLOSED',
            totalDurationMinutes: expect.any(Number),
          }),
        })
      );
    });
  });
});
