const request = require('supertest');
const app = require('../server');
const { query } = require('../config/db');

describe('User Profile Integration Tests', () => {
  let user1Token;
  let user2Token;
  let adminToken;
  let user1Id;
  let user2Id;

  beforeAll(async () => {
    // Clear users
    await query('DELETE FROM users');

    // Create Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'admin@Rentify.lk', mobile: '0770000001', password: 'Password123', role: 'consumer' });

    // Manually force role to admin
    await query("UPDATE users SET role = 'admin', status = 'verified' WHERE email = 'admin@Rentify.lk'");

    const adminLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'admin@Rentify.lk', password: 'Password123' });
    adminToken = adminLogin.body.token;

    // Create User 1
    const user1Res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user1@Rentify.lk', mobile: '0770000002', password: 'Password123', role: 'consumer' });
    user1Id = user1Res.body.userId;
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [user1Id]);

    const user1Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'user1@Rentify.lk', password: 'Password123' });
    user1Token = user1Login.body.token;

    // Create User 2
    const user2Res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user2@Rentify.lk', mobile: '0770000003', password: 'Password123', role: 'provider' });
    user2Id = user2Res.body.userId;
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [user2Id]);

    const user2Login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'user2@Rentify.lk', password: 'Password123' });
    user2Token = user2Login.body.token;
  });

  afterAll(async () => {
    await query('DELETE FROM users');
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update own profile successfully (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          full_name: 'John Doe',
          bio: 'I am a consumer.',
          address: '123 Main St',
          mobile: '0771234567'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.full_name).toEqual('John Doe');
      expect(res.body.bio).toEqual('I am a consumer.');
      expect(res.body.address).toEqual('123 Main St');
      expect(res.body.mobile).toEqual('0771234567');
    });

    it('should reject editing another user without admin role (403)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${user2Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          full_name: 'Hacked Name'
        });

      expect(res.statusCode).toEqual(403);
    });

    it('should allow admin to edit another user profile (200)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bio: 'Admin changed this'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.bio).toEqual('Admin changed this');
    });

    it('should validate field lengths and formats (400)', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${user1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          full_name: 'J', // too short
          mobile: '123' // invalid SL format
        });

