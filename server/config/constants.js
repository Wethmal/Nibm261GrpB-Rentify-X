/**
 * @file constants.js
 * @module Constants
 *
 * @description
 * Application-wide constants for the Rentify backend. Defines frozen enum objects for
 * all domain values used across routes, controllers, services, and models: user roles,
 * user statuses, listing types, listing statuses, booking types, booking statuses,
 * payment statuses, and review statuses. These constants ensure consistency and prevent
 * typos when comparing status/type values. All enum objects are frozen to prevent
 * accidental mutation.
 *
 * @dependencies
 * - None
 *
 * @exports
 * - USER_ROLES, USER_STATUSES, LISTING_TYPES, LISTING_STATUSES, BOOKING_TYPES,
 *   BOOKING_STATUSES, PAYMENT_STATUSES, REVIEW_STATUSES
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

const USER_ROLES = Object.freeze({
  CONSUMER: 'consumer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
});

const USER_STATUSES = Object.freeze({
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  SUSPENDED: 'suspended',
  BANNED: 'banned',
});

const LISTING_TYPES = Object.freeze({
  SERVICE: 'service',
  EQUIPMENT: 'equipment',
});

const LISTING_STATUSES = Object.freeze({
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DELETED: 'deleted',
});

const BOOKING_TYPES = Object.freeze({
  SERVICE: 'service',
  EQUIPMENT: 'equipment',
  BUNDLE: 'bundle',
});

const BOOKING_STATUSES = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  DISPUTED: 'disputed',
});

const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  ESCROWED: 'escrowed',
  RELEASED: 'released',
  REFUNDED: 'refunded',
  FAILED: 'failed',
});

const REVIEW_STATUSES = Object.freeze({
  PENDING_MODERATION: 'pending_moderation',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

module.exports = {
  USER_ROLES,
  USER_STATUSES,
  LISTING_TYPES,
  LISTING_STATUSES,
  BOOKING_TYPES,
  BOOKING_STATUSES,
  PAYMENT_STATUSES,
  REVIEW_STATUSES,
};
