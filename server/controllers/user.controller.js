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
const fs = require('fs').promises;

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password_hash, ...safeUser } = user;
    res.status(200).json(safeUser);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const requestUserId = req.user.userId;
    const requestUserRole = req.user.role;

    if (targetUserId !== requestUserId && requestUserRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not allowed to edit this profile' });
    }

    const { full_name, bio, address, district, country, mobile, visibility_settings } = req.body;

    // Explicitly prevent role and status from being updated via this endpoint, even if passed
    const updateData = { full_name, bio, address, district, country, mobile, visibility_settings };

    // Remove undefined values
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

