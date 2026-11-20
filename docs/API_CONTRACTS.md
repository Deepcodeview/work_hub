# API Contract Conventions

- Base path: `/api/v1`.
- JSON request and response bodies.
- Validate inputs at the boundary.
- Use consistent error codes.
- Use cursor pagination for messages and high-volume activity.
- Use idempotency keys for retryable critical writes.
- Never expose internal secrets or provider tokens.
- Document every endpoint and permission requirement.

Example error:
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_FORBIDDEN",
    "message": "You do not have permission to access this resource."
  }
}
```
