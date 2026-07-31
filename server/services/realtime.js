/**
 * In-memory Server-Sent Events hub (US17/US18). One user can hold several open streams
 * (multiple tabs). Works for a single server instance; swap for Redis pub/sub to scale out.
 */
const clients = new Map(); // userId -> Set<res>

