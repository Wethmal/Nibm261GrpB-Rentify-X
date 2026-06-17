/**
 * @file authService.test.js
 * @description Unit tests for password hashing and JWT helpers (SCRUM-86, backend registration API).
 */
process.env.JWT_SECRET = 'test-secret';
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../services/auth.service');

describe('password hashing', () => {
  it('never stores the plain password', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).not.toBe('Password123');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('produces a different hash each time (salted)', async () => {
    expect(await hashPassword('Password123')).not.toBe(await hashPassword('Password123'));
  });

  it('accepts the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('Password123');
    expect(await comparePassword('Password123', hash)).toBe(true);
    expect(await comparePassword('password123', hash)).toBe(false);
  });
});

describe('JWT helpers', () => {
  it('round-trips a payload', () => {
    const decoded = verifyToken(generateToken({ userId: 'u1', role: 'consumer' }));
    expect(decoded).toMatchObject({ userId: 'u1', role: 'consumer' });
  });

  it('honours a custom expiry', () => {
    const { iat, exp } = verifyToken(generateToken({ userId: 'u1' }, { expiresIn: '1h' }));
    expect(exp - iat).toBe(3600);
  });

  it('rejects a tampered token', () => {
    expect(() => verifyToken(generateToken({ userId: 'u1' }) + 'x')).toThrow();
  });

  it('rejects a token signed with another secret', () => {
    expect(() => verifyToken(jwt.sign({ userId: 'u1' }, 'other'))).toThrow();
  });

  it('rejects an expired token', () => {
    const token = jwt.sign({ userId: 'u1' }, 'test-secret', { expiresIn: -10 });
    expect(() => verifyToken(token)).toThrow(/expired/i);
  });
});
