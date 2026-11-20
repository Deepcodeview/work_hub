import { Test, TestingModule } from '@nestjs/testing';
import { TimesheetsService } from './timesheets.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('TimesheetsService', () => {
  let service: TimesheetsService;

  const mockPrisma = {
    timesheet: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    timesheetEntry: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
    timesheetApproval: {
      create: jest.fn(),
    },
    employeeReportingHistory: {
      findFirst: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimesheetsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<TimesheetsService>(TimesheetsService);
  });

  describe('submitTimesheet', () => {
    it('should reject submission if timesheet has 0 entries', async () => {
      mockPrisma.timesheet.findUnique.mockResolvedValueOnce({
        id: 'ts-empty',
        employeeId: 'emp-1',
        entries: [],
      });

      await expect(service.submitTimesheet('ts-empty', 'emp-1')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should lock primary reporting manager as approverManagerId upon submission', async () => {
      mockPrisma.timesheet.findUnique.mockResolvedValueOnce({
        id: 'ts-1',
        employeeId: 'emp-1',
        version: 1,
        entries: [{ id: 'entry-1', durationMinutes: 120 }],
      });

      // Employee currently reports to mgr-1
      mockPrisma.employeeReportingHistory.findFirst.mockResolvedValueOnce({
        managerId: 'mgr-1',
      });

      mockPrisma.timesheet.update.mockResolvedValueOnce({
        id: 'ts-1',
        status: 'SUBMITTED',
        approverManagerId: 'mgr-1',
      });

      const submitted = await service.submitTimesheet('ts-1', 'emp-1');

      expect(submitted.status).toBe('SUBMITTED');
      expect(mockPrisma.timesheet.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ts-1' },
          data: expect.objectContaining({
            status: 'SUBMITTED',
            approverManagerId: 'mgr-1',
          }),
        })
      );
      // Verify immutable approval version record created
      expect(mockPrisma.timesheetApproval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timesheetId: 'ts-1',
            version: 1,
            action: 'SUBMIT',
          }),
        })
      );
    });
  });

  describe('approveTimesheet', () => {
    it('should strictly prohibit self-approval (employee approving own timesheet)', async () => {
      mockPrisma.timesheet.findUnique.mockResolvedValueOnce({
        id: 'ts-1',
        employeeId: 'emp-mgr', // employee is also a manager
        approverManagerId: 'emp-mgr',
        status: 'SUBMITTED',
      });

      await expect(
        service.approveTimesheet('ts-1', 'emp-mgr', 'Self approval attempt')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject approval from unauthorized non-assigned manager', async () => {
      mockPrisma.timesheet.findUnique.mockResolvedValueOnce({
        id: 'ts-1',
        employeeId: 'emp-1',
        approverManagerId: 'mgr-assigned',
        status: 'SUBMITTED',
      });

      await expect(
        service.approveTimesheet('ts-1', 'mgr-different', 'Approval from other manager')
      ).rejects.toThrow(ForbiddenException);
    });

    it('should approve timesheet and create immutable TimesheetApproval record', async () => {
      mockPrisma.timesheet.findUnique.mockResolvedValueOnce({
        id: 'ts-1',
        employeeId: 'emp-1',
        approverManagerId: 'mgr-assigned',
        status: 'SUBMITTED',
        version: 1,
      });

      mockPrisma.timesheet.update.mockResolvedValueOnce({
        id: 'ts-1',
        status: 'APPROVED',
      });

      const approved = await service.approveTimesheet(
        'ts-1',
        'mgr-assigned',
        'Good work'
      );

      expect(approved.status).toBe('APPROVED');
      expect(mockPrisma.timesheetApproval.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timesheetId: 'ts-1',
            version: 1,
            action: 'APPROVE',
            actorId: 'mgr-assigned',
          }),
        })
      );
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'timesheet.approved',
          entityId: 'ts-1',
        })
      );
    });
  });
});
