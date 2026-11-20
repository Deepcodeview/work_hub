# WorkHub Authorization Model

Use RBAC plus resource-level and organization-scope checks.

## Default roles
- SYSTEM_ADMIN
- HR_ADMIN
- DEPARTMENT_HEAD
- REPORTING_MANAGER
- PROJECT_MANAGER
- FINANCE
- EMPLOYEE

## Scope types
- SELF
- REPORTING_TEAM
- DEPARTMENT
- PROJECT
- COMPANY

## Example permission keys
- employee.read.self
- employee.read.reporting_team
- employee.read.department
- employee.manage
- reporting.assign
- attendance.read.self
- attendance.read.reporting_team
- attendance.manage
- timesheet.submit.self
- timesheet.approve.assigned
- project.create
- project.read.assigned
- project.manage.assigned
- task.create
- task.assign
- chat.read.conversation
- mail.read.own_mailbox
- mail.manage.shared_mailbox
- payroll.read
- payroll.manage
- audit.read

## Rules
- Backend authorization is mandatory on every protected operation.
- Resource membership and role scope must both be checked.
- Deny by default.
- Sensitive permission overrides require audit records.
- Users may have multiple roles.
- A user must never approve their own timesheet, even if they hold another role.
- Department Head access does not automatically grant payroll or private mailbox access.
- Project membership does not grant access to HR records.
