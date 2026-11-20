import { PrismaClient } from '@workhub/database';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Purging all dummy data and ensuring only clean Admin exists...');

  // 1. Purge all operational records (tasks, projects, timesheets, attendance, leaves)
  await prisma.taskTimeLog.deleteMany({});
  await prisma.taskChecklist.deleteMany({});
  await prisma.taskComment.deleteMany({});
  await prisma.taskActivity.deleteMany({});
  await prisma.taskAssignee.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.task.deleteMany({});

  await prisma.projectMilestone.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});

  await prisma.timesheetApproval.deleteMany({});
  await prisma.timesheetEntry.deleteMany({});
  await prisma.timesheet.deleteMany({});

  await prisma.attendanceCorrection.deleteMany({});
  await prisma.attendanceBreak.deleteMany({});
  await prisma.attendanceSession.deleteMany({});

  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});
  await prisma.employeeReportingHistory.deleteMany({});

  // 2. Remove all non-admin users and non-admin employees
  const nonAdminUsers = await prisma.user.findMany({
    where: { email: { not: 'admin@workhub.internal' } },
    select: { id: true },
  });

  if (nonAdminUsers.length > 0) {
    const nonAdminIds = nonAdminUsers.map((u) => u.id);
    await prisma.userRole.deleteMany({ where: { userId: { in: nonAdminIds } } });
    await prisma.session.deleteMany({ where: { userId: { in: nonAdminIds } } });
  }

  await prisma.employee.deleteMany({
    where: { email: { not: 'admin@workhub.internal' } },
  });

  await prisma.user.deleteMany({
    where: { email: { not: 'admin@workhub.internal' } },
  });

  console.log('✅ Non-admin dummy users and records purged successfully.');

  // 3. System Baseline: Roles
  const roles = [
    { name: 'SYSTEM_ADMIN', description: 'System Administrator with full access' },
    { name: 'HR_ADMIN', description: 'Human Resources Administrator' },
    { name: 'DEPARTMENT_HEAD', description: 'Head of Department' },
    { name: 'REPORTING_MANAGER', description: 'Reporting Manager' },
    { name: 'EMPLOYEE', description: 'Standard Employee' },
  ];

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
  }

  // 4. System Baseline: Permissions
  const permissions = [
    { key: 'employee.view', description: 'View Employees' },
    { key: 'employee.manage', description: 'Manage Employees' },
    { key: 'department.manage', description: 'Manage Departments' },
    { key: 'attendance.manage', description: 'Manage Attendance' },
    { key: 'timesheet.approve', description: 'Approve Timesheets' },
    { key: 'project.manage', description: 'Manage Projects' },
    { key: 'payroll.manage', description: 'Manage Payroll' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
  }

  // 5. System Baseline: Standard Leave Types
  await prisma.leaveType.upsert({
    where: { code: 'ANNUAL' },
    update: {},
    create: { name: 'Annual Leave', code: 'ANNUAL', annualQuotaDays: 18, requiresApproval: true },
  });
  await prisma.leaveType.upsert({
    where: { code: 'SICK' },
    update: {},
    create: { name: 'Sick Leave', code: 'SICK', annualQuotaDays: 12, requiresApproval: true },
  });
  await prisma.leaveType.upsert({
    where: { code: 'CASUAL' },
    update: {},
    create: { name: 'Casual Leave', code: 'CASUAL', annualQuotaDays: 6, requiresApproval: false },
  });

  // 6. System Baseline: Attendance Policy
  const policy = await prisma.attendancePolicy.findFirst({ where: { name: 'Standard 40h Policy' } });
  if (!policy) {
    await prisma.attendancePolicy.create({
      data: {
        name: 'Standard 40h Policy',
        workHoursPerDayMinutes: 480,
        breakLimitMinutes: 60,
        isDefault: true,
      },
    });
  }

  // 7. Ensure Default Clean Department & Designation for Admin
  const adminDept = await prisma.department.upsert({
    where: { code: 'HQ' },
    update: {},
    create: { name: 'Executive HQ', code: 'HQ', description: 'Executive Administration' },
  });

  const adminDesig = await prisma.designation.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { title: 'System Administrator', code: 'ADMIN', level: 1 },
  });

  // 8. Sole System Admin Account
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@workhub.internal' },
    update: { isActive: true },
    create: {
      email: 'admin@workhub.internal',
      passwordHash,
      isActive: true,
      employee: {
        create: {
          employeeCode: 'EMP-001',
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@workhub.internal',
          departmentId: adminDept.id,
          designationId: adminDesig.id,
        },
      },
    },
    include: { employee: true },
  });

  // If admin employee was missing, create it
  if (!adminUser.employee) {
    await prisma.employee.create({
      data: {
        userId: adminUser.id,
        employeeCode: 'EMP-001',
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@workhub.internal',
        departmentId: adminDept.id,
        designationId: adminDesig.id,
      },
    });
  }

  // Assign SYSTEM_ADMIN role
  const adminRole = await prisma.role.findUnique({ where: { name: 'SYSTEM_ADMIN' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  console.log('🎉 Clean slate ready! ONLY admin@workhub.internal exists.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
