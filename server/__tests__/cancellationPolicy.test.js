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

  it('never refunds a non-refundable booking', () => {
    const r = calculateRefund(booking, policy('non_refundable'), false, new Date('2029-01-01T00:00:00'));
    expect(r.refundAmount).toBe(0);
  });

  it('always refunds in full when the provider cancels', () => {
    const r = calculateRefund(booking, policy('strict'), true, new Date('2030-01-10T09:59:00'));
    expect(r.refundPercent).toBe(100);
    expect(r.refundAmount).toBe(1000);
  });

  it('rounds partial refunds to two decimals', () => {
    const r = calculateRefund({ ...booking, total_price: 333.33 }, policy('moderate'), false, new Date('2030-01-09T00:00:00'));
    expect(r.refundAmount).toBe(166.67);
  });
});

describe('policy presets', () => {
  it('exposes the four supported policy types', () => {
    expect(POLICY_TYPES).toEqual(['flexible', 'moderate', 'strict', 'non_refundable']);
  });

  it('describes a policy in plain language', () => {
    const { summary } = describePolicy(policy('moderate'));
    expect(summary[0]).toMatch(/full refund/i);
    expect(summary.join(' ')).toMatch(/50% refund/);
  });

  it('describes a non-refundable policy', () => {
    expect(describePolicy(policy('non_refundable')).summary).toEqual(['No refund on cancellation.']);
  });
});

describe('computeAmounts (10% platform fee)', () => {
  it('splits gross into fee and net', () => {
    expect(computeAmounts(1000)).toEqual({ gross: 1000, fee: 100, net: 900 });
  });

  it('rounds to cents', () => {
    expect(computeAmounts(1234.56)).toEqual({ gross: 1234.56, fee: 123.46, net: 1111.1 });
  });
});
