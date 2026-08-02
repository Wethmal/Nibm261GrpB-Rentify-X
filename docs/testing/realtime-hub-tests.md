# Live notification hub tests

- **Jira task:** SCRUM-178 (real-time booking notifications)
- **Test file:** `server/__tests__/realtime.test.js`
- **Type:** Unit tests (no PostgreSQL needed)

## What is covered

- SSE frame format and online/offline tracking
- Delivery to multiple tabs of one user
- A dropped connection does not block other streams

## How to run

```bash
cd server
npx jest realtime
```
