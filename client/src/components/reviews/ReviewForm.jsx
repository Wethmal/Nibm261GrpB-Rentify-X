/**
 * ReviewForm (US16): star rating + comment for a completed booking. Creates a review via
 * POST /reviews, or edits an existing one (`review` prop) via PUT /reviews/:id.
 * Validation: rating 1-5, comment of at least 10 characters.
 */
import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../common/features.css';

