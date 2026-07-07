/**
 * @file admin.routes.js
 * @module AdminRoutes
 * @description Admin-only routes for platform management: provider approvals, NIC verification, listing moderation, user management, category CRUD, disputes, and analytics. All routes require admin role. Mounted under /api/v1/admin/.
 * @dependencies express, ../controllers/admin.controller.js, ../middleware/auth.middleware.js, ../middleware/role.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
