/**
 * @file booking.test.js
 * @module BookingTests
 * @description Integration tests for booking endpoints (/api/v1/bookings) and availability checks.
 * @dependencies supertest, app (server.js), ../config/db.js, ../services/availability.service.js
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const request = require('supertest');
const app = require('../server');
const { query } = require('../config/db');
const availabilityService = require('../services/availability.service');

describe('Booking Endpoints & Availability Service', () => {
  let providerToken;
  let consumerToken;
  let providerId;
  let consumerId;
  let activeListingId;
  let inactiveListingId;
  let equipmentListingId;
  let categoryId;
  let equipmentCategoryId;

  beforeAll(async () => {
    // Clear user, listing, categories, bookings, and notifications tables to isolate tests
    await query('TRUNCATE TABLE bookings, notifications, listing_availability, listings, categories, users CASCADE');

    // Create provider
    const providerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'provider.booking@Rentify.lk', mobile: '0771000020', password: 'Password123', role: 'provider' });
    providerId = providerRes.body.userId;
    await query("UPDATE users SET full_name = 'Test Provider', status = 'verified' WHERE id = $1", [providerId]);

    const providerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'provider.booking@Rentify.lk', password: 'Password123' });
    providerToken = providerLogin.body.token;

    // Create consumer
    const consumerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'consumer.booking@Rentify.lk', mobile: '0771000021', password: 'Password123', role: 'consumer' });
    consumerId = consumerRes.body.userId;
    await query("UPDATE users SET full_name = 'Consumer Booking', status = 'verified' WHERE id = $1", [consumerId]);

    const consumerLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'consumer.booking@Rentify.lk', password: 'Password123' });
    consumerToken = consumerLogin.body.token;

    // Create categories
    const catRes = await query(
      "INSERT INTO categories (name, type) VALUES ('Booking Test Service Category', 'service') RETURNING id"
    );
    categoryId = catRes.rows[0].id;

    const equipCatRes = await query(
      "INSERT INTO categories (name, type) VALUES ('Booking Test Equip Category', 'equipment') RETURNING id"
    );
    equipmentCategoryId = equipCatRes.rows[0].id;

    // Create active service listing
    const activeListRes = await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district)
      VALUES ($1, $2, 'Active AC Repair', 'Need AC Repair service', 'service', 'active', 2000, 'hour', 'Colombo')
      RETURNING id
    `, [providerId, categoryId]);
    activeListingId = activeListRes.rows[0].id;

    // Create inactive service listing
    const inactiveListRes = await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district)
      VALUES ($1, $2, 'Pending AC Repair', 'Need AC Repair service', 'service', 'pending_approval', 2000, 'hour', 'Colombo')
      RETURNING id
    `, [providerId, categoryId]);
    inactiveListingId = inactiveListRes.rows[0].id;

    // Create active equipment listing
    const equipListRes = await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district)
      VALUES ($1, $2, 'Camera Tripod', 'Heavy duty camera tripod', 'equipment', 'active', 1000, 'day', 'Colombo')
      RETURNING id
    `, [providerId, equipmentCategoryId]);
    equipmentListingId = equipListRes.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup tables
    await query('TRUNCATE TABLE bookings, notifications, listing_availability, listings, categories, users CASCADE');
  });

  it('should require authentication to fetch bookings', async () => {
    const res = await request(app).get('/api/v1/bookings');
    expect(res.statusCode).toEqual(401);
  });

  describe('POST /api/v1/bookings', () => {
    it('should require authentication to create a booking request', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .send({
          listing_id: activeListingId,
          scheduled_date: '2026-07-01',
          scheduled_time: '10:00',
          duration: 2
        });
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 Forbidden if the requester is not a consumer', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          listing_id: activeListingId,
          scheduled_date: '2026-07-01',
          scheduled_time: '10:00',
          duration: 2
        });
      expect(res.statusCode).toEqual(403);
      expect(res.body.error).toEqual('Forbidden');
    });

    it('should return 400 Bad Request if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          listing_id: activeListingId,
          scheduled_date: '2026-07-01'
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toEqual('Bad Request');
    });

    it('should return 404 Not Found if listing does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          listing_id: nonExistentId,
          scheduled_date: '2026-07-01',
          scheduled_time: '10:00',
          duration: 2
        });
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Not Found');
    });

    it('should return 404 Not Found if listing is inactive', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          listing_id: inactiveListingId,
          scheduled_date: '2026-07-01',
          scheduled_time: '10:00',
          duration: 2
        });
      expect(res.statusCode).toEqual(404);
      expect(res.body.error).toEqual('Not Found');
    });

    it('should successfully create a pending booking request and notify the provider asynchronously', async () => {
      const res = await request(app)
        .post('/api/v1/bookings')
        .set('Authorization', `Bearer ${consumerToken}`)
        .send({
          listing_id: activeListingId,
          scheduled_date: '2026-07-01',
          scheduled_time: '10:00',
          duration: 2,
          notes: 'Please bring testing equipment'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('bookingId');
      expect(res.body.booking.status).toEqual('pending');
      expect(res.body.booking.consumer_id).toEqual(consumerId);
      expect(res.body.booking.provider_id).toEqual(providerId);

      // Wait a moment to ensure async setImmediate fires
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify notification created for provider
      const notifications = await query(
        'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
        [providerId]
      );
      expect(notifications.rows.length).toEqual(1);
      expect(notifications.rows[0].type).toEqual('new_booking_request');
      expect(notifications.rows[0].metadata.bookingId).toEqual(res.body.bookingId);
      expect(notifications.rows[0].metadata.consumerName).toEqual('Consumer Booking');
      expect(notifications.rows[0].metadata.scheduledDate).toEqual('2026-07-01');
    });

    it('should successfully create a bundle booking with correct combined price (US13)', async () => {
      // Assuming activeListingId is a service and equipmentListingId is an equipment
      // Since we don't know the exact prices in the test suite setup, we can fetch them first
      const dbRes = await query('SELECT id, price_per_unit, type FROM listings WHERE id IN ($1, $2)', [activeListingId, equipmentListingId]);

