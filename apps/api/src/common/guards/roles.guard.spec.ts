import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '@workhub/permissions';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  }

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ roles: [Role.EMPLOYEE] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow SYSTEM_ADMIN regardless of required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.HR_ADMIN]);
    const context = createMockContext({ roles: [Role.SYSTEM_ADMIN] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has one of the required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.HR_ADMIN, Role.DEPARTMENT_HEAD]);
    const context = createMockContext({ roles: [Role.DEPARTMENT_HEAD, Role.EMPLOYEE] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user lacks required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.SYSTEM_ADMIN]);
    const context = createMockContext({ roles: [Role.EMPLOYEE] });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
