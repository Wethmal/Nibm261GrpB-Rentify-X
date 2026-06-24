/**
 * @file listing.controller.js
 * @module ListingController
 * @description Handles listing CRUD operations and availability management. Providers create/update/delete listings (with Cloudinary photo uploads). Public users can view active listings. Delegates database operations to listing.model.js.
 * @dependencies ../models/listing.model.js, ../services/upload.service.js
 * @exports getAll, getById, create, update, remove, getAvailability, updateAvailability
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const listingModel = require('../models/listing.model');
const categoryModel = require('../models/category.model');

const DISTRICT_COORDINATES = {
  Colombo: { lat: 6.9271, lng: 79.8612 },
  Gampaha: { lat: 7.0840, lng: 80.0098 },
  Kalutara: { lat: 6.5854, lng: 79.9607 },
  Kandy: { lat: 7.2906, lng: 80.6337 },
  Matale: { lat: 7.4675, lng: 80.6234 },
  'Nuwara Eliya': { lat: 6.9497, lng: 80.7891 },
  Galle: { lat: 6.0535, lng: 80.2210 },
  Matara: { lat: 5.9549, lng: 80.5550 },
  Hambantota: { lat: 6.1429, lng: 81.1212 },
  Jaffna: { lat: 9.6615, lng: 80.0255 },
  Kilinochchi: { lat: 9.3803, lng: 80.3770 },
  Mannar: { lat: 8.9810, lng: 79.9044 },
  Vavuniya: { lat: 8.7542, lng: 80.4982 },
  Mullaitivu: { lat: 9.2671, lng: 80.8142 },
  Batticaloa: { lat: 7.7310, lng: 81.6747 },
  Ampara: { lat: 7.2912, lng: 81.6724 },
  Trincomalee: { lat: 8.5874, lng: 81.2152 },
  Kurunegala: { lat: 7.4863, lng: 80.3647 },
  Puttalam: { lat: 8.0362, lng: 79.8283 },
  Anuradhapura: { lat: 8.3114, lng: 80.4037 },
  Polonnaruwa: { lat: 7.9403, lng: 81.0188 },
  Badulla: { lat: 6.9934, lng: 81.0550 },
  Moneragala: { lat: 6.8728, lng: 81.3507 },
  Ratnapura: { lat: 6.6828, lng: 80.3992 },
  Kegalle: { lat: 7.2513, lng: 80.3464 }
};
const userModel = require('../models/user.model');
const notificationModel = require('../models/notification.model');

const getAll = async (req, res, next) => {
  try {
    const provider_id = req.query.provider_id || '';
    const category_id = req.query.category_id || req.query.category || '';
    const type = req.query.type || '';
    const status = req.query.status || 'active';

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const offset = (page - 1) * limit;

    const filters = { provider_id, category_id, type, status };
    const pagination = { limit, offset };

    const { results, total } = await listingModel.findAll(filters, pagination);

    res.status(200).json({
      results,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const listing = await listingModel.findById(id);
    if (!listing) {
      return res.status(404).json({ error: 'Not Found', message: 'Listing not found' });
    }

    const reviewModel = require('../models/review.model');
    const reviews = await reviewModel.findByListing(id);
    listing.reviews = reviews || [];

    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category_id,
      type = 'service',
      price_per_unit,
      unit_label,
      district,
      tags,
      quantity,
      condition,
      specifications,
      geo_lat,
      geo_lng
    } = req.body;

    let finalLat = geo_lat;
    let finalLng = geo_lng;
    if (district && (!finalLat || !finalLng)) {
      const coords = DISTRICT_COORDINATES[district];
      if (coords) {
        finalLat = finalLat || coords.lat;
        finalLng = finalLng || coords.lng;
      }
    }

    // Returns 400 on missing required fields
    if (!title || !description || !category_id || !price_per_unit || !unit_label || !district) {
      return res.status(400).json({ error: 'Bad Request', message: 'Missing required fields' });
    }

    // Returns 403 if user role is not provider
    if (req.user.role !== 'provider') {
      return res.status(403).json({ error: 'Forbidden', message: 'Only providers can create listings' });
    }

    // provider_id set from JWT (req.user.userId)
    const provider_id = req.user.userId;

