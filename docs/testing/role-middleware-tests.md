# Role-based access tests

- **Jira task:** SCRUM-165 (approve/reject provider account)
- **Test file:** `server/__tests__/roleMiddleware.test.js`
- **Type:** Unit tests (no PostgreSQL needed)

## What is covered

- 401 without a user, 403 for a disallowed role
- Allowed roles pass through, multiple roles supported

## How to run

```bash
cd server
npx jest roleMiddleware
```
