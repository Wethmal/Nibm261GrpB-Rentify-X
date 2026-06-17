/**
 * @file upload.middleware.js
 * @module UploadMiddleware
 *
 * @description
 * File upload middleware using Multer with Cloudinary storage. Configures Multer to
 * upload files directly to Cloudinary using multer-storage-cloudinary. Supports NIC
 * document uploads and listing photo uploads with file type validation (images only),
 * size limits from environment variables, and organized folder structure on Cloudinary.
 * Exports pre-configured upload handlers for single and multiple file uploads.
 *
 * @dependencies
 * - multer: Multipart form-data handling
 * - cloudinary: Cloudinary SDK for cloud storage
 * - multer-storage-cloudinary: Cloudinary storage engine for Multer
 *
 * @exports
 * - uploadSingle: Multer middleware for single file upload (NIC documents)
 * - uploadMultiple: Multer middleware for multiple file uploads (listing photos, max 5)
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

