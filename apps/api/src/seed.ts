import { PrismaClient } from '@workhub/database';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding WorkHub database...');

  // 1. Roles
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

  // 2. Permissions
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

  // 3. Departments
  const engDept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: { name: 'Engineering', code: 'ENG', description: 'Software engineering & infrastructure' },
  });

  const hrDept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR', description: 'People operations & culture' },
  });

  await prisma.department.upsert({
    where: { code: 'PROD' },
    update: {},
    create: { name: 'Product & Design', code: 'PROD', description: 'Product strategy & UX/UI design' },
  });

  // 4. Designations
  const ctoDesig = await prisma.designation.upsert({
    where: { code: 'CTO' },
    update: {},
    create: { title: 'Chief Technology Officer', code: 'CTO', level: 1 },
  });

  const srEngDesig = await prisma.designation.upsert({
    where: { code: 'SR_ENG' },
    update: {},
    create: { title: 'Senior Software Engineer', code: 'SR_ENG', level: 3 },
  });

  await prisma.designation.upsert({
    where: { code: 'HR_LEAD' },
    update: {},
    create: { title: 'Lead People Partner', code: 'HR_LEAD', level: 2 },
  });

  // 5. System Admin User & Employee
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@workhub.internal' },
    update: {},
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
          departmentId: engDept.id,
          designationId: ctoDesig.id,
        },
      },
    },
    include: { employee: true },
  });

  // Link Admin Role
  const adminRole = await prisma.role.findUnique({ where: { name: 'SYSTEM_ADMIN' } });
  if (adminRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  // 6. Test Staff Employee (Jane Doe - Reporting to Admin)
  const staffUser = await prisma.user.upsert({
    where: { email: 'jane.doe@workhub.internal' },
    update: {},
    create: {
      email: 'jane.doe@workhub.internal',
      passwordHash,
      isActive: true,
      employee: {
        create: {
          employeeCode: 'EMP-002',
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@workhub.internal',
          departmentId: engDept.id,
          designationId: srEngDesig.id,
        },
      },
    },
    include: { employee: true },
  });

  const empRole = await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } });
  if (empRole) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: staffUser.id, roleId: empRole.id } },
      update: {},
      create: { userId: staffUser.id, roleId: empRole.id },
    });
  }

  // Assign reporting relationship (Jane reports to Admin)
  if (adminUser.employee && staffUser.employee) {
    const existingRel = await prisma.employeeReportingHistory.findFirst({
      where: { employeeId: staffUser.employee.id, managerId: adminUser.employee.id },
    });
    if (!existingRel) {
      await prisma.employeeReportingHistory.create({
        data: {
          employeeId: staffUser.employee.id,
          managerId: adminUser.employee.id,
          isPrimary: true,
          effectiveFrom: new Date(),
        },
      });
    }
  }

  // 7. Leave Types
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

  // 8. Attendance Policy
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

  // 9. Sample Project
  if (adminUser.employee) {
    const sampleProject = await prisma.project.upsert({
      where: { code: 'CORE' },
      update: {},
      create: {
        name: 'WorkHub Core Engineering',
        code: 'CORE',
        description: 'Foundational modules and enterprise platform services',
        status: 'ACTIVE',
        ownerId: adminUser.employee.id,
        departmentId: engDept.id,
      },
    });

    await prisma.task.upsert({
      where: { taskCode: 'CORE-101' },
      update: {},
      create: {
        projectId: sampleProject.id,
        taskCode: 'CORE-101',
        title: 'Review System Metrics & Verify Services',
        description: 'Verify system services across database, Redis, and workers.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        creatorId: adminUser.employee.id,
      },
    });
  }

  console.log('WorkHub database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
