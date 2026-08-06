/**
 * @file payout.test.js
 * @description Unit tests (mocked DB) for provider payout maths and creation (SCRUM-233, US27).
 */
jest.mock('../config/db', () => ({ query: jest.fn() }));

const { query } = require('../config/db');
const { computeAmounts, createForBooking, PLATFORM_FEE_RATE } = require('../services/payout.service');

beforeEach(() => query.mockReset());

describe('computeAmounts', () => {
  it('splits gross into a 10% platform fee and net', () => {
    expect(PLATFORM_FEE_RATE).toBe(0.1);
    expect(computeAmounts(1000)).toEqual({ gross: 1000, fee: 100, net: 900 });
  });

  it('rounds to two decimals', () => {
    expect(computeAmounts(333.33)).toEqual({ gross: 333.33, fee: 33.33, net: 300 });
  });

  it('accepts a custom fee rate and numeric strings', () => {
    expect(computeAmounts('200', 0.25)).toEqual({ gross: 200, fee: 50, net: 150 });
  });
});

describe('createForBooking', () => {
  const booking = { id: 'b1', provider_id: 'p1', total_price: 500 };

  it('inserts a pending payout and marks the booking', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'po1' }] }).mockResolvedValueOnce({});
    expect(await createForBooking(booking)).toEqual({ id: 'po1' });
    expect(query.mock.calls[0][1]).toEqual(['p1', 'b1', 500, 50, 450]);
    expect(query.mock.calls[1][0]).toMatch(/payout_status = 'pending'/);
  });

  it('uses the gross override for late cancellations', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'po2' }] }).mockResolvedValueOnce({});
    await createForBooking(booking, 250);
    expect(query.mock.calls[0][1]).toEqual(['p1', 'b1', 250, 25, 225]);
  });

  it.each([0, -5])('skips zero or negative amounts (%p)', async (gross) => {
    expect(await createForBooking(booking, gross)).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it('is idempotent: a duplicate booking returns null and does not update it', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect(await createForBooking(booking)).toBeNull();
    expect(query).toHaveBeenCalledTimes(1);
  });
});
