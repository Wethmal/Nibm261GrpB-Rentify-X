/**
 * @file auth.routes.js
 * @module AuthRoutes
 * @description Defines authentication API routes for Rentify: user registration, login, OTP verification, and password reset. All routes are mounted under /api/v1/auth/ by server.js. Delegates business logic to auth.controller.js.
 * @dependencies express, ../controllers/auth.controller.js, ../middleware/validate.middleware.js
 * @exports Express Router instance with auth routes
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authenticate = require('../middleware/auth.middleware');

// POST /api/v1/auth/register — Register a new user (consumer or provider)
router.post('/register', [
  body('mobile').matches(/^(?:\+94|0)7\d{8}$/).withMessage('Invalid Sri Lanka mobile number'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').custom(val => ['Consumer', 'Provider', 'consumer', 'provider'].includes(val)).withMessage('Role must be Consumer or Provider'),
  body('nic_number').optional().isString()
], validate, authController.register);

// POST /api/v1/auth/login — Authenticate user with email/mobile + password
router.post('/login', authController.login);

// POST /api/v1/auth/login/2fa/verify — Verify OTP and get full tokens
router.post('/login/2fa/verify', [
  body('preAuthToken').notEmpty().withMessage('Pre-auth token is required'),
  body('otpCode').isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
], validate, authController.verify2faLogin);

// PUT /api/v1/auth/2fa/toggle — Enable/disable 2FA for the account
router.put('/2fa/toggle', authenticate, [
  body('enabled').isBoolean().withMessage('enabled must be a boolean')
], validate, authController.toggle2fa);

// POST /api/v1/auth/refresh — Refresh access token using rotation
router.post('/refresh', authController.refresh);

// POST /api/v1/auth/otp/send — Generate and send OTP via SMS
