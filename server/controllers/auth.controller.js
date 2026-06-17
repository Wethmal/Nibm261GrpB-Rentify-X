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
const passwordResetTokenModel = require('../models/password_reset_token.model');

const getCookie = (req, name) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const parts = cookie.split('=');
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    if (key) {
      acc[key] = val;
    }
    return acc;
  }, {});
  return cookies[name] || null;
};

const register = async (req, res, next) => {
  try {
    const { mobile, email, password, role, nic_number, full_name } = req.body;

    const existingUser = await userModel.findByMobile(mobile);
    if (existingUser) {
      return res.status(409).json({ error: 'Mobile already registered' });
    }

    const password_hash = await authService.hashPassword(password);

    const newUser = await userModel.create({
      mobile,
      email,
      password_hash,
      role: role.toLowerCase(),
      nic_number: nic_number || null,
      status: 'pending_verification',
      full_name: full_name || null
    });

