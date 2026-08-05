/**
 * User restrictions (US24): timed suspension, permanent ban, reinstatement.
 * A suspension with `suspended_until` in the past is treated as expired and lifted lazily.
 */
const { query } = require('../config/db');
const refreshModel = require('../models/refresh_token.model');

