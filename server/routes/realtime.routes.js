/**
 * @file realtime.routes.js
 * @description Server-Sent Events stream for live notifications and chat (US17/US18).
 * EventSource cannot send an Authorization header, so the JWT is accepted as ?token=.
 * Mounted at /api/v1/realtime.
 */
