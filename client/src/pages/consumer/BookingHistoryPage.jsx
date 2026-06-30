/**
 * @file BookingHistoryPage.jsx
 * @module BookingHistoryPage
 *
 * @description
 * Consumer booking history page for Rentify (US004 / SCRUM-59).
 * Fetches booking details from the GET /api/v1/bookings backend API. Displays dates,
 * times, locations, and associated notes visually in cards/list. Automatically falls back
 * to high-fidelity mockup data if the API is stubbed or offline.
 *
 * @dependencies
 * - react: useState, useEffect, useMemo
 * - react-router-dom: Link
 * - lucide-react: Icons
 * - ../../api/axiosInstance.js: Backend API client
 * - ./BookingHistoryPage.css: Premium layouts
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Search, ArrowRight, Star, DollarSign, Ban, ShieldAlert, Sparkles, MessageSquare } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import CancelBookingModal from '../../components/bookings/CancelBookingModal';
import ReviewForm from '../../components/reviews/ReviewForm';
import ReportButton from '../../components/reports/ReportButton';
