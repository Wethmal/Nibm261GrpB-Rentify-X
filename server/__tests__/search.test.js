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

  afterAll(async () => {
    await query('TRUNCATE TABLE listings, categories, users CASCADE');
  });

  it('should return only active listings', async () => {
    const res = await request(app).get('/api/v1/search');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('results');
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toEqual(4); // Excludes pending approval listing

    const titles = res.body.results.map(l => l.title);
    expect(titles).toContain('Plumbing Master Pro');
    expect(titles).toContain('Sony FX3 Cinema Camera Kit');
    expect(titles).toContain('Elite House Cleaning');
    expect(titles).toContain('JBL PartyBox 310 Speaker');
    expect(titles).not.toContain('Pending Approval Service');
  });

  it('should filter search results by type', async () => {
    const res = await request(app).get('/api/v1/search').query({ type: 'equipment' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(2);
    const types = res.body.results.map(l => l.type);
    expect(types.every(t => t === 'equipment')).toBe(true);
  });

  it('should filter search results by category', async () => {
    const res = await request(app).get('/api/v1/search').query({ category_id: serviceCategoryId });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(2);
    const titles = res.body.results.map(l => l.title);
    expect(titles).toContain('Plumbing Master Pro');
    expect(titles).toContain('Elite House Cleaning');
  });

  it('should filter search results by district case-insensitively', async () => {
    const res = await request(app).get('/api/v1/search').query({ district: 'colombo' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(2);
    const districts = res.body.results.map(l => l.district);
    expect(districts.every(d => d.toLowerCase() === 'colombo')).toBe(true);
  });

  it('should filter search results by price range', async () => {
    const res = await request(app).get('/api/v1/search').query({ min_price: 5000, max_price: 10000 });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(2); // JBL Speaker (6000) and Elite Cleaning (8000)
    const prices = res.body.results.map(l => parseFloat(l.price_per_unit));
    expect(prices.every(p => p >= 5000 && p <= 10000)).toBe(true);
  });

  it('should filter search results by minimum rating', async () => {
    const res = await request(app).get('/api/v1/search').query({ min_rating: 4.5 });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(2); // Plumbing (4.8) and Sony FX3 (4.9)
    const ratings = res.body.results.map(l => parseFloat(l.average_rating));
    expect(ratings.every(r => r >= 4.5)).toBe(true);
  });

  it('should perform exact keyword matching', async () => {
    const res = await request(app).get('/api/v1/search').query({ q: 'leakages' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(1);
    expect(res.body.results[0].title).toEqual('Plumbing Master Pro');
  });

  it('should perform fuzzy keyword matching via pg_trgm', async () => {
    // Soni is a fuzzy match for Sony
    const res = await request(app).get('/api/v1/search').query({ q: 'Soni' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.total).toEqual(1);
    expect(res.body.results[0].title).toEqual('Sony FX3 Cinema Camera Kit');
  });

  it('should sort results correctly by price ascending', async () => {
    const res = await request(app).get('/api/v1/search').query({ sort_by: 'price_asc' });
    expect(res.statusCode).toEqual(200);
    const prices = res.body.results.map(l => parseFloat(l.price_per_unit));
    expect(prices).toEqual([1500, 6000, 8000, 12000]);
  });

  it('should sort results correctly by newest', async () => {
    const res = await request(app).get('/api/v1/search').query({ sort_by: 'newest' });
    expect(res.statusCode).toEqual(200);
    // Listing order by age (newest first): Listing 3, Listing 2, Listing 5, Listing 1
    const titles = res.body.results.map(l => l.title);
    expect(titles[0]).toEqual('Elite House Cleaning');
    expect(titles[1]).toEqual('Sony FX3 Cinema Camera Kit');
    expect(titles[2]).toEqual('JBL PartyBox 310 Speaker');
    expect(titles[3]).toEqual('Plumbing Master Pro');
  });

  it('should paginate results using limit and page', async () => {
    const res = await request(app).get('/api/v1/search').query({ limit: 2, page: 1, sort_by: 'price_asc' });
    expect(res.statusCode).toEqual(200);
    expect(res.body.results.length).toEqual(2);
    expect(res.body.total).toEqual(4);
    expect(res.body.page).toEqual(1);
    expect(res.body.limit).toEqual(2);
    expect(res.body.results[0].title).toEqual('Plumbing Master Pro');
    expect(res.body.results[1].title).toEqual('JBL PartyBox 310 Speaker');

    const page2Res = await request(app).get('/api/v1/search').query({ limit: 2, page: 2, sort_by: 'price_asc' });
    expect(page2Res.statusCode).toEqual(200);
    expect(page2Res.body.results.length).toEqual(2);
    expect(page2Res.body.page).toEqual(2);
    expect(page2Res.body.results[0].title).toEqual('Elite House Cleaning');
    expect(page2Res.body.results[1].title).toEqual('Sony FX3 Cinema Camera Kit');
  });
});
