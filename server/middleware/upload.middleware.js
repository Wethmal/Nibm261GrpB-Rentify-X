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

const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const getIsCloudinaryConfigured = () => {
  try {
    require('dotenv').config({ override: true });
  } catch (e) { }

  const isConfigured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'stub' &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'Root' &&
    process.env.CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== 'stub' &&
    process.env.CLOUDINARY_API_KEY !== 'your_api_key'
  );

  if (isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  return isConfigured;
};

const maxSizeMB = parseInt(process.env.UPLOAD_MAX_SIZE_MB, 10) || 5;

// Local Disk Storage fallback creators
const createDiskStorage = (folderName) => multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'public', 'uploads', folderName);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

// Cloudinary Storage engines
const nicCloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rentify-uploads/nic',
    resource_type: 'auto',
    public_id: (req, file) => crypto.randomUUID()
  },
});

const avatarCloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rentify-uploads/avatars',
    resource_type: 'auto'
  }
});

const listingCloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'rentify-uploads/listings',
    resource_type: 'auto'
  }
});

const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/pjpeg'];
  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'), false);
  }
};

const nicFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'), false);
  }
};

// Cloudinary multers
const cloudUploadNic = multer({ storage: nicCloudinaryStorage, limits: { fileSize: maxSizeMB * 1024 * 1024 }, fileFilter: nicFileFilter }).single('file');
const cloudUploadSingleAvatar = multer({ storage: avatarCloudinaryStorage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFileFilter }).single('file');
const cloudUploadMultipleListings = multer({ storage: listingCloudinaryStorage, limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: imageFileFilter }).array('photos', 10);

// Disk multers
const diskUploadNic = multer({ storage: createDiskStorage('nic'), limits: { fileSize: maxSizeMB * 1024 * 1024 }, fileFilter: nicFileFilter }).single('file');
const diskUploadSingleAvatar = multer({ storage: createDiskStorage('avatars'), limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFileFilter }).single('file');
const diskUploadMultipleListings = multer({ storage: createDiskStorage('listings'), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: imageFileFilter }).array('photos', 10);

const wrapUpload = (cloudMulter, diskMulter, fieldName) => {
  return (req, res, next) => {
    const isCloud = getIsCloudinaryConfigured();
    const activeMulter = isCloud ? cloudMulter : diskMulter;

    activeMulter(req, res, (err) => {
      if (err) {
        console.error(`[Upload Error - ${fieldName}]:`, err.message || err);
        return res.status(500).json({
          error: 'Upload Failed',
          message: err.message || 'File upload failed. Please check storage configuration.'
        });
      }
      next();
    });
  };
};

const uploadNic = wrapUpload(cloudUploadNic, diskUploadNic, 'nic');
