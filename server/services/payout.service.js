/**
 * Provider payout bookkeeping (US27). A pending payout row is created when a booking completes
 * (or when a late cancellation leaves the provider a retained amount).
 */
const { query } = require('../config/db');

const PLATFORM_FEE_RATE = 0.1;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

