/**
 * Provider payout bookkeeping (US27). A pending payout row is created when a booking completes
 * (or when a late cancellation leaves the provider a retained amount).
 */
const { query } = require('../config/db');

