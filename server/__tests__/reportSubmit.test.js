/**
 * @file reportSubmit.test.js
 * @description Unit tests (mocked DB) for submitting a user report (SCRUM-247, US29).
 */
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../models/notification.model', () => ({ create: jest.fn().mockResolvedValue() }));
jest.mock('../services/notification.service', () => ({ sendEmail: jest.fn() }));
jest.mock('../services/restriction.service', () => ({}));
jest.mock('../services/audit.service', () => ({}));

const { query } = require('../config/db');
const { submitReport } = require('../controllers/report.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};
const req = (body = {}, id = 'target', userId = 'me') => ({ user: { userId }, params: { id }, body });
const goodBody = { reason: 'fraud', description: 'x'.repeat(25) };

beforeEach(() => query.mockReset());

describe('submitReport validation', () => {
  it('rejects reporting yourself', async () => {
    const res = mockRes();
    await submitReport(req(goodBody, 'me'), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects an unknown reason', async () => {
    const res = mockRes();
    await submitReport(req({ ...goodBody, reason: 'nope' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('rejects a description shorter than 20 characters', async () => {
    const res = mockRes();
    await submitReport(req({ reason: 'fraud', description: 'too short' }), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(400);
    expect(query).not.toHaveBeenCalled();
  });

  it('returns 404 when the reported user does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const res = mockRes();
    await submitReport(req(goodBody), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 429 after 5 reports in 24 hours', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'target' }] }).mockResolvedValueOnce({ rows: [{ c: 5 }] });
    const res = mockRes();
    await submitReport(req(goodBody), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(429);
  });

  it('returns 409 when an open report already exists', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'target' }] })
      .mockResolvedValueOnce({ rows: [{ c: 0 }] })
      .mockResolvedValueOnce({ rowCount: 1 });
    const res = mockRes();
    await submitReport(req(goodBody), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(409);
  });

  it('creates the report and returns 201', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ id: 'target', full_name: 'T' }] })
      .mockResolvedValueOnce({ rows: [{ c: 0 }] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 'r1', status: 'pending' }] })
      .mockResolvedValue({ rows: [{ c: 0 }] });
    const res = mockRes();
    await submitReport(req(goodBody), res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].report.id).toBe('r1');
  });
});
