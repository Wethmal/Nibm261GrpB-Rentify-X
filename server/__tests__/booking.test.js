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

