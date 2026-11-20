import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationService } from './organization.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('OrganizationService', () => {
  let service: OrganizationService;

  const mockPrisma = {
    employee: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    employeeReportingHistory: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      upsert: jest.fn(),
    },
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<OrganizationService>(OrganizationService);
  });

  describe('assignManager', () => {
    it('should throw BadRequestException if employee tries to report to themselves', async () => {
      await expect(
        service.assignManager('emp-1', 'emp-1', 'Self report')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.assignManager('emp-not-found', 'mgr-1')
      ).rejects.toThrow(NotFoundException);
    });

    it('should detect direct cycle and reject (A -> B -> A)', async () => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce({ id: 'emp-A' }) // employee exists
        .mockResolvedValueOnce({ id: 'emp-B' }); // manager exists

      // emp-B currently reports to emp-A
      mockPrisma.employeeReportingHistory.findFirst.mockResolvedValueOnce({
        employeeId: 'emp-B',
        managerId: 'emp-A',
        isPrimary: true,
      });

      await expect(
        service.assignManager('emp-A', 'emp-B', 'Promote')
      ).rejects.toThrow(BadRequestException);
    });

    it('should detect multi-level cycle (A -> B -> C -> A) and reject', async () => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce({ id: 'emp-A' })
        .mockResolvedValueOnce({ id: 'emp-C' });

      // Trace up from C: C reports to B, B reports to A
      mockPrisma.employeeReportingHistory.findFirst
        .mockResolvedValueOnce({ employeeId: 'emp-C', managerId: 'emp-B' })
        .mockResolvedValueOnce({ employeeId: 'emp-B', managerId: 'emp-A' });

      await expect(
        service.assignManager('emp-A', 'emp-C', 'Cycle test')
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully reassign manager and end previous active reporting relationship', async () => {
      mockPrisma.employee.findUnique
        .mockResolvedValueOnce({ id: 'emp-1' })
        .mockResolvedValueOnce({ id: 'mgr-1' });

      // No cycle
      mockPrisma.employeeReportingHistory.findFirst.mockResolvedValue(null);
      mockPrisma.employeeReportingHistory.create.mockResolvedValue({
        id: 'rep-new',
        employeeId: 'emp-1',
        managerId: 'mgr-1',
        isPrimary: true,
      });

      const res = await service.assignManager('emp-1', 'mgr-1', 'Normal reassignment', 'admin-id');

      expect(res.success).toBe(true);
      expect(mockPrisma.employeeReportingHistory.updateMany).toHaveBeenCalledWith({
        where: {
          employeeId: 'emp-1',
          isPrimary: true,
          effectiveTo: null,
        },
        data: {
          effectiveTo: expect.any(Date),
        },
      });
      expect(mockPrisma.employeeReportingHistory.create).toHaveBeenCalled();
      expect(mockAudit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'organization.manager_assigned',
          entityId: 'emp-1',
        })
      );
    });
  });
});
