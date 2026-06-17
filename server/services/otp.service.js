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

const generate = async (identifier) => {
  const existing = otpStore.get(identifier);
  if (existing && Date.now() - existing.lastSentAt < RESEND_COOLDOWN_MS) {
    throw new Error(`Please wait 60 seconds before resending.`);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const codeHash = await bcrypt.hash(code, 10);

  otpStore.set(identifier, {
    codeHash,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts: 0,
    lastSentAt: Date.now()
  });

  // Stub SMS dispatch
  console.log(`[SMS Stub] Sent OTP ${code} to ${identifier}`);
  return code;
};

const verify = async (identifier, code) => {
  const stored = otpStore.get(identifier);
  if (!stored) return { valid: false, message: 'No OTP found. Request a new one.' };

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, message: 'OTP expired. Request a new one.' };
  }

