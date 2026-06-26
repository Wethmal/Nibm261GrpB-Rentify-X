/**
 * @file booking.controller.js
 * @module BookingController
 * @description Handles booking lifecycle: creation, retrieval, accept/reject, cancel, and completion. Validates availability, manages status transitions, and triggers notifications. Delegates to booking.model.js.
 * @dependencies ../models/booking.model.js, ../services/notification.service.js
 * @exports create, getAll, getById, accept, reject, cancel, complete
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const bookingModel = require('../models/booking.model');
const listingModel = require('../models/listing.model');
const notificationModel = require('../models/notification.model');
const { query } = require('../config/db');

