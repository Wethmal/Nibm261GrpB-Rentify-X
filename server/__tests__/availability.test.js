/**
 * @file availability.test.js
 * @description Unit tests (mocked DB) for double-booking prevention (SCRUM-127).
 */
jest.mock('../config/db', () => ({ query: jest.fn() }));
const { query } = require('../config/db');
const { checkAvailability } = require('../services/availability.service');

beforeEach(() => query.mockReset());

const listing = (type) => ({ rowCount: 1, rows: [{ id: 'l1', type }] });
const none = { rowCount: 0, rows: [] };
const hit = { rowCount: 1, rows: [{}] };

describe('checkAvailability', () => {
  it('is unavailable for an unknown listing', async () => {
    query.mockResolvedValueOnce(none);
    expect(await checkAvailability('x', '2030-01-01', '10:00', 2)).toEqual({ isAvailable: false });
  });

  it('is available when nothing conflicts', async () => {
    query.mockResolvedValueOnce(listing('service')).mockResolvedValueOnce(none);
    expect(await checkAvailability('l1', '2030-01-01', '10:00', 2)).toEqual({ isAvailable: true });
  });

  it('rejects an overlapping confirmed booking and suggests the next free date', async () => {
    query
      .mockResolvedValueOnce(listing('service'))
      .mockResolvedValueOnce(hit) // overlap on the requested day
      .mockResolvedValueOnce(none); // next day is free
    expect(await checkAvailability('l1', '2030-01-01', '10:00', 2)).toEqual({
      isAvailable: false,
      nextAvailableDate: '2030-01-02',
    });
  });

  it('rejects a date the provider blocked for equipment', async () => {
    query
      .mockResolvedValueOnce(listing('equipment'))
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ is_available: false }] })
      .mockResolvedValueOnce(none) // next day: not blocked
      .mockResolvedValueOnce(none); // next day: no booking
    const r = await checkAvailability('l1', '2030-01-01', '10:00', 2);
    expect(r.isAvailable).toBe(false);
    expect(r.nextAvailableDate).toBe('2030-01-02');
  });

  it('skips blocked dates when scanning forward', async () => {
    query
      .mockResolvedValueOnce(listing('equipment'))
      .mockResolvedValueOnce(none) // requested day not blocked
      .mockResolvedValueOnce(hit) // but booked
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ is_available: false }] }) // 01-02 blocked
      .mockResolvedValueOnce(none) // 01-03 not blocked
      .mockResolvedValueOnce(none); // 01-03 free
    expect((await checkAvailability('l1', '2030-01-01', '10:00', 2)).nextAvailableDate).toBe('2030-01-03');
  });

  it('gives up after scanning 30 days', async () => {
    query.mockResolvedValueOnce(listing('service')).mockResolvedValue(hit);
    expect(await checkAvailability('l1', '2030-01-01', '10:00', 2)).toEqual({ isAvailable: false, nextAvailableDate: null });
  });
});
