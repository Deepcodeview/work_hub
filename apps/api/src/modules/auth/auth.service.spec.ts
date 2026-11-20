import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockAudit = {
    log: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login('test@workhub.internal', 'password')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      const hash = await bcrypt.hash('correctPassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'test@workhub.internal',
        passwordHash: hash,
        isActive: true,
        userRoles: [],
      });

      await expect(service.login('test@workhub.internal', 'wrongPassword')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should return accessToken and user data on valid login', async () => {
      const hash = await bcrypt.hash('secretPassword', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'admin@workhub.internal',
        passwordHash: hash,
        isActive: true,
        employee: { id: 'emp-1', firstName: 'Admin', lastName: 'User' },
        userRoles: [
          {
            role: {
              name: 'SYSTEM_ADMIN',
              rolePermissions: [{ permission: { key: 'employee.manage' } }],
            },
          },
        ],
      });
      mockPrisma.session.create.mockResolvedValue({ id: 'sess-1' });

      const res = await service.login('admin@workhub.internal', 'secretPassword');

      expect(res.accessToken).toBe('mock-jwt-token');
      expect(res.user.email).toBe('admin@workhub.internal');
      expect(res.user.roles).toContain('SYSTEM_ADMIN');
      expect(res.user.permissions).toContain('employee.manage');
      expect(mockPrisma.session.create).toHaveBeenCalled();
    });
  });
});
