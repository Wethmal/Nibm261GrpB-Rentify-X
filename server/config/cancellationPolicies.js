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
const bookingStart = (booking) => {
  const d = booking.scheduled_date instanceof Date
    ? booking.scheduled_date.toISOString().slice(0, 10)
    : String(booking.scheduled_date).slice(0, 10);
  const t = String(booking.scheduled_time || '00:00:00').slice(0, 8);
  return new Date(`${d}T${t.length === 5 ? `${t}:00` : t}`);
};

/**
 * @returns {{refundPercent:number, refundAmount:number, hoursBeforeStart:number}}
 */
const calculateRefund = (booking, policy, providerFault = false, now = new Date()) => {
  const total = Number(booking.total_price) || 0;
  const hoursBeforeStart = (bookingStart(booking).getTime() - now.getTime()) / 3600000;
  if (providerFault) return { refundPercent: 100, refundAmount: total, hoursBeforeStart };

  let refundPercent = 0;
  if (policy.policy_type !== 'non_refundable') {
    if (hoursBeforeStart >= policy.full_refund_hours) refundPercent = 100;
    else if (hoursBeforeStart >= policy.partial_refund_hours && policy.partial_refund_percent > 0) {
      refundPercent = policy.partial_refund_percent;
    }
  }
  const refundAmount = Math.round(total * refundPercent) / 100;
  return { refundPercent, refundAmount, hoursBeforeStart };
};

