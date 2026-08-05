/**
 * @file cancellationPolicy.test.js
 * @description Pure unit tests (no database) for refund calculation, policy summaries and payout maths (US26/US27).
 */
const { PRESETS, POLICY_TYPES, calculateRefund, describePolicy } = require('../config/cancellationPolicies');
const { computeAmounts } = require('../services/payout.service');

const booking = { total_price: 1000, scheduled_date: '2030-01-10', scheduled_time: '10:00:00' };
const policy = (type) => ({ policy_type: type, ...PRESETS[type] });

describe('calculateRefund', () => {
  it('gives a full refund well before the start (moderate)', () => {
    const r = calculateRefund(booking, policy('moderate'), false, new Date('2030-01-07T10:00:00'));
    expect(r.refundPercent).toBe(100);
    expect(r.refundAmount).toBe(1000);
  });

  it('gives a partial refund inside the partial window (moderate)', () => {
    const r = calculateRefund(booking, policy('moderate'), false, new Date('2030-01-09T00:00:00'));
    expect(r.refundPercent).toBe(50);
    expect(r.refundAmount).toBe(500);
  });

  it('gives no refund inside the last 24 hours (moderate)', () => {
    const r = calculateRefund(booking, policy('moderate'), false, new Date('2030-01-09T18:00:00'));
    expect(r.refundPercent).toBe(0);
    expect(r.refundAmount).toBe(0);
  });

