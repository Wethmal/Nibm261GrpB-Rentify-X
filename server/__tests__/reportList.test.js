/**
 * @file reportList.test.js
 * @description Unit tests (mocked DB) for the admin reported-users queue (SCRUM-188, US23).
 */
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../models/notification.model', () => ({ create: jest.fn() }));
jest.mock('../services/notification.service', () => ({ sendEmail: jest.fn() }));
jest.mock('../services/restriction.service', () => ({}));
jest.mock('../services/audit.service', () => ({}));

const { query } = require('../config/db');
const { listReports } = require('../controllers/report.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  query.mockReset();
  query
    .mockResolvedValueOnce({ rows: [{ c: 2 }] })
    .mockResolvedValueOnce({ rows: [{ id: 'r1' }, { id: 'r2' }] })
    .mockResolvedValueOnce({ rows: [{ status: 'pending', c: 2 }] });
});

describe('listReports', () => {
  it('returns reports with total, paging and status counts', async () => {
    const res = mockRes();
    await listReports({ query: {} }, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      reports: [{ id: 'r1' }, { id: 'r2' }],
      total: 2,
      page: 1,
      limit: 20,
      counts: { pending: 2 },
    });
  });

  it('clamps limit to 100 and page to at least 1', async () => {
    const res = mockRes();
    await listReports({ query: { page: '-4', limit: '5000' } }, res, jest.fn());
    const body = res.json.mock.calls[0][0];
    expect(body.page).toBe(1);
    expect(body.limit).toBe(100);
  });

  it('adds status and reason filters as bound parameters', async () => {
    await listReports({ query: { status: 'pending', reason: 'fraud' } }, mockRes(), jest.fn());
    const [sql, params] = query.mock.calls[0];
    expect(sql).toMatch(/r\.status = \$1/);
    expect(sql).toMatch(/r\.reason = \$2/);
    expect(params).toEqual(['pending', 'fraud']);
  });

  it('ignores the "all" status filter', async () => {
    await listReports({ query: { status: 'all' } }, mockRes(), jest.fn());
    expect(query.mock.calls[0][1]).toEqual([]);
  });

  it('forwards database errors to next()', async () => {
    query.mockReset();
    const err = new Error('db down');
    query.mockRejectedValueOnce(err);
    const next = jest.fn();
    await listReports({ query: {} }, mockRes(), next);
    expect(next).toHaveBeenCalledWith(err);
  });
});
