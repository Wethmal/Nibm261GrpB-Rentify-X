/**
 * @file admin.test.js
 * @module AdminTests
 * @description Integration tests for admin endpoints (/api/v1/admin). Ensures that only users with the 'admin' role can access these routes (RBAC testing).
 * @dependencies supertest, app (server.js), jsonwebtoken
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

describe('Admin Endpoints RBAC', () => {
  it('should reject access without a token', async () => {
    const res = await request(app).get('/api/v1/admin/analytics');
    expect(res.statusCode).toEqual(401);
  });

