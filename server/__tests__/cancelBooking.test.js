/**
 * @file cancelBooking.test.js
 * @description Unit tests (mocked DB/services) for consumer cancellation and refund preview (SCRUM-226, US26).
 */
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../models/booking.model', () => ({ findById: jest.fn() }));
jest.mock('../models/notification.model', () => ({ create: jest.fn().mockResolvedValue() }));
jest.mock('../services/payment.service', () => ({ processRefund: jest.fn().mockResolvedValue() }));
jest.mock('../services/payout.service', () => ({ createForBooking: jest.fn().mockResolvedValue() }));

const { query } = require('../config/db');
const bookingModel = require('../models/booking.model');
const paymentService = require('../services/payment.service');
const payoutService = require('../services/payout.service');
const { cancelByConsumer, cancelByProvider, cancelAny, getPreview } = require('../controllers/cancellation.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const future = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
const booking = (o = {}) => ({
  id: 'b1', consumer_id: 'c1', provider_id: 'p1', status: 'confirmed', total_price: 1000,
  scheduled_date: future, scheduled_time: '10:00:00', service_listing_id: 'l1', ...o,
});
const req = (userId, extra = {}) => ({ params: { id: 'b1' }, user: { userId }, body: {}, ...extra });

beforeEach(() => {
  query.mockReset();
  bookingModel.findById.mockReset();
  paymentService.processRefund.mockClear();
  payoutService.createForBooking.mockClear();
});

// listing lookup, own policy, platform default -> falls back to moderate preset
const policyQueries = () =>
  query
    .mockResolvedValueOnce({ rows: [{ id: 'l1', type: 'service' }] })
    .mockResolvedValueOnce({ rows: [] })
    .mockResolvedValueOnce({ rows: [] });

describe('cancelByConsumer', () => {
  it('404s for an unknown booking', async () => {
    bookingModel.findById.mockResolvedValue(null);
    const res = mockRes();
    await cancelByConsumer(req('c1'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('403s when the caller is not the booking consumer', async () => {
    bookingModel.findById.mockResolvedValue(booking());
    policyQueries();
    const res = mockRes();
    await cancelByConsumer(req('someone-else'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('400s when the booking is already completed', async () => {
    bookingModel.findById.mockResolvedValue(booking({ status: 'completed' }));
    policyQueries();
    const res = mockRes();
    await cancelByConsumer(req('c1'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('cancels early with a full refund via escrow', async () => {
    bookingModel.findById.mockResolvedValue(booking());
    policyQueries();
    query
      .mockResolvedValueOnce({ rows: [{ id: 'b1', status: 'cancelled' }] }) // UPDATE bookings
      .mockResolvedValueOnce({ rows: [{ id: 'pay1', status: 'escrowed' }] }); // payment
    const res = mockRes();
    await cancelByConsumer(req('c1'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ refundPercent: 100, refundAmount: 1000 });
    expect(paymentService.processRefund).toHaveBeenCalledWith('pay1', 1000, 'consumer_cancelled');
    expect(payoutService.createForBooking).not.toHaveBeenCalled();
  });

  it('forwards errors to next()', async () => {
    const err = new Error('db');
    bookingModel.findById.mockRejectedValue(err);
    const next = jest.fn();
    await cancelByConsumer(req('c1'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});

describe('cancelByProvider / cancelAny', () => {
  it('403s when the caller is not the booking provider', async () => {
    bookingModel.findById.mockResolvedValue(booking());
    policyQueries();
    const res = mockRes();
    await cancelByProvider(req('c1'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('always gives the consumer a full refund', async () => {
    bookingModel.findById.mockResolvedValue(booking({ scheduled_date: new Date(Date.now() + 3600000).toISOString().slice(0, 10) }));
    policyQueries();
    query
      .mockResolvedValueOnce({ rows: [{ id: 'b1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 'pay1', status: 'escrowed' }] });
    const res = mockRes();
    await cancelByProvider(req('p1'), res, jest.fn());
    expect(res.json.mock.calls[0][0]).toMatchObject({ refundPercent: 100, refundAmount: 1000 });
    expect(payoutService.createForBooking).not.toHaveBeenCalled();
  });

  it('cancelAny routes providers to the provider flow', async () => {
    bookingModel.findById.mockResolvedValue(booking());
    policyQueries();
    const res = mockRes();
    await cancelAny(req('c1', { user: { userId: 'c1', role: 'provider' } }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403); // c1 is not the provider -> provider flow was used
  });
});

describe('getPreview', () => {
  it('returns the refund without changing the booking', async () => {
    bookingModel.findById.mockResolvedValue(booking());
    policyQueries();
    const res = mockRes();
    await getPreview(req('c1'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0]).toMatchObject({ bookingId: 'b1', totalPaid: 1000, refundPercent: 100 });
    expect(query.mock.calls.every(([sql]) => !/UPDATE|INSERT/i.test(sql))).toBe(true);
  });
});
