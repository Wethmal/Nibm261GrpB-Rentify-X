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

    it('should return 400 if category_id does not exist', async () => {
      const fakeCategoryId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Test Service Title',
          description: 'This is a long description of at least twenty characters.',
          category_id: fakeCategoryId,
          price_per_unit: 1500,
          unit_label: 'per hour',
          district: 'Colombo'
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should successfully create listing with status defaults to pending_approval and returns 201 with listingId', async () => {
      const listingData = {
        title: 'Valid Service Listing',
        description: 'This is a long description of at least twenty characters long to pass validations.',
        category_id: categoryId,
        price_per_unit: 2500,
        unit_label: 'per session',
        district: 'Colombo',
        tags: ['tutoring', 'maths']
      };

      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(listingData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('listingId');
      expect(res.body.listingId).toBeDefined();
      expect(res.body).toHaveProperty('listing');
      expect(res.body.listing.title).toEqual(listingData.title);
      expect(res.body.listing.status).toEqual('pending_approval');
      expect(res.body.listing.provider_id).toEqual(providerId);

      // Verify in DB directly
      const dbListing = (await query('SELECT * FROM listings WHERE id = $1', [res.body.listingId])).rows[0];
      expect(dbListing).toBeDefined();
      expect(dbListing.status).toEqual('pending_approval');
      expect(dbListing.provider_id).toEqual(providerId);
      expect(dbListing.tags).toContain('tutoring');
      expect(dbListing.tags).toContain('maths');
    });
  });

  describe('POST /api/v1/listings/:id/photos', () => {
    let listingId;
    const mockImage = Buffer.from('fake-image-content');

    beforeAll(async () => {
      // Create a listing to use for these tests
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Photo Test Service',
          description: 'This is a long description of at least twenty characters long.',
          category_id: categoryId,
          price_per_unit: 1000,
          unit_label: 'per hour',
          district: 'Colombo'
        });
      listingId = res.body.listingId;
    });

    it('should require authentication (401)', async () => {
      const res = await request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .attach('photos', mockImage, 'test.jpg');
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if user is not the owner of the listing', async () => {
      const res = await request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .set('Authorization', `Bearer ${consumerToken}`)
        .attach('photos', mockImage, 'test.jpg');
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if listing does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request(app)
        .post(`/api/v1/listings/${fakeId}/photos`)
        .set('Authorization', `Bearer ${providerToken}`)
        .attach('photos', mockImage, 'test.jpg');
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 if no photos are attached', async () => {
      const res = await request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .set('Authorization', `Bearer ${providerToken}`);
      expect(res.statusCode).toEqual(400);
    });

    it('should return 422 if uploading more than 10 files', async () => {
      let req = request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .set('Authorization', `Bearer ${providerToken}`);

      for (let i = 0; i < 11; i++) {
        req = req.attach('photos', mockImage, `image_${i}.jpg`);
      }

      const res = await req;
      expect(res.statusCode).toEqual(422);
    });

    it('should return 400 if file MIME type is not allowed', async () => {
      const res = await request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .set('Authorization', `Bearer ${providerToken}`)
        .attach('photos', Buffer.from('some dummy text'), 'test.txt');
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 if file size is > 8MB', async () => {
      const largeBuffer = Buffer.alloc(9 * 1024 * 1024); // 9MB
      const res = await request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .set('Authorization', `Bearer ${providerToken}`)
        .attach('photos', largeBuffer, 'large.jpg');
      expect(res.statusCode).toEqual(400);
    });

    it('should successfully upload multiple photos and update the database atomically (200)', async () => {
      const res = await request(app)
        .post(`/api/v1/listings/${listingId}/photos`)
        .set('Authorization', `Bearer ${providerToken}`)
        .attach('photos', mockImage, 'img1.jpg')
        .attach('photos', mockImage, 'img2.png');

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('urls');
      expect(res.body.urls.length).toEqual(2);
      expect(res.body.urls[0]).toContain('/uploads/listings/');
      expect(res.body.urls[1]).toContain('/uploads/listings/');

      // Check database to ensure photos column was updated atomically
      const dbListing = (await query('SELECT * FROM listings WHERE id = $1', [listingId])).rows[0];
      expect(dbListing.photos).toBeDefined();
      expect(dbListing.photos.length).toEqual(2);
      expect(dbListing.photos[0]).toEqual(res.body.urls[0]);
      expect(dbListing.photos[1]).toEqual(res.body.urls[1]);
    });
  });

  describe('Admin Approval Notification Trigger on Listing Creation (US006-ST05)', () => {
    it('should trigger notifications for admin users asynchronously after listing creation', async () => {
      // 1. Check count of notifications for admin before creation
      const adminUsers = (await query("SELECT id FROM users WHERE role = 'admin'")).rows;
      expect(adminUsers.length).toBeGreaterThan(0);
      const adminId = adminUsers[0].id;

      const countResBefore = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND type = $2', [adminId, 'listing_pending_review']);
      const countBefore = parseInt(countResBefore.rows[0].count, 10);

      // 2. Create a new listing
      const listingData = {
        title: 'Notification Trigger Test Service',
        description: 'This is a long description of at least twenty characters long to pass validation checks.',
        category_id: categoryId,
        price_per_unit: 3000,
        unit_label: 'per session',
        district: 'Colombo',
        tags: ['test']
      };

      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(listingData);

      expect(res.statusCode).toEqual(201);
      const createdListingId = res.body.listingId;
      expect(createdListingId).toBeDefined();

      // 3. Wait slightly (e.g. 50ms) for the asynchronous setImmediate task to execute
      await new Promise(resolve => setTimeout(resolve, 50));

      // 4. Verify notification is created for the admin user
      const countResAfter = await query('SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND type = $2', [adminId, 'listing_pending_review']);
      const countAfter = parseInt(countResAfter.rows[0].count, 10);
      expect(countAfter).toEqual(countBefore + 1);

      // 5. Verify notification content and metadata links listingId
      const notification = (await query('SELECT * FROM notifications WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1', [adminId, 'listing_pending_review'])).rows[0];
      expect(notification).toBeDefined();
      expect(notification.metadata).toBeDefined();
      expect(notification.metadata.listingId).toEqual(createdListingId);
    });
  });

  describe('POST /api/v1/listings (Equipment Listings - US007-ST02)', () => {
    it('should reject equipment listing creation if quantity is invalid (< 1)', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Sony FX3 Cinema Camera',
          description: 'This is a long description of at least twenty characters long.',
          category_id: equipmentCategoryId,
          type: 'equipment',
          price_per_unit: 12000,
          unit_label: 'per day',
          district: 'Colombo',
          quantity: 0,
          condition: 'good'
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject equipment listing creation if condition is invalid', async () => {
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Sony FX3 Cinema Camera',
          description: 'This is a long description of at least twenty characters long.',
          category_id: equipmentCategoryId,
          type: 'equipment',
          price_per_unit: 12000,
          unit_label: 'per day',
          district: 'Colombo',
          quantity: 2,
          condition: 'damaged'
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should reject if category type does not match listing type', async () => {
      // Trying to use a service category with type=equipment
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Sony FX3 Cinema Camera',
          description: 'This is a long description of at least twenty characters long.',
          category_id: categoryId, // service category
          type: 'equipment',
          price_per_unit: 12000,
          unit_label: 'per day',
          district: 'Colombo',
          quantity: 2,
          condition: 'good'
        });
      expect(res.statusCode).toEqual(400);
    });

    it('should successfully create equipment listing, store details, and link availability calendar', async () => {
      const listingData = {
        title: 'Sony FX3 Cinema Camera',
        description: 'This is a long description of at least twenty characters long.',
        category_id: equipmentCategoryId,
        type: 'equipment',
        price_per_unit: 12000,
        unit_label: 'per day',
        district: 'Colombo',
        quantity: 3,
        condition: 'good'
      };

      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send(listingData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('listingId');

      const createdId = res.body.listingId;

      // Verify DB record
      const dbListing = (await query('SELECT * FROM listings WHERE id = $1', [createdId])).rows[0];
      expect(dbListing).toBeDefined();
      expect(dbListing.type).toEqual('equipment');
      expect(parseInt(dbListing.quantity_available, 10)).toEqual(3);
      expect(dbListing.condition).toEqual('good');
      expect(dbListing.status).toEqual('pending_approval');

      // Verify availability calendar is linked (has 30 entries)
      const availabilityRes = await query('SELECT COUNT(*) FROM listing_availability WHERE listing_id = $1', [createdId]);
      expect(parseInt(availabilityRes.rows[0].count, 10)).toEqual(30);
    });
  });
});
