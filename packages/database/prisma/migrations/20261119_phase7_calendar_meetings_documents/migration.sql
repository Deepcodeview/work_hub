-- CreateTable
CREATE TABLE "calendars" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#FF8A00',
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "calendar_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "video_meeting_url" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "organizer_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_attendees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "employee_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_action_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "event_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "assignee_id" UUID,
    "due_date" TIMESTAMP(3),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_action_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "parent_folder_id" UUID,
    "owner_id" UUID NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_files" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "folder_id" UUID,
    "name" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "current_version" INTEGER NOT NULL DEFAULT 1,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doc_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_versions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "storage_path" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doc_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "file_id" UUID,
    "folder_id" UUID,
    "employee_id" UUID,
    "department_id" UUID,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doc_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendars_owner_id_idx" ON "calendars"("owner_id");

-- CreateIndex
CREATE INDEX "calendar_events_calendar_id_start_time_idx" ON "calendar_events"("calendar_id", "start_time");
CREATE INDEX "calendar_events_organizer_id_idx" ON "calendar_events"("organizer_id");

-- CreateIndex
CREATE UNIQUE INDEX "calendar_attendees_event_id_employee_id_key" ON "calendar_attendees"("event_id", "employee_id");

-- CreateIndex
CREATE INDEX "meeting_notes_event_id_idx" ON "meeting_notes"("event_id");

-- CreateIndex
CREATE INDEX "meeting_action_items_event_id_idx" ON "meeting_action_items"("event_id");

-- CreateIndex
CREATE INDEX "doc_folders_owner_id_idx" ON "doc_folders"("owner_id");

-- CreateIndex
CREATE INDEX "doc_files_owner_id_idx" ON "doc_files"("owner_id");
CREATE INDEX "doc_files_folder_id_idx" ON "doc_files"("folder_id");

-- CreateIndex
CREATE UNIQUE INDEX "doc_versions_file_id_version_number_key" ON "doc_versions"("file_id", "version_number");

-- AddForeignKey
ALTER TABLE "calendars" ADD CONSTRAINT "calendars_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_calendar_id_fkey" FOREIGN KEY ("calendar_id") REFERENCES "calendars"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_attendees" ADD CONSTRAINT "calendar_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "calendar_attendees" ADD CONSTRAINT "calendar_attendees_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_notes" ADD CONSTRAINT "meeting_notes_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_action_items" ADD CONSTRAINT "meeting_action_items_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "calendar_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_parent_folder_id_fkey" FOREIGN KEY ("parent_folder_id") REFERENCES "doc_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_files" ADD CONSTRAINT "doc_files_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "doc_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "doc_files" ADD CONSTRAINT "doc_files_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_versions" ADD CONSTRAINT "doc_versions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "doc_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doc_versions" ADD CONSTRAINT "doc_versions_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doc_permissions" ADD CONSTRAINT "doc_permissions_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "doc_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doc_permissions" ADD CONSTRAINT "doc_permissions_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "doc_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doc_permissions" ADD CONSTRAINT "doc_permissions_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
