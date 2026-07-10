/**
 * @file roleMiddleware.test.js
 * @description Unit tests for role-based access control used by admin approval routes (SCRUM-165).
 */
const authorize = require('../middleware/role.middleware');

const run = (mw, user) => {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  const next = jest.fn();
  mw({ user }, res, next);
  return { res, next };
};

describe('authorize', () => {
  it('returns 401 when there is no authenticated user', () => {
    const { res, next } = run(authorize('admin'), undefined);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 for a role that is not allowed', () => {
    const { res, next } = run(authorize('admin'), { role: 'provider' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next for an allowed role', () => {
    const { res, next } = run(authorize('admin'), { role: 'admin' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('supports several allowed roles', () => {
    const mw = authorize('provider', 'admin');
    expect(run(mw, { role: 'provider' }).next).toHaveBeenCalled();
    expect(run(mw, { role: 'consumer' }).res.status).toHaveBeenCalledWith(403);
  });

  it('is also exposed as a named export', () => {
    expect(authorize.requireRole).toBe(authorize);
  });
});
