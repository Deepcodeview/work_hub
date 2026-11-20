import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { DepartmentsModule } from './modules/departments/departments.module';
import { TeamsModule } from './modules/teams/teams.module';
import { DesignationsModule } from './modules/designations/designations.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { InvitationsModule } from './modules/invitations/invitations.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { TimesheetsModule } from './modules/timesheets/timesheets.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DashboardModule } from './modules/dashboards/dashboard.module';
import { ChatModule } from './modules/chat/chat.module';
import { MailModule } from './modules/mail/mail.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { HrmsModule } from './modules/hrms/hrms.module';
import { AutomationsModule } from './modules/automations/automations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),
    PrismaModule,
    AuditModule,
    HealthModule,
    AuthModule,
    EmployeesModule,
    DepartmentsModule,
    TeamsModule,
    DesignationsModule,
    OrganizationModule,
    RbacModule,
    InvitationsModule,
    AttendanceModule,
    TimesheetsModule,
    ProjectsModule,
    TasksModule,
    NotificationsModule,
    DashboardModule,
    ChatModule,
    MailModule,
    CalendarModule,
    DocumentsModule,
    HrmsModule,
    AutomationsModule,
  ],
})
export class AppModule {}
