/**
 * Cancellation policy presets and refund calculation (US26).
 * Rules: cancelling at least `full_refund_hours` before start → 100% refund;
 * at least `partial_refund_hours` before start → `partial_refund_percent`; otherwise nothing.
 */
const PRESETS = {
  flexible: { full_refund_hours: 24, partial_refund_hours: 0, partial_refund_percent: 0 },
  moderate: { full_refund_hours: 48, partial_refund_hours: 24, partial_refund_percent: 50 },
  strict: { full_refund_hours: 168, partial_refund_hours: 72, partial_refund_percent: 50 },
  non_refundable: { full_refund_hours: 100000, partial_refund_hours: 100000, partial_refund_percent: 0 },
};

const POLICY_TYPES = Object.keys(PRESETS);

/** Build the start Date of a booking from its DATE and TIME columns. */
