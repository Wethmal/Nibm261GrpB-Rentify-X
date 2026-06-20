/**
 * @file booking.routes.js
 * @module BookingRoutes
 * @description Booking management routes. Consumers create booking requests, providers accept/reject them. Status transitions are tracked. Mounted under /api/v1/bookings/.
 * @dependencies express, ../controllers/booking.controller.js, ../middleware/auth.middleware.js
 * @exports Express Router instance
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const express = require('express');
