/**
 * @file otp.test.js
 * @description Unit tests for one-time-code generation and verification (SCRUM-119, password reset flow).
 */
const otp = require('../services/otp.service');

beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => jest.restoreAllMocks());

describe('otp.generate', () => {
  it('returns a 6-digit numeric code', async () => {
    expect(await otp.generate('a@x.lk')).toMatch(/^\d{6}$/);
  });

  it('enforces a 60 second resend cooldown', async () => {
    await otp.generate('cool@x.lk');
    await expect(otp.resend('cool@x.lk')).rejects.toThrow(/wait 60 seconds/);
  });

  it('allows a new code after the cooldown', async () => {
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(now);
    await otp.generate('later@x.lk');
    spy.mockReturnValue(now + 61000);
    await expect(otp.generate('later@x.lk')).resolves.toMatch(/^\d{6}$/);
  });
});

describe('otp.verify', () => {
  it('reports when no code was requested', async () => {
    expect((await otp.verify('none@x.lk', '123456')).valid).toBe(false);
  });

  it('accepts the correct code once only', async () => {
    const code = await otp.generate('once@x.lk');
    expect((await otp.verify('once@x.lk', code)).valid).toBe(true);
    expect((await otp.verify('once@x.lk', code)).valid).toBe(false);
  });

  it('counts down remaining attempts, then invalidates the code', async () => {
    const code = await otp.generate('bad@x.lk');
    const wrong = code === '000000' ? '111111' : '000000';
    expect((await otp.verify('bad@x.lk', wrong)).message).toMatch(/2 attempts remaining/);
    expect((await otp.verify('bad@x.lk', wrong)).message).toMatch(/1 attempts remaining/);
    expect((await otp.verify('bad@x.lk', wrong)).message).toMatch(/invalidated/);
    expect((await otp.verify('bad@x.lk', code)).valid).toBe(false);
  });

  it('rejects an expired code', async () => {
    const now = Date.now();
    const spy = jest.spyOn(Date, 'now').mockReturnValue(now);
    const code = await otp.generate('exp@x.lk');
    spy.mockReturnValue(now + 11 * 60 * 1000);
    expect((await otp.verify('exp@x.lk', code)).message).toMatch(/expired/i);
  });
});
