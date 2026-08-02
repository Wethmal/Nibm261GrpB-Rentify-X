/**
 * In-memory Server-Sent Events hub (US17/US18). One user can hold several open streams
 * (multiple tabs). Works for a single server instance; swap for Redis pub/sub to scale out.
 */
const clients = new Map(); // userId -> Set<res>

const addClient = (userId, res) => {
  if (!clients.has(userId)) clients.set(userId, new Set());
  clients.get(userId).add(res);
};

const removeClient = (userId, res) => {
  const set = clients.get(userId);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) clients.delete(userId);
};

const isOnline = (userId) => clients.has(userId);

/** Push an event to every open stream of a user. Returns true if at least one stream received it. */
const publish = (userId, event, data) => {
  const set = clients.get(userId);
  if (!set || set.size === 0) return false;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of set) {
    try { res.write(payload); } catch (_) { /* dropped connection is cleaned up on close */ }
  }
  return true;
};

module.exports = { addClient, removeClient, publish, isOnline };
