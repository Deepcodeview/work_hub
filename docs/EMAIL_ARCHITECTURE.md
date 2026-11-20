# WorkHub Mail Architecture

## Strategy
Build WorkHub's own email user experience while using existing company mailbox providers.

## Provider adapters
- Microsoft Graph provider.
- Gmail API provider.
- Generic SMTP/IMAP provider where capabilities permit.

## Important distinction
SMTP sends outbound mail. Incoming delivery and mailbox synchronization require provider APIs,
IMAP, or a configured inbound mail route. Do not assume SMTP alone provides a mailbox.

## Provider interface responsibilities
- connect/disconnect
- send message
- sync folders
- sync messages using provider cursors
- fetch message
- mark read/unread
- move/archive message
- manage drafts where provider supports it

## Synchronization requirements
- Incremental sync.
- Provider cursor/UID persistence.
- Deduplication using provider IDs and Message-ID where appropriate.
- Retry with backoff.
- Webhooks where available.
- Scheduled fallback sync.
- Attachment handling.
- Reconnection after expired/revoked credentials.
- Explicit provider capability model.

## Security
- OAuth preferred for Google and Microsoft.
- Encrypt access and refresh tokens.
- Keep secrets server-side.
- Sanitize HTML email.
- Protect against remote image tracking by default.
- Scan attachments.
- Do not log email bodies or credentials.
- Mailbox access is private unless explicitly shared.
- Restrict outbound sending to authorized connected mailboxes.

## Out of scope for initial release
- Operating a global mail delivery network.
- Building spam reputation systems.
- Hosting mailboxes for the public internet.
