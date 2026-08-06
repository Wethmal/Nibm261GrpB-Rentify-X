# Provider payout tests

- **Jira task:** SCRUM-233 (US27)
- **Test file:** `server/__tests__/payout.test.js`
- **Type:** Unit tests with a mocked database (no PostgreSQL needed)

## What is covered

- 10% platform fee split with two-decimal rounding and custom rates
- Pending payout creation and booking payout status update
- Gross override for late cancellations
- Zero/negative amounts are skipped; duplicate bookings are idempotent

## How to run

```bash
cd server
npx jest payout
```
