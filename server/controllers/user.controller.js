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

    // Only return public fields or fields explicitly set to public
    const publicData = {
      id: user.id,
      full_name: user.full_name,
      bio: user.bio,
      profile_photo_url: user.profile_photo_url,
      trust_score: user.trust_score,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      district: user.district,
      country: user.country
    };

    const isOwner = req.user && req.user.userId === targetUserId;
    const isAdmin = req.user && req.user.role === 'admin';
    const canSeePrivate = isOwner || isAdmin;

    if (visibility.mobile || canSeePrivate) publicData.mobile = user.mobile;
    if (visibility.address || canSeePrivate) publicData.address = user.address;

    res.status(200).json(publicData);
  } catch (error) {
    next(error);
  }
};

const uploadAvatar = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const requestUserId = req.user.userId;
    const requestUserRole = req.user.role;

    if (targetUserId !== requestUserId && requestUserRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'You are not allowed to update this avatar' });
    }

    if (req.fileValidationError) {
      return res.status(415).json({ error: { message: req.fileValidationError } });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `avatar_${targetUserId}_${Date.now()}.webp`;
    const uploadsDir = path.join(__dirname, '..', 'public', 'uploads', 'avatars');

    await fs.mkdir(uploadsDir, { recursive: true });

    const filePath = path.join(uploadsDir, fileName);

