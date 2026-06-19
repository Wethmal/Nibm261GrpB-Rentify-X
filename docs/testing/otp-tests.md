# One-time code tests

- **Jira task:** SCRUM-119 (password reset flow)
- **Test file:** `server/__tests__/otp.test.js`
- **Type:** Unit tests (no PostgreSQL needed)

## What is covered

- 6-digit code generation and 60 second resend cooldown
- Single use codes, attempt countdown and invalidation after 3 failures
- Expired codes are rejected

## How to run

```bash
cd server
npx jest otp
```
