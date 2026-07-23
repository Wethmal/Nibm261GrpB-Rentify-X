/**
 * ProviderProfilePage (US28): public provider profile at /providers/:id with hero, collapsible
 * bio, active listings, reviews with rating summary, sticky action bar, breadcrumb and
 * friendly empty / 404 states. Only verified providers are visible (API returns 404 otherwise).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, MapPin, MessageSquare, CalendarCheck, User } from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import ListingCard from '../../components/listings/ListingCard';
import ReportButton from '../../components/reports/ReportButton';
import '../../components/common/features.css';
import './ProviderProfilePage.css';

