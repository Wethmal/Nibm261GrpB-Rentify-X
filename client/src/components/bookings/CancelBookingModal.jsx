/**
 * CancelBookingModal (US26): shows the refund preview from GET /bookings/:id/cancellation-preview
 * and confirms with POST /bookings/:id/cancel (consumer) or /cancel-by-provider (provider).
 */
import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import CancellationPolicy from './CancellationPolicy';
import '../common/features.css';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

