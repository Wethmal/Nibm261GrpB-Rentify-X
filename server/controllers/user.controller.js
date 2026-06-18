/**
 * @file user.controller.js
 * @module UserController
 * @description Handles user profile operations: get own profile, update profile (including Cloudinary photo upload), get public profile, and booking history. Delegates database operations to user.model.js.
 * @dependencies ../models/user.model.js, ../services/upload.service.js
 * @exports getProfile, updateProfile, getPublicProfile, getBookingHistory
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const userModel = require('../models/user.model');
const sharp = require('sharp');
const path = require('path');
