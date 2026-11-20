# WorkHub Database Architecture

PostgreSQL is the source of truth. The following is a logical inventory; implement detailed Prisma
models and migrations incrementally, one phase at a time.

## Identity and organization
- users
- employees
- employee_profiles
- employment_records
- departments
- teams
- designations
- employee_reporting_history
- roles
- permissions
- user_roles
- role_permissions
- sessions
- invitations

## Projects and tasks
- projects
- project_members
- project_milestones
- tasks
- task_assignees
- task_dependencies
- task_checklists
- task_comments
- task_activity
- task_time_logs

## Attendance and timesheets
- attendance_sessions
- attendance_breaks
- attendance_policies
- shifts
- shift_assignments
- holidays
- attendance_corrections
- timesheets
- timesheet_entries
- timesheet_approvals

## Chat
- conversations
- conversation_members
- messages
- message_attachments
- message_reactions
- message_receipts

## Mail
- mail_accounts
- mail_provider_credentials
- mail_folders
- mail_messages
- mail_recipients
- mail_attachments
- mail_sync_state
- mail_rules
- mail_signatures
- mail_drafts

## Calendar and meetings
- calendars
- calendar_events
- calendar_attendees
- event_reminders
- availability_blocks
- meeting_rooms
- meeting_notes
- meeting_action_items

## Documents and files
- files
- folders
- document_versions
- file_permissions
- document_comments
- sharing_links

## HRMS and payroll
- leave_types
- leave_balances
- leave_requests
- employee_documents
- performance_reviews
- salary_structures
- salary_components
- employee_salary_assignments
- payroll_runs
- payroll_items
- payslips
- payroll_adjustments

## Platform
- notifications
- notification_deliveries
- audit_logs
- integrations
- webhooks
- automation_rules
- automation_runs
- company_settings
- saved_filters
- feature_flags

## Required integrity rules
- Use UUID primary keys and foreign keys.
- Add unique constraints for employee codes and user identities.
- Prevent overlapping active primary reporting assignments.
- Prevent more than one open attendance session per employee using a database constraint.
- Prevent overlapping time intervals where required.
- Preserve immutable approval versions.
- Use transactions for clock-in/out and approval.
- Index common filters such as employee_id, project_id, work_date, status, manager_id, conversation_id, created_at.
- Store file content in object storage, not PostgreSQL blobs by default.
- Store provider tokens encrypted and never expose them to clients.
- Apply retention and access controls to sensitive records.
