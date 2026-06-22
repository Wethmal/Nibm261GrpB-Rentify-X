/**
 * @file upload.service.js
 * @module UploadService
 * @description File upload service handling Cloudinary operations: uploading images (NIC docs, listing photos, profile photos), deleting images, and generating optimized URLs. Abstracts Cloudinary SDK operations so controllers don't interact with Cloudinary directly. All file storage uses Cloudinary — no local filesystem storage.
 * @dependencies cloudinary
 * @exports uploadImage, deleteImage, getOptimizedUrl
 * @author Rentify Engineering Team
 * @version 1.0.0
 */
const cloudinary = require('cloudinary').v2;

// TODO: Uncomment once Cloudinary credentials are configured in .env
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
