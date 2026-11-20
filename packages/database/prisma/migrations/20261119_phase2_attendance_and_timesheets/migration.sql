-- CreateTable attendance_policies
CREATE TABLE "attendance_policies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requires_gps" BOOLEAN NOT NULL DEFAULT false,
    "allowed_radius_meters" INTEGER,
    "geofence_latitude" DOUBLE PRECISION,
    "geofence_longitude" DOUBLE PRECISION,
    "work_hours_per_day_minutes" INTEGER NOT NULL DEFAULT 480,
    "break_limit_minutes" INTEGER NOT NULL DEFAULT 60,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable shifts
CREATE TABLE "shifts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "start_time_minutes" INTEGER NOT NULL,
    "end_time_minutes" INTEGER NOT NULL,
    "grace_period_minutes" INTEGER NOT NULL DEFAULT 15,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable shift_assignments
CREATE TABLE "shift_assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable holidays
CREATE TABLE "holidays" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable attendance_sessions
CREATE TABLE "attendance_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "clock_in_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clock_out_at" TIMESTAMP(3),
    "total_duration_minutes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "device_type" TEXT NOT NULL DEFAULT 'WEB',
    "clock_in_latitude" DOUBLE PRECISION,
    "clock_in_longitude" DOUBLE PRECISION,
    "clock_in_accuracy" DOUBLE PRECISION,
    "clock_in_address" TEXT,
    "clock_out_latitude" DOUBLE PRECISION,
    "clock_out_longitude" DOUBLE PRECISION,
    "clock_out_accuracy" DOUBLE PRECISION,
    "clock_out_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable attendance_breaks
CREATE TABLE "attendance_breaks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "break_type" TEXT NOT NULL DEFAULT 'PERSONAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_breaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable attendance_corrections
CREATE TABLE "attendance_corrections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "session_id" UUID,
    "requested_clock_in_at" TIMESTAMP(3) NOT NULL,
    "requested_clock_out_at" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by_id" UUID,
    "reviewed_at" TIMESTAMP(3),
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_corrections_pkey" PRIMARY KEY ("id")
);

-- CreateTable timesheets
CREATE TABLE "timesheets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" UUID NOT NULL,
    "work_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "total_minutes" INTEGER NOT NULL DEFAULT 0,
    "approver_manager_id" UUID,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timesheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable timesheet_entries
CREATE TABLE "timesheet_entries" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timesheet_id" UUID NOT NULL,
    "project_id" UUID,
    "task_id" UUID,
    "description" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheet_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable timesheet_approvals
CREATE TABLE "timesheet_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timesheet_id" UUID NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "action" TEXT NOT NULL,
    "actor_id" UUID NOT NULL,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timesheet_approvals_pkey" PRIMARY KEY ("id")
);

-- Create Indexes and Unique Constraints
CREATE UNIQUE INDEX "attendance_policies_name_key" ON "attendance_policies"("name");
CREATE UNIQUE INDEX "shifts_name_key" ON "shifts"("name");
CREATE UNIQUE INDEX "shifts_code_key" ON "shifts"("code");
CREATE INDEX "shift_assignments_employee_id_effective_to_idx" ON "shift_assignments"("employee_id", "effective_to");
CREATE UNIQUE INDEX "holidays_date_name_key" ON "holidays"("date", "name");

CREATE INDEX "attendance_sessions_employee_id_clock_in_at_idx" ON "attendance_sessions"("employee_id", "clock_in_at");
CREATE INDEX "attendance_sessions_status_idx" ON "attendance_sessions"("status");
CREATE INDEX "attendance_breaks_session_id_idx" ON "attendance_breaks"("session_id");
CREATE INDEX "attendance_corrections_employee_id_status_idx" ON "attendance_corrections"("employee_id", "status");

CREATE UNIQUE INDEX "timesheets_employee_id_work_date_key" ON "timesheets"("employee_id", "work_date");
CREATE INDEX "timesheets_employee_id_work_date_idx" ON "timesheets"("employee_id", "work_date");
CREATE INDEX "timesheets_approver_manager_id_status_idx" ON "timesheets"("approver_manager_id", "status");
CREATE INDEX "timesheet_entries_timesheet_id_idx" ON "timesheet_entries"("timesheet_id");
CREATE INDEX "timesheet_approvals_timesheet_id_version_idx" ON "timesheet_approvals"("timesheet_id", "version");

-- Foreign Keys
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shift_assignments" ADD CONSTRAINT "shift_assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_breaks" ADD CONSTRAINT "attendance_breaks_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attendance_corrections" ADD CONSTRAINT "attendance_corrections_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "attendance_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_approver_manager_id_fkey" FOREIGN KEY ("approver_manager_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "timesheet_entries" ADD CONSTRAINT "timesheet_entries_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "timesheet_approvals" ADD CONSTRAINT "timesheet_approvals_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "timesheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
