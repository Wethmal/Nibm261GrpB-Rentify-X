/**
 * @file admin.test.js
 * @module AdminTests
 * @description Integration tests for admin endpoints (/api/v1/admin). Ensures that only users with the 'admin' role can access these routes (RBAC testing).
 * @dependencies supertest, app (server.js), jsonwebtoken
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const request = require('supertest');
