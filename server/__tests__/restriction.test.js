/**
 * @file restriction.test.js
 * @description Unit tests (mocked DB) for banned/suspended account enforcement (SCRUM-197, US24).
 */
jest.mock('../config/db', () => ({ query: jest.fn() }));
jest.mock('../models/refresh_token.model', () => ({ revokeAllForUser: jest.fn() }));

const { query } = require('../config/db');
const refreshModel = require('../models/refresh_token.model');
const restriction = require('../services/restriction.service');

beforeEach(() => {
  query.mockReset();
  refreshModel.revokeAllForUser.mockReset();
});

describe('checkRestriction', () => {
  it('does not restrict an unknown user', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect(await restriction.checkRestriction('x')).toEqual({ restricted: false });
  });

  it('does not restrict a verified user', async () => {
    query.mockResolvedValueOnce({ rows: [{ status: 'verified' }] });
    expect((await restriction.checkRestriction('u1')).restricted).toBe(false);
  });

  it('restricts a banned user with the stored reason', async () => {
    query.mockResolvedValueOnce({ rows: [{ status: 'banned', status_reason: 'fraud' }] });
    expect(await restriction.checkRestriction('u1')).toEqual({ restricted: true, status: 'banned', reason: 'fraud' });
  });

  it('restricts a user whose suspension has not expired', async () => {
    const until = new Date(Date.now() + 86400000).toISOString();
    query.mockResolvedValueOnce({ rows: [{ status: 'suspended', status_reason: 'spam', suspended_until: until }] });
    expect(await restriction.checkRestriction('u1')).toEqual({ restricted: true, status: 'suspended', reason: 'spam', until });
  });

  it('lifts an expired suspension and reinstates the user', async () => {
    const until = new Date(Date.now() - 1000).toISOString();
    query
      .mockResolvedValueOnce({ rows: [{ status: 'suspended', suspended_until: until }] })
      .mockResolvedValueOnce({ rows: [{ id: 'u1', status: 'verified' }] });
    expect(await restriction.checkRestriction('u1')).toEqual({ restricted: false });
    expect(query.mock.calls[1][0]).toMatch(/SET status = 'verified'/);
  });

  it('fails open when the database errors', async () => {
    query.mockRejectedValueOnce(new Error('boom'));
    expect(await restriction.checkRestriction('u1')).toEqual({ restricted: false });
  });
});

describe('suspend / ban', () => {
  it.each([0, -1, 3651, 'abc', NaN])('rejects invalid suspension length %p', async (days) => {
    await expect(restriction.suspend('u1', days, 'r')).rejects.toMatchObject({ status: 400 });
    expect(query).not.toHaveBeenCalled();
  });

  it('suspends and revokes all refresh tokens (forces logout)', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', status: 'suspended' }] });
    const row = await restriction.suspend('u1', 7, 'spam');
    expect(row.status).toBe('suspended');
    expect(query.mock.calls[0][1]).toEqual(['u1', 'spam', '7']);
    expect(refreshModel.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('bans, defaults the reason and revokes sessions', async () => {
    query.mockResolvedValueOnce({ rows: [{ id: 'u1', status: 'banned' }] });
    await restriction.ban('u1');
    expect(query.mock.calls[0][1]).toEqual(['u1', 'Banned by admin']);
    expect(refreshModel.revokeAllForUser).toHaveBeenCalledWith('u1');
  });

  it('does not revoke sessions when the user does not exist', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect(await restriction.ban('missing')).toBeNull();
    expect(refreshModel.revokeAllForUser).not.toHaveBeenCalled();
  });
});
