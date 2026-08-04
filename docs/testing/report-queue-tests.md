# Reported-user moderation queue tests

- **Jira task:** SCRUM-188 (US23)
- **Test file:** `server/__tests__/reportList.test.js`
- **Type:** Unit tests with a mocked database (no PostgreSQL needed)

## What is covered

- Response shape: reports, total, page, limit and per-status counts
- Paging is clamped (page >= 1, limit <= 100)
- Status and reason filters use bound parameters; `all` is ignored
- Database errors are forwarded to `next()`

## How to run

```bash
cd server
npx jest reportList
```
