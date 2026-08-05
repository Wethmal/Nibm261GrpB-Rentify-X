# Booking cancellation tests

- **Jira task:** SCRUM-226 (consumer cancellation, US26)
- **Test file:** `server/__tests__/cancelBooking.test.js`
- **Type:** Unit tests (no PostgreSQL needed)

## What is covered

- 404, 403 and 400 guards for consumer and provider cancellation
- Full escrow refund on early cancellation and provider-fault cancellation
- Role routing in cancelAny and a side-effect-free refund preview

## How to run

```bash
cd server
npx jest cancelBooking
```
