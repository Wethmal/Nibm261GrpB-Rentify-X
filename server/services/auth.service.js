/**
 * @file auth.service.js
 * @module AuthService
 * @description Core authentication service providing password hashing (bcrypt), password comparison, and JWT token generation/verification. Used by auth.controller.js for all cryptographic operations. Centralizes security-sensitive logic to ensure consistent implementation.
 * @dependencies bcryptjs, jsonwebtoken
 * @exports hashPassword, comparePassword, generateToken, verifyToken
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;

const hashPassword = async (plainPassword) => {
  // TODO: Validate password is not empty/null before hashing
  // TODO: Use bcrypt.hash with SALT_ROUNDS for adaptive hashing
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  // TODO: Use bcrypt.compare to safely check password match
  return bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = (payload, options = {}) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: options.expiresIn || process.env.JWT_EXPIRES_IN || '7d',
  });
};

const verifyToken = (token) => {
  // TODO: Verify and decode token, throw error if invalid/expired
  return jwt.verify(token, process.env.JWT_SECRET);
};

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
