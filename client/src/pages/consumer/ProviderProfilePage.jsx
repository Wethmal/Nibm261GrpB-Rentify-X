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

export const avatarUrl = (url) => {
  if (!url || url === '/default-avatar.png') return null;
  if (url.startsWith('http')) return url;
  const base = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:5000';
  return `${base}${url}`;
};

const Stars = ({ value }) => (
  <span className="fx-stars" aria-label={`${Number(value).toFixed(1)} out of 5`}>
    {[1, 2, 3, 4, 5].map((i) => (i <= Math.round(value) ? '★' : '☆'))}
  </span>
);

function ProviderProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [provider, setProvider] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');
  const [bioOpen, setBioOpen] = useState(false);

  const [listings, setListings] = useState([]);
  const [listingType, setListingType] = useState('');
  const [listingSort, setListingSort] = useState('');
  const [listingPage, setListingPage] = useState(1);
  const [listingTotal, setListingTotal] = useState(0);

  const [reviews, setReviews] = useState([]);
  const [reviewSort, setReviewSort] = useState('newest');
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [distribution, setDistribution] = useState({});
  const pageSize = 6;

  // Profile
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    axiosInstance.get(`/providers/${id}`)
      .then((res) => { if (alive) setProvider(res.data.provider); })
      .catch((err) => { if (alive) { if (err.response?.status === 404 || err.response?.status === 400 || err.response?.status === 500) setNotFound(true); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  // SEO: title + meta description
  useEffect(() => {
    if (!provider) return undefined;
    const prev = document.title;
    document.title = `${provider.full_name || 'Provider'} | Rentify`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    const prevDesc = meta.content;
    meta.content = (provider.bio || `${provider.full_name} on Rentify: verified services and equipment rentals in Sri Lanka.`).slice(0, 155);
    return () => { document.title = prev; meta.content = prevDesc; };
  }, [provider]);

  const loadListings = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/providers/${id}/listings`, {
        params: { page: listingPage, limit: pageSize, type: listingType || undefined, sort: listingSort || undefined },
      });
      setListings(res.data.listings || []);
      setListingTotal(res.data.total || 0);
    } catch (err) { setListings([]); }
  }, [id, listingPage, listingType, listingSort]);

  const loadReviews = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/providers/${id}/reviews`, { params: { page: reviewPage, limit: pageSize, sort: reviewSort } });
      setReviews(res.data.reviews || []);
      setReviewTotal(res.data.total || 0);
      setDistribution(res.data.distribution || {});
    } catch (err) { setReviews([]); }
  }, [id, reviewPage, reviewSort]);

  useEffect(() => { if (provider) loadListings(); }, [provider, loadListings]);
  useEffect(() => { if (provider) loadReviews(); }, [provider, loadReviews]);

