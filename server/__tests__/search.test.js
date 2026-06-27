/**
 * @file search.test.js
 * @module SearchTests
 * @description Integration tests for search endpoints (/api/v1/search). Tests active listing status, filters, sorting, fuzzy pg_trgm matches, and pagination.
 */
const request = require('supertest');
const app = require('../server');
const { query } = require('../config/db');

describe('Search & Discovery Endpoints', () => {
  let providerId;
  let serviceCategoryId;
  let equipmentCategoryId;

  beforeAll(async () => {
    // Clean tables for isolated state
    await query('TRUNCATE TABLE listings, categories, users CASCADE');

    // Create verified provider
    const providerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'provider.search@Rentify.lk', mobile: '0779998888', password: 'Password123', role: 'provider' });
    providerId = providerRes.body.userId;
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [providerId]);

    // Create categories
    const serviceCat = await query(
      "INSERT INTO categories (name, type) VALUES ('Search Service Category', 'service') RETURNING id"
    );
    serviceCategoryId = serviceCat.rows[0].id;

    const equipCat = await query(
      "INSERT INTO categories (name, type) VALUES ('Search Equipment Category', 'equipment') RETURNING id"
    );
    equipmentCategoryId = equipCat.rows[0].id;

    // Seed mock listings with different statuses, fields, and dates
    // Listing 1: Active, Service, Colombo, Price: 1500, Rating: 4.8
    await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district, average_rating, created_at)
      VALUES ($1, $2, 'Plumbing Master Pro', 'Fix leakages, pipe blockages, emergency leaks', 'service', 'active', 1500, 'hour', 'Colombo', 4.8, NOW() - INTERVAL '4 days')
    `, [providerId, serviceCategoryId]);

    // Listing 2: Active, Equipment, Kandy, Price: 12000, Rating: 4.9, Title: Sony FX3 Cinema Camera Kit
    await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district, average_rating, created_at)
      VALUES ($1, $2, 'Sony FX3 Cinema Camera Kit', 'Lens 24-70 f2.8, cinema rentals and gear', 'equipment', 'active', 12000, 'day', 'Kandy', 4.9, NOW() - INTERVAL '2 days')
    `, [providerId, equipmentCategoryId]);

    // Listing 3: Active, Service, Colombo, Price: 8000, Rating: 4.2
    await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district, average_rating, created_at)
      VALUES ($1, $2, 'Elite House Cleaning', 'Vacuuming and dusting professional service', 'service', 'active', 8000, 'session', 'Colombo', 4.2, NOW() - INTERVAL '1 day')
    `, [providerId, serviceCategoryId]);

    // Listing 4: Pending Approval (Should be excluded)
    await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district, average_rating, created_at)
      VALUES ($1, $2, 'Pending Approval Service', 'Should not show up in results', 'service', 'pending_approval', 3000, 'hour', 'Colombo', 4.5, NOW())
    `, [providerId, serviceCategoryId]);

    // Listing 5: Active, Equipment, Galle, Price: 6000, Rating: 3.5
    await query(`
      INSERT INTO listings (provider_id, category_id, title, description, type, status, price_per_unit, unit_label, district, average_rating, created_at)
      VALUES ($1, $2, 'JBL PartyBox 310 Speaker', 'Portable Bluetooth speaker rental with rich bass', 'equipment', 'active', 6000, 'day', 'Galle', 3.5, NOW() - INTERVAL '3 days')
    `, [providerId, equipmentCategoryId]);
  });

