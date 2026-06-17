/**
 * @file auth.controller.js
 * @module AuthController
 * @description Handles authentication request processing: registration (with NIC upload to Cloudinary), login (with optional 2FA), OTP verification, and password reset. Delegates cryptographic operations to auth.service.js and OTP management to otp.service.js. Each handler validates input, calls the service layer, and returns a formatted JSON response.
 * @dependencies ../services/auth.service.js, ../services/otp.service.js, ../models/user.model.js
 * @exports register, login, verifyOtp, requestPasswordReset, resetPassword
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const authService = require('../services/auth.service');
const userModel = require('../models/user.model');
const otpService = require('../services/otp.service');
const crypto = require('crypto');
const refreshModel = require('../models/refresh_token.model');
const notificationService = require('../services/notification.service');
