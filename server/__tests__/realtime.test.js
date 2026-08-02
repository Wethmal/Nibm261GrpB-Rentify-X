/**
 * @file realtime.test.js
 * @description Unit tests for the server-sent-events hub behind live booking notifications (SCRUM-178).
 */
const realtime = require('../services/realtime');

const stream = () => ({ write: jest.fn() });

describe('realtime hub', () => {
  it('reports offline users and returns false when publishing to them', () => {
    expect(realtime.isOnline('nobody')).toBe(false);
    expect(realtime.publish('nobody', 'notification', {})).toBe(false);
  });

  it('formats events as SSE frames', () => {
    const res = stream();
    realtime.addClient('u1', res);
    expect(realtime.publish('u1', 'notification', { id: 1 })).toBe(true);
    expect(res.write).toHaveBeenCalledWith('event: notification\ndata: {"id":1}\n\n');
    realtime.removeClient('u1', res);
  });

  it('delivers to every open tab of the same user', () => {
    const a = stream();
    const b = stream();
    realtime.addClient('u2', a);
    realtime.addClient('u2', b);
    realtime.publish('u2', 'ping', {});
    expect(a.write).toHaveBeenCalled();
    expect(b.write).toHaveBeenCalled();
    realtime.removeClient('u2', a);
    realtime.removeClient('u2', b);
  });

  it('marks a user offline after their last stream closes', () => {
    const a = stream();
    realtime.addClient('u3', a);
    expect(realtime.isOnline('u3')).toBe(true);
    realtime.removeClient('u3', a);
    expect(realtime.isOnline('u3')).toBe(false);
  });

  it('survives a dropped connection and still reaches the others', () => {
    const bad = { write: jest.fn(() => { throw new Error('closed'); }) };
    const good = stream();
    realtime.addClient('u4', bad);
    realtime.addClient('u4', good);
    expect(() => realtime.publish('u4', 'ping', {})).not.toThrow();
    expect(good.write).toHaveBeenCalled();
    realtime.removeClient('u4', bad);
    realtime.removeClient('u4', good);
  });

  it('ignores removing a stream that was never added', () => {
    expect(() => realtime.removeClient('ghost', stream())).not.toThrow();
  });
});
