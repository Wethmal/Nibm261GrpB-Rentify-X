/**
 * @file payment.routes.js
 * @module PaymentRoutes
 * @description Payment processing routes including initiation, webhook handling, escrow management, and receipt retrieval. Integrates with payment gateway (PayHere/Stripe). Mounted under /api/v1/payments/.
 * @dependencies express, ../controllers/payment.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authenticate = require('../middleware/auth.middleware');

// POST /api/v1/payments/initiate — Initiate payment for a booking (consumer)
router.post('/initiate', authenticate, paymentController.initiate);

// POST /api/v1/payments/webhook — Payment gateway webhook (no auth — verified by gateway signature)
router.post('/webhook', paymentController.handleWebhook);

// POST /api/v1/payments/:id/release — Release escrowed funds to provider (admin or system)
router.post('/:id/release', authenticate, paymentController.releaseFunds);

// POST /api/v1/payments/:id/refund — Refund payment to consumer (admin)
router.post('/:id/refund', authenticate, paymentController.refund);

// GET /api/v1/payments/:id/receipt — Get payment receipt
router.get('/:id/receipt', authenticate, paymentController.getReceipt);

module.exports = router;
