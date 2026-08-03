/**
 * Cancellation policies, refund preview and cancellation flows (US26).
 */
const { query } = require('../config/db');
const bookingModel = require('../models/booking.model');
const notificationModel = require('../models/notification.model');
const paymentService = require('../services/payment.service');
const payoutService = require('../services/payout.service');
const { PRESETS, POLICY_TYPES, calculateRefund, describePolicy } = require('../config/cancellationPolicies');

