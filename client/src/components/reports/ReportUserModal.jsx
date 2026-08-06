/**
 * ReportUserModal (US29): reason + description form that posts to POST /users/:id/report.
 */
import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import '../common/features.css';

export const REPORT_REASONS = [
  { value: 'abusive_behavior', label: 'Abusive behaviour' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'fake_profile', label: 'Fake profile' },
  { value: 'no_show', label: 'No-show' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'other', label: 'Other' },
];

