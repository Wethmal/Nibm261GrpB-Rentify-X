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

    res.cookie('refreshToken', newRefreshTokenString, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ token: newAccessToken });
  } catch (error) {
    next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { mobile } = req.body;
    const code = await otpService.generate(mobile);
    res.status(200).json({
      message: 'OTP sent successfully',
      devCode: process.env.NODE_ENV !== 'production' ? code : undefined
    });
  } catch (error) {
    if (error.message.includes('Please wait')) {
      return res.status(429).json({ error: error.message });
    }
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { mobile, otpCode } = req.body;
    const verification = await otpService.verify(mobile, String(otpCode));

    if (!verification.valid) {
      return res.status(400).json({ error: verification.message });
    }

    const user = await userModel.findByMobile(mobile);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'pending_verification') {
      await userModel.updateStatus(user.id, 'verified');
      user.status = 'verified';
    }

    const token = authService.generateToken({ userId: user.id, role: user.role, status: user.status });

    res.status(200).json({
      message: 'OTP verified successfully',
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

const requestPasswordReset = async (req, res, next) => {
  try {
    const { email, mobile } = req.body;
    const identifier = email || mobile;
    if (!identifier) {
      return res.status(400).json({ error: 'Email or mobile is required' });
    }

    const user = await userModel.findByEmailOrMobile(identifier);
    if (!user) {
      // Prevent enumeration: return 200 even if user doesn't exist
      return res.status(200).json({ message: 'If an account with that identifier exists, a reset link has been sent.' });
    }

    // Generate secure 64-char hex token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 1-hour expiry
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await passwordResetTokenModel.create(user.id, tokenHash, expiresAt);

    // Send email
    const resetUrl = `https://${req.headers.host || 'localhost'}/reset-password?token=${resetToken}`;
    const emailBody = `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link will expire in 1 hour.</p>`;

    if (user.email) {
      await notificationService.sendEmail(user.email, 'Password Reset Request', emailBody);
    }

    res.status(200).json({ message: 'If an account with that identifier exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenDoc = await passwordResetTokenModel.findByHash(tokenHash);

    if (!tokenDoc || tokenDoc.is_used || new Date(tokenDoc.expires_at) < new Date()) {
      return res.status(410).json({ error: 'Reset token is invalid or has expired' });
    }

    const newPasswordHash = await authService.hashPassword(newPassword);
    await userModel.updatePassword(tokenDoc.user_id, newPasswordHash);

    await passwordResetTokenModel.markAsUsed(tokenDoc.id);
    await refreshModel.revokeAllForUser(tokenDoc.user_id);

    const user = await userModel.findById(tokenDoc.user_id);
    if (user && user.email) {
      await notificationService.sendEmail(user.email, 'Password Reset Successful', '<p>Your password has been successfully reset.</p>');
    }

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    next(error);
  }
};

const verify2faLogin = async (req, res, next) => {
  try {
    const { preAuthToken, otpCode } = req.body;
    let decoded;
    try {
      decoded = authService.verifyToken(preAuthToken);
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired pre-auth token' });
    }

