# Module Dependency Map

| Module | Depends on | Priority |
|---|---|---|
| Authentication | None | P0 |
| Organization | Authentication | P0 |
| Employees | Organization | P0 |
| RBAC | Authentication, Organization | P0 |
| Reporting hierarchy | Employees, RBAC | P0 |
| Audit | Identity, core infrastructure | P0 |
| Notifications | Identity, RBAC | P0 |
| Attendance | Employees, RBAC, policies | P1 |
| Projects | Employees, RBAC | P1 |
| Tasks | Projects, Employees | P1 |
| Timesheets | Employees, Projects, Tasks, Approvals | P1 |
| Approvals | Identity, RBAC, reporting hierarchy | P1 |
| Chat | Employees, RBAC, Notifications, Files | P2 |
| Documents | RBAC, Files | P2 |
| Mail | Identity, provider adapters, secure secrets | P2 |
| Calendar | Employees, Notifications | P2 |
| Meetings | Calendar, managed video provider | P3 |
| HRMS | Employees, Approvals | P3 |
| Payroll | HRMS, Attendance, finance controls | P3 |
| Automation | Events, RBAC, Notifications | P4 |
| AI | Authorized search, business APIs, audit | P4 |

Do not start a dependent module before its required foundations are implemented and tested.
