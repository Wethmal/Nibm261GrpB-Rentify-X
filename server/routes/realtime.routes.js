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

