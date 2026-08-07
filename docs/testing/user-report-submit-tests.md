# User report submission tests

- **Jira task:** SCRUM-247 (US29)
- **Test file:** `server/__tests__/reportSubmit.test.js`
- **Type:** Unit tests with a mocked database (no PostgreSQL needed)

## What is covered

- Rejects self-reports, unknown reasons and short descriptions
- 404 for unknown users, 429 after 5 reports/day, 409 for duplicate open reports
- 201 with the created report on success

## How to run

```bash
cd server
npx jest reportSubmit
```
