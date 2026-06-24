/**
 * @file listing.test.js
 * @module ListingTests
 * @description Integration tests for listing endpoints (/api/v1/listings). Tests fetching, creating, updating, deleting listings and availability management. Mocks Cloudinary uploads.
 * @dependencies supertest, app (server.js)
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const request = require('supertest');
const app = require('../server');
const { query } = require('../config/db');

describe('Listing Endpoints', () => {
  let providerToken;
  let consumerToken;
  let providerId;
  let consumerId;
  let categoryId;
  let equipmentCategoryId;

  beforeAll(async () => {
    // Clear user, listing and category tables to avoid foreign key issues and ensure isolation
    await query('TRUNCATE TABLE listings, categories, users CASCADE');

    // Create a provider user
    const providerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'provider@Rentify.lk', mobile: '0770000010', password: 'Password123', role: 'provider' });
    providerId = providerRes.body.userId;
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [providerId]);

    const providerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'provider@Rentify.lk', password: 'Password123' });
    providerToken = providerLogin.body.token;

    // Create a consumer user
    const consumerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'consumer@Rentify.lk', mobile: '0770000011', password: 'Password123', role: 'consumer' });
    consumerId = consumerRes.body.userId;
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [consumerId]);

    const consumerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'consumer@Rentify.lk', password: 'Password123' });
    consumerToken = consumerLogin.body.token;

    // Create a test category
    const catRes = await query(
      "INSERT INTO categories (name, type) VALUES ('Test Service Category', 'service') RETURNING id"
    );
    categoryId = catRes.rows[0].id;

    // Create a test equipment category
    const equipCatRes = await query(
      "INSERT INTO categories (name, type) VALUES ('Test Equipment Category', 'equipment') RETURNING id"
    );
    equipmentCategoryId = equipCatRes.rows[0].id;

    // Create an admin user
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'admin@Rentify.lk', mobile: '0770000012', password: 'Password123', role: 'consumer' });
    const adminId = adminRes.body.userId;
    // Force role to admin and status to verified
    await query("UPDATE users SET role = 'admin', status = 'verified' WHERE id = $1", [adminId]);
  });

  afterAll(async () => {
    // Cleanup tables
    await query('TRUNCATE TABLE listings, categories, users CASCADE');
  });

  it('should return paginated listings', async () => {
    const res = await request(app).get('/api/v1/listings');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('results');
    expect(res.body).toHaveProperty('total');
  });

  it('should require authentication to create a listing', async () => {
    const res = await request(app).post('/api/v1/listings').send({
      title: 'Test Service',
      description: 'A test service',
      type: 'service'
    });
    // Should fail with 401 Unauthorized since no token is provided
    expect(res.statusCode).toEqual(401);
  });

  describe('POST /api/v1/listings', () => {
    it('should return 403 if user role is not provider', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          title: 'Test Service Title',
          description: 'This is a long description of at least twenty characters.',
          category_id: categoryId,
          price_per_unit: 1500,
          unit_label: 'per hour',
          district: 'Colombo'
        });
      expect(res.statusCode).toEqual(403);
    });

    it('should return 400 on missing required fields', async () => {
      // Missing title
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          description: 'This is a long description of at least twenty characters.',
          category_id: categoryId,
          price_per_unit: 1500,
          unit_label: 'per hour',
          district: 'Colombo'
        });
      expect(res.statusCode).toEqual(400);
    });

