# Banned and suspended account tests

- **Jira task:** SCRUM-197 (US24)
- **Test file:** `server/__tests__/restriction.test.js`
- **Type:** Unit tests with a mocked database (no PostgreSQL needed)

## What is covered

- Banned and unexpired-suspension users are restricted with reason and end date
- Expired suspensions are lifted automatically
- The check fails open on database errors
- Suspension length validation (1-3650 days)
- Suspend and ban revoke all refresh tokens, forcing logout

## How to run

```bash
cd server
npx jest restriction
```
