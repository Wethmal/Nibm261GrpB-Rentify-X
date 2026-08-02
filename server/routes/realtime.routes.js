/**
 * @file realtime.routes.js
 * @description Server-Sent Events stream for live notifications and chat (US17/US18).
 * EventSource cannot send an Authorization header, so the JWT is accepted as ?token=.
 * Mounted at /api/v1/realtime.
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const realtime = require('../services/realtime');
const restriction = require('../services/restriction.service');
const { query } = require('../config/db');

router.get('/stream', async (req, res) => {
  let userId;
  try {
    const decoded = jwt.verify(String(req.query.token || ''), process.env.JWT_SECRET || 'secret');
    userId = decoded.userId || decoded.id;
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
  }
  const r = await restriction.checkRestriction(userId);
  if (r.restricted) return res.status(403).json({ error: 'Account restricted', message: 'Account suspended/banned' });

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n');
  res.write(`event: ready\ndata: ${JSON.stringify({ userId })}\n\n`);

  realtime.addClient(userId, res);
  // Anything sent while the user was offline is now considered delivered
  query('UPDATE messages SET delivered_at = NOW() WHERE recipient_id = $1 AND delivered_at IS NULL', [userId]).catch(() => {});

  const heartbeat = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) { /* closed */ } }, 25000);
  req.on('close', () => {
    clearInterval(heartbeat);
    realtime.removeClient(userId, res);
  });
});

