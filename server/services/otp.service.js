/**
 * @file otp.service.js
 * @module OTPService
 * @description OTP (One-Time Password) generation, storage, verification, and resend logic. Generates 6-digit numeric codes with configurable expiry (default 10 minutes). OTPs can be stored in Redis or a database table — this stub uses an in-memory Map for development. Production should use Redis for distributed OTP storage.
 * @dependencies None (pure logic; storage mechanism is pluggable)
 * @exports generate, verify, resend
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const bcrypt = require('bcryptjs');

const otpStore = new Map();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 3;

