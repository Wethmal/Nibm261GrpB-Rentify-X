/**
 * ListingPolicyControl (US26): lets a provider choose the cancellation policy of a listing.
 * Saves independently through PUT /listings/:id/cancellation-policy.
 */
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import CancellationPolicy from '../bookings/CancellationPolicy';
import '../common/features.css';

const OPTIONS = [
  { value: 'flexible', label: 'Flexible: full refund 24h+ before start' },
  { value: 'moderate', label: 'Moderate: full refund 48h+, 50% 24-48h' },
  { value: 'strict', label: 'Strict: full refund 7 days+, 50% 3-7 days' },
  { value: 'non_refundable', label: 'Non-refundable' },
];

