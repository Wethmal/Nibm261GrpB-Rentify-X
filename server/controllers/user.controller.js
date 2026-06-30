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

    const updatedUser = await userModel.update(targetUserId, updateData);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found or no changes made' });
    }

    const { password_hash, ...safeUser } = updatedUser;
    res.status(200).json(safeUser);
  } catch (error) {
    next(error);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const user = await userModel.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Restricted users are hidden from public view (admins and the user themself can still load it)
    if (['banned', 'suspended'].includes(user.status) && !(req.user && (req.user.role === 'admin' || req.user.userId === targetUserId))) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine what to hide based on visibility_settings
    // If visibility_settings is null, use defaults (false)
    const visibility = user.visibility_settings || { mobile: false, address: false };

