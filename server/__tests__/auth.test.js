/**
 * @file auth.test.js
 * @module AuthTests
 * @description Integration tests for authentication endpoints (/api/v1/auth). Verifies registration, login, OTP handling, and password reset flows using Supertest and an isolated test database.
 * @dependencies supertest, app (server.js)
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

describe('Authentication & Authorization Integration Tests', () => {
  beforeAll(async () => {
    // Clear users and refresh tokens to ensure a clean state
    await query('TRUNCATE TABLE users CASCADE');
  });

  afterAll(async () => {
    // Clear users after testing
    await query('TRUNCATE TABLE users CASCADE');
  });

  const testUser = {
    email: 'test@Rentify.lk',
    mobile: '0771234567',
    password: 'Password123',
    role: 'consumer'
  };

  let userId;
  let accessToken;
  let refreshTokenCookie;

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('userId');
      expect(res.body).toHaveProperty('token');
      userId = res.body.userId;
    });

    it('should return 409 Conflict if mobile is already registered', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'another@Rentify.lk',
          mobile: testUser.mobile,
          password: 'Password123',
          role: 'provider'
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body).toHaveProperty('error', 'Mobile already registered');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials and return JWT + httpOnly Cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id', userId);
      expect(res.body.user).toHaveProperty('role', 'consumer');

      accessToken = res.body.token;

      // Extract set-cookie header
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const hasRefreshToken = cookies.some(cookie => cookie.includes('refreshToken='));
      expect(hasRefreshToken).toBe(true);

      refreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='));
    });

    it('should reject login with wrong password (401)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          identifier: testUser.email,
          password: 'wrongpassword'
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error', 'Wrong password');
    });

    it('should lock the account temporarily after 3 failed login attempts (423)', async () => {
      // Create a specific user to test lockout to avoid locking out the main test user
      const lockoutUser = {
        email: 'lockout@Rentify.lk',
        mobile: '0779999999',
        password: 'Password123',
        role: 'consumer'
      };

      // Register the lockout user
      const regRes = await request(app)
        .post('/api/v1/auth/register')
        .send(lockoutUser);
      expect(regRes.statusCode).toEqual(201);

      // Verify and set status to verified
      await query("UPDATE users SET status = 'verified' WHERE id = $1", [regRes.body.userId]);

      // 1st failed attempt
      let res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: lockoutUser.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);

      // 2nd failed attempt
      res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: lockoutUser.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);

      // 3rd failed attempt -> lock out
      res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: lockoutUser.email, password: 'wrongpassword' });
      expect(res.statusCode).toEqual(423);
      expect(res.body).toHaveProperty('status', 'suspended temporarily');
      expect(res.body).toHaveProperty('unlock_at');

      // Subsequent attempt with CORRECT password should still return 423
      res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: lockoutUser.email, password: lockoutUser.password });
      expect(res.statusCode).toEqual(423);
    });
  });

  describe('2FA Login Flow', () => {
    let preAuthToken;

    it('should toggle 2FA on for user', async () => {
      const res = await request(app)
        .put('/api/v1/auth/2fa/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enabled: true });

      expect(res.statusCode).toEqual(200);
      expect(res.body.is_2fa_enabled).toBe(true);
    });

    it('should require 2FA during login when enabled', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier: testUser.email, password: testUser.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('requires2fa', true);
      expect(res.body).toHaveProperty('preAuthToken');
      preAuthToken = res.body.preAuthToken;
    });

    it('should verify 2FA login with correct OTP', async () => {
      const otpService = require('../services/otp.service');
      const verifySpy = jest.spyOn(otpService, 'verify').mockResolvedValue({ valid: true });

      const res = await request(app)
        .post('/api/v1/auth/login/2fa/verify')
        .send({ preAuthToken, otpCode: '123456' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('id');

      verifySpy.mockRestore();
    });

    it('should disable 2FA for user', async () => {
      const res = await request(app)
        .put('/api/v1/auth/2fa/toggle')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ enabled: false });

      expect(res.statusCode).toEqual(200);
      expect(res.body.is_2fa_enabled).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should issue a new access token and rotate refresh token cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', [refreshTokenCookie]);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.token).not.toEqual(accessToken);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const newRefreshTokenCookie = cookies.find(cookie => cookie.includes('refreshToken='));
      expect(newRefreshTokenCookie).toBeDefined();
      expect(newRefreshTokenCookie).not.toEqual(refreshTokenCookie);

      // Save the new cookie for potential reuse checks
      refreshTokenCookie = newRefreshTokenCookie;
    });

    it('should reject refresh request if cookie is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('POST /api/v1/auth/forgot-password should return 200 for existing user and generate token in DB', async () => {
      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: testUser.email });

