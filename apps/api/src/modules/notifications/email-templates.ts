/**
 * WorkHub Brand-Aligned HTML Email Notification Templates
 * Styled with warm orange accents (#FF8A00), clean cards, and responsive email markup.
 */

export interface EmailTemplatePayload {
  recipientName: string;
  actionTitle: string;
  actionMessage: string;
  details?: { label: string; value: string }[];
  ctaText?: string;
  ctaUrl?: string;
  accentColor?: string;
}

/**
 * Base responsive HTML email wrapper
 */
export function renderEmailWrapper(payload: EmailTemplatePayload): string {
  const accent = payload.accentColor || '#FF8A00';
  const ctaButton = payload.ctaText && payload.ctaUrl
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 10px 0;">
        <tr>
          <td align="center" style="border-radius: 9999px; background: ${accent};">
            <a href="${payload.ctaUrl}" target="_blank" style="display: inline-block; padding: 12px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #FFFFFF; text-decoration: none; border-radius: 9999px;">
              ${payload.ctaText} &rarr;
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  const detailsRows = payload.details && payload.details.length > 0
    ? `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background: #FAF7F2; border: 1px solid #EFEAE2; border-radius: 16px; padding: 14px 18px;">
        ${payload.details
          .map(
            (d) => `
          <tr>
            <td style="padding: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #64748B; font-weight: 600;">
              ${d.label}
            </td>
            <td align="right" style="padding: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #1F2937; font-weight: 700;">
              ${d.value}
            </td>
          </tr>
        `
          )
          .join('')}
      </table>
    `
    : '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${payload.actionTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FBF9F5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FBF9F5; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #F1ECE4; border-radius: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); overflow: hidden;">
          <!-- Top Orange Brand Bar -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #FF981A 0%, #FF7A00 100%);"></td>
          </tr>

          <!-- Header / Brand Logo -->
          <tr>
            <td style="padding: 32px 36px 20px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="left">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="width: 38px; height: 38px; background: #FF8A00; border-radius: 12px; text-align: center; vertical-align: middle; color: #FFFFFF; font-weight: 900; font-size: 20px;">
                          W
                        </td>
                        <td style="padding-left: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          <span style="font-size: 17px; font-weight: 800; color: #1F2937; display: block; line-height: 1.1;">WorkHub</span>
                          <span style="font-size: 11px; font-weight: 500; color: #8A92A6; display: block;">Workforce Management</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 10px 36px 36px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #1F2937; line-height: 1.3;">
                ${payload.actionTitle}
              </h1>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
                Hi ${payload.recipientName},
              </p>
              <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #4B5563;">
                ${payload.actionMessage}
              </p>

              ${detailsRows}
              ${ctaButton}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #FAF8F5; border-top: 1px solid #F1ECE4; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #8A92A6; font-weight: 500;">
                You received this email because an action was triggered on your WorkHub account.
              </p>
              <p style="margin: 0; font-size: 11px; color: #A0AAB8;">
                &copy; ${new Date().getFullYear()} WorkHub Internal OS. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Pre-configured action notification email generators
 */
export const EmailNotificationTemplates = {
  /**
   * Action: Timesheet Submitted -> Sent to Manager
   */
  timesheetSubmitted: (data: {
    managerName: string;
    employeeName: string;
    weekPeriod: string;
    totalHours: number;
    approvalUrl: string;
  }) => {
    return {
      subject: `[WorkHub] Timesheet Submitted for Approval: ${data.employeeName} (${data.weekPeriod})`,
      html: renderEmailWrapper({
        recipientName: data.managerName,
        actionTitle: 'Timesheet Pending Your Approval',
        actionMessage: `${data.employeeName} has submitted their weekly timesheet for review and approval.`,
        details: [
          { label: 'Employee', value: data.employeeName },
          { label: 'Week Period', value: data.weekPeriod },
          { label: 'Total Logged Hours', value: `${data.totalHours} hrs` },
          { label: 'Status', value: 'Submitted (Pending Review)' },
        ],
        ctaText: 'Review & Approve Timesheet',
        ctaUrl: data.approvalUrl,
        accentColor: '#FF8A00',
      }),
    };
  },

  /**
   * Action: Timesheet Approved / Rejected -> Sent to Employee
   */
  timesheetReviewed: (data: {
    employeeName: string;
    managerName: string;
    status: 'APPROVED' | 'REJECTED';
    weekPeriod: string;
    comments?: string;
    timesheetUrl: string;
  }) => {
    const isApproved = data.status === 'APPROVED';
    return {
      subject: `[WorkHub] Your Timesheet has been ${isApproved ? 'Approved' : 'Rejected'} (${data.weekPeriod})`,
      html: renderEmailWrapper({
        recipientName: data.employeeName,
        actionTitle: isApproved ? 'Timesheet Approved' : 'Timesheet Requires Revision',
        actionMessage: isApproved
          ? `Your timesheet for ${data.weekPeriod} was approved by ${data.managerName}.`
          : `Your timesheet for ${data.weekPeriod} was rejected by ${data.managerName} and requires updates.`,
        details: [
          { label: 'Reviewer', value: data.managerName },
          { label: 'Week Period', value: data.weekPeriod },
          { label: 'Decision', value: isApproved ? 'Approved' : 'Rejected' },
          ...(data.comments ? [{ label: 'Manager Comments', value: data.comments }] : []),
        ],
        ctaText: isApproved ? 'View Timesheet Record' : 'Edit & Resubmit Timesheet',
        ctaUrl: data.timesheetUrl,
        accentColor: isApproved ? '#16A34A' : '#DC2626',
      }),
    };
  },

  /**
   * Action: Leave Request Submitted -> Sent to Manager
   */
  leaveApplied: (data: {
    managerName: string;
    employeeName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    reason?: string;
    approvalUrl: string;
  }) => {
    return {
      subject: `[WorkHub] New Leave Request: ${data.employeeName} (${data.leaveType})`,
      html: renderEmailWrapper({
        recipientName: data.managerName,
        actionTitle: 'New Leave Request Received',
        actionMessage: `${data.employeeName} has submitted a request for ${data.durationDays} day(s) of ${data.leaveType}.`,
        details: [
          { label: 'Applicant', value: data.employeeName },
          { label: 'Leave Type', value: data.leaveType },
          { label: 'Duration', value: `${data.startDate} to ${data.endDate} (${data.durationDays} days)` },
          ...(data.reason ? [{ label: 'Reason', value: data.reason }] : []),
        ],
        ctaText: 'Review Leave Application',
        ctaUrl: data.approvalUrl,
        accentColor: '#FF8A00',
      }),
    };
  },

  /**
   * Action: Leave Approved / Rejected -> Sent to Employee
   */
  leaveReviewed: (data: {
    employeeName: string;
    managerName: string;
    leaveType: string;
    status: 'APPROVED' | 'REJECTED';
    startDate: string;
    endDate: string;
    leaveUrl: string;
  }) => {
    const isApproved = data.status === 'APPROVED';
    return {
      subject: `[WorkHub] Leave Request ${isApproved ? 'Approved' : 'Rejected'}: ${data.leaveType}`,
      html: renderEmailWrapper({
        recipientName: data.employeeName,
        actionTitle: isApproved ? 'Leave Request Approved!' : 'Leave Request Rejected',
        actionMessage: isApproved
          ? `Your ${data.leaveType} from ${data.startDate} to ${data.endDate} has been approved.`
          : `Your ${data.leaveType} from ${data.startDate} to ${data.endDate} was not approved.`,
        details: [
          { label: 'Reviewed By', value: data.managerName },
          { label: 'Leave Type', value: data.leaveType },
          { label: 'Dates', value: `${data.startDate} - ${data.endDate}` },
          { label: 'Status', value: isApproved ? 'Approved' : 'Rejected' },
        ],
        ctaText: 'View Leave Balances',
        ctaUrl: data.leaveUrl,
        accentColor: isApproved ? '#16A34A' : '#DC2626',
      }),
    };
  },

  /**
   * Action: New Task Assigned -> Sent to Employee
   */
  taskAssigned: (data: {
    assigneeName: string;
    assignerName: string;
    taskTitle: string;
    projectName: string;
    priority: string;
    dueDate?: string;
    taskUrl: string;
  }) => {
    return {
      subject: `[WorkHub] Task Assigned: ${data.taskTitle} (${data.projectName})`,
      html: renderEmailWrapper({
        recipientName: data.assigneeName,
        actionTitle: 'You Were Assigned a New Task',
        actionMessage: `${data.assignerName} assigned you to work on "${data.taskTitle}" in ${data.projectName}.`,
        details: [
          { label: 'Project', value: data.projectName },
          { label: 'Priority', value: data.priority },
          ...(data.dueDate ? [{ label: 'Due Date', value: data.dueDate }] : []),
          { label: 'Assigned By', value: data.assignerName },
        ],
        ctaText: 'Open Task on Kanban Board',
        ctaUrl: data.taskUrl,
        accentColor: '#3B82F6',
      }),
    };
  },

  /**
   * Action: Employee Welcome & Onboarding Invitation -> Sent to New Hire
   */
  employeeInvitation: (data: {
    recipientName: string;
    companyName: string;
    invitationUrl: string;
    roleName: string;
  }) => {
    return {
      subject: `Welcome to ${data.companyName}! Complete your WorkHub account setup`,
      html: renderEmailWrapper({
        recipientName: data.recipientName,
        actionTitle: `Welcome to ${data.companyName}!`,
        actionMessage: `You have been invited to join the ${data.companyName} team on WorkHub as a ${data.roleName}. Click the button below to set up your password and start using your workspace.`,
        details: [
          { label: 'Company', value: data.companyName },
          { label: 'Designation / Role', value: data.roleName },
          { label: 'Platform', value: 'WorkHub Operations' },
        ],
        ctaText: 'Activate My Account',
        ctaUrl: data.invitationUrl,
        accentColor: '#FF8A00',
      }),
    };
  },

  /**
   * Action: Monthly Payslip Generated -> Sent to Employee
   */
  payslipGenerated: (data: {
    employeeName: string;
    monthYear: string;
    netPay: string;
    payslipUrl: string;
  }) => {
    return {
      subject: `[WorkHub] Your Payslip for ${data.monthYear} is Ready`,
      html: renderEmailWrapper({
        recipientName: data.employeeName,
        actionTitle: `Payslip Issued: ${data.monthYear}`,
        actionMessage: `Your monthly compensation for ${data.monthYear} has been finalized and processed.`,
        details: [
          { label: 'Period', value: data.monthYear },
          { label: 'Net Disbursed Pay', value: data.netPay },
          { label: 'Status', value: 'Processed & Released' },
        ],
        ctaText: 'View & Download Payslip',
        ctaUrl: data.payslipUrl,
        accentColor: '#16A34A',
      }),
    };
  },
};
