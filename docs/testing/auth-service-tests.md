# Password hashing and JWT tests

- **Jira task:** SCRUM-86 (backend registration API)
- **Test file:** `server/__tests__/authService.test.js`
- **Type:** Unit tests (no PostgreSQL needed)

## What is covered

- bcrypt hashes are salted, never plain text, cost factor 12
- Correct and wrong password comparison
- JWT round trip, custom expiry, tampered, wrong-secret and expired tokens

## How to run

```bash
cd server
npx jest authService
```
