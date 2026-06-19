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

    const token = authService.generateToken(
      { userId: newUser.id, role: newUser.role, status: newUser.status },
      { expiresIn: '15m' }
    );

    res.status(201).json({
      message: 'Registration successful. Verify OTP.',
      userId: newUser.id,
      token
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { identifier, email, mobile, password } = req.body;
    const loginId = identifier || email || mobile;

    if (!loginId || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    const user = await userModel.findByEmailOrMobile(loginId);
    if (!user) {
      return res.status(401).json({ error: 'Wrong password', message: 'Wrong password' });
    }

    if (user.status === 'suspended') {
      const chk = await require('../services/restriction.service').checkRestriction(user.id);
      if (!chk.restricted) user.status = 'verified';
    }
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ error: 'Account suspended/banned', message: user.status_reason ? `Account suspended/banned: ${user.status_reason}` : 'Account suspended/banned', code: 'ACCOUNT_RESTRICTED', until: user.suspended_until || null });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({
        error: 'Account locked',
        message: 'Account locked due to multiple failed login attempts.',
        status: 'suspended temporarily',
        unlock_at: user.locked_until
      });
    }

    const isMatch = await authService.comparePassword(password, user.password_hash);
    if (!isMatch) {
      const lockoutInfo = await userModel.incrementFailedAttempts(user.id);
      if (lockoutInfo && lockoutInfo.failed_attempts >= 3) {
        return res.status(423).json({
          error: 'Account locked',
          message: 'Account locked due to multiple failed login attempts.',
          status: 'suspended temporarily',
          unlock_at: lockoutInfo.locked_until
        });
      }
      return res.status(401).json({ error: 'Wrong password', message: 'Wrong password' });
    }

    await userModel.resetFailedAttempts(user.id);

    if (user.is_2fa_enabled) {
      const preAuthToken = authService.generateToken(
        { userId: user.id, isPreAuth: true },
        { expiresIn: '10m' }
      );
      const code = await otpService.generate(user.mobile);
      return res.status(200).json({
        requires2fa: true,
        preAuthToken,
        message: 'OTP sent to your registered mobile number',
        devCode: process.env.NODE_ENV !== 'production' ? code : undefined
      });
    }

    const token = authService.generateToken(
      { userId: user.id, role: user.role, status: user.status },
      { expiresIn: '24h' }
    );

    const refreshTokenString = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await refreshModel.create(user.id, refreshTokenString, expiresAt);

    res.cookie('refreshToken', refreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        name: user.full_name,
        mobile: user.mobile,
        profile_photo_url: user.profile_photo_url
      }
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshTokenString = getCookie(req, 'refreshToken');
    if (!refreshTokenString) {
      return res.status(401).json({ error: 'Refresh token is missing', message: 'Refresh token is missing' });
    }

    const tokenDoc = await refreshModel.findByToken(refreshTokenString);
    if (!tokenDoc) {
      return res.status(401).json({ error: 'Invalid refresh token', message: 'Invalid refresh token' });
    }

    if (tokenDoc.is_revoked || new Date(tokenDoc.expires_at) < new Date()) {
      if (!tokenDoc.is_revoked) {
        await refreshModel.revoke(refreshTokenString);
      } else {
        await refreshModel.revokeAllForUser(tokenDoc.user_id);
      }
      return res.status(401).json({ error: 'Expired or invalid refresh token', message: 'Expired or invalid refresh token' });
    }

    await refreshModel.revoke(refreshTokenString);

    const user = await userModel.findById(tokenDoc.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found', message: 'User not found' });
    }

    if (user.status === 'suspended') {
      const chk = await require('../services/restriction.service').checkRestriction(user.id);
      if (!chk.restricted) user.status = 'verified';
    }
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({ error: 'Account suspended/banned', message: user.status_reason ? `Account suspended/banned: ${user.status_reason}` : 'Account suspended/banned', code: 'ACCOUNT_RESTRICTED', until: user.suspended_until || null });
    }

    const newAccessToken = authService.generateToken(
      { userId: user.id, role: user.role, status: user.status },
      { expiresIn: '24h' }
    );

    const newRefreshTokenString = crypto.randomBytes(40).toString('hex');
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    await refreshModel.create(user.id, newRefreshTokenString, newExpiresAt);

