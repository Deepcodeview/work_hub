import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService
  ) {}

  async login(email: string, password: string, clientInfo?: { userAgent?: string; ipAddress?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, departmentId: true, employeeCode: true },
        },
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissionSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionSet.add(rp.permission.key);
      });
    });

    const payload = { sub: user.id, email: user.email, roles };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '8h' });

    // Create session in database
    const tokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: clientInfo?.userAgent,
        ipAddress: clientInfo?.ipAddress,
        expiresAt,
      },
    });

    await this.audit.log({
      actorId: user.id,
      action: 'auth.login',
      entity: 'user',
      entityId: user.id,
      ipAddress: clientInfo?.ipAddress,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        employee: user.employee,
        roles,
        permissions: Array.from(permissionSet),
      },
    };
  }

  async logout(userId: string, token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await this.prisma.session.deleteMany({
      where: { userId, tokenHash },
    });

    await this.audit.log({
      actorId: userId,
      action: 'auth.logout',
      entity: 'user',
      entityId: userId,
    });

    return { success: true };
  }

  async registerUser(data: {
    email: string;
    password: string;
    roles?: string[];
    employeeData?: {
      firstName: string;
      lastName: string;
      employeeCode: string;
      departmentId?: string;
      designationId?: string;
      phone?: string;
    };
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        ...(data.employeeData && {
          employee: {
            create: {
              employeeCode: data.employeeData.employeeCode,
              firstName: data.employeeData.firstName,
              lastName: data.employeeData.lastName,
              email: data.email.toLowerCase(),
              phone: data.employeeData.phone,
              departmentId: data.employeeData.departmentId,
              designationId: data.employeeData.designationId,
            },
          },
        }),
      },
      include: { employee: true },
    });

    // Assign roles if provided
    if (data.roles && data.roles.length > 0) {
      for (const roleName of data.roles) {
        const role = await this.prisma.role.findUnique({ where: { name: roleName } });
        if (role) {
          await this.prisma.userRole.create({
            data: { userId: user.id, roleId: role.id },
          });
        }
      }
    }

    return user;
  }
}
