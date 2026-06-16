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

