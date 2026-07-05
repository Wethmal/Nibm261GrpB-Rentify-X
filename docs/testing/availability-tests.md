# Double-booking prevention tests

- **Jira task:** SCRUM-127 (double booking check)
- **Test file:** `server/__tests__/availability.test.js`
- **Type:** Unit tests (no PostgreSQL needed)

## What is covered

- Unknown listing, free slot and overlapping confirmed booking
- Blocked equipment dates
- Next available date scan, including the 30 day limit

## How to run

```bash
cd server
npx jest availability
```
