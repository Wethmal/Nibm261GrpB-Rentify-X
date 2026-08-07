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

  const messageProvider = async () => {
    if (!isAuthenticated) return navigate('/login');
    navigate('/messages');
  };

  if (loading) return <div className="pp-state">Loading profile…</div>;
  if (notFound || !provider) {
    return (
      <div className="pp-state pp-404" data-testid="provider-not-found">
        <User size={48} />
        <h1>Provider not found</h1>
        <p>This provider does not exist or has not been verified yet.</p>
        <Link to="/search" className="fx-btn fx-btn--primary">Browse listings</Link>
      </div>
    );
  }

  const photo = avatarUrl(provider.profile_photo_url);
  const bio = provider.bio || '';
  const longBio = bio.length > 220;
  const firstListing = listings[0];
  const isSelf = user?.id === provider.id;
  const listingPages = Math.max(Math.ceil(listingTotal / pageSize), 1);
  const reviewPages = Math.max(Math.ceil(reviewTotal / pageSize), 1);

  return (
    <div className="pp-page">
      <nav className="pp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link><span>/</span><Link to="/search">Providers</Link><span>/</span><strong>{provider.full_name}</strong>
      </nav>

      <header className="pp-hero">
        {photo ? <img src={photo} alt={provider.full_name} className="pp-avatar" /> : <div className="pp-avatar pp-avatar--empty"><User size={40} /></div>}
        <div className="pp-hero__info">
          <h1>{provider.full_name} <BadgeCheck size={20} className="pp-verified" aria-label="Verified provider" /></h1>
          <div className="pp-meta">
            <span><Stars value={provider.average_rating} /> {Number(provider.average_rating).toFixed(1)} ({provider.review_count} review{provider.review_count === 1 ? '' : 's'})</span>
            {provider.district && <span><MapPin size={14} /> {provider.district}</span>}
            <span>{provider.active_listing_count} active listing{provider.active_listing_count === 1 ? '' : 's'}</span>
            <span>Member since {new Date(provider.created_at).getFullYear()}</span>
          </div>
          {bio ? (
            <p className={`pp-bio ${bioOpen || !longBio ? '' : 'pp-bio--clamped'}`}>{bio}</p>
          ) : (
            <p className="pp-bio pp-bio--empty">This provider has not added a bio yet.</p>
          )}
          {longBio && <button className="fx-link-btn" onClick={() => setBioOpen(!bioOpen)}>{bioOpen ? 'Show less' : 'Read more'}</button>}
        </div>
      </header>

      <div className="pp-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'listings'} className={tab === 'listings' ? 'active' : ''} onClick={() => setTab('listings')}>Active listings ({listingTotal})</button>
        <button role="tab" aria-selected={tab === 'reviews'} className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Reviews ({reviewTotal})</button>
      </div>

      {tab === 'listings' ? (
        <section>
          <div className="pp-filters">
            <select value={listingType} onChange={(e) => { setListingPage(1); setListingType(e.target.value); }} aria-label="Filter by type">
              <option value="">All types</option><option value="service">Services</option><option value="equipment">Equipment</option>
            </select>
            <select value={listingSort} onChange={(e) => { setListingPage(1); setListingSort(e.target.value); }} aria-label="Sort listings">
              <option value="">Newest</option><option value="popularity">Most popular</option><option value="rating">Top rated</option>
            </select>
          </div>
          {listings.length === 0 ? (
            <div className="pp-empty">This provider has no active listings right now.</div>
          ) : (
            <div className="pp-grid">{listings.map((l) => <ListingCard key={l.id} listing={{ ...l, provider_name: provider.full_name, provider_id: provider.id }} />)}</div>
          )}
          {listingPages > 1 && (
            <div className="pp-pager">
              <button className="fx-btn" disabled={listingPage <= 1} onClick={() => setListingPage((p) => p - 1)}>Previous</button>
              <span>Page {listingPage} of {listingPages}</span>
              <button className="fx-btn" disabled={listingPage >= listingPages} onClick={() => setListingPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </section>
      ) : (
        <section>
          <div className="pp-summary">
            <div className="pp-summary__score"><strong>{Number(provider.average_rating).toFixed(1)}</strong><Stars value={provider.average_rating} /><span>{provider.review_count} reviews</span></div>
            <div className="pp-summary__bars">
              {[5, 4, 3, 2, 1].map((n) => {
                const c = distribution[n] || 0;
                const pct = reviewTotal ? Math.round((c / reviewTotal) * 100) : 0;
                return <div key={n} className="pp-bar"><span>{n}★</span><div><i style={{ width: `${pct}%` }} /></div><span>{c}</span></div>;
              })}
            </div>
          </div>
          <div className="pp-filters">
            <select value={reviewSort} onChange={(e) => { setReviewPage(1); setReviewSort(e.target.value); }} aria-label="Sort reviews">
              <option value="newest">Newest</option><option value="highest">Highest rated</option><option value="lowest">Lowest rated</option>
            </select>
          </div>
          {reviews.length === 0 ? (
            <div className="pp-empty">No reviews yet.</div>
          ) : (
            <ul className="pp-reviews">
              {reviews.map((r) => (
                <li key={r.id}>
                  <div className="pp-review__head"><strong>{r.reviewer_name || 'Rentify user'}</strong><Stars value={r.rating} /><time>{new Date(r.created_at).toLocaleDateString()}</time></div>
                  {r.listing_title && <div className="pp-review__listing">on {r.listing_title}</div>}
                  {r.comment && <p>{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
          {reviewPages > 1 && (
            <div className="pp-pager">
              <button className="fx-btn" disabled={reviewPage <= 1} onClick={() => setReviewPage((p) => p - 1)}>Previous</button>
              <span>Page {reviewPage} of {reviewPages}</span>
              <button className="fx-btn" disabled={reviewPage >= reviewPages} onClick={() => setReviewPage((p) => p + 1)}>Next</button>
            </div>
          )}
        </section>
      )}

      {!isSelf && (
        <div className="pp-actionbar" data-testid="provider-action-bar">
          <span className="pp-actionbar__name">{provider.full_name}</span>
          <div className="pp-actionbar__buttons">
            <ReportButton userId={provider.id} userName={provider.full_name} label="Report provider" />
            <button className="fx-btn" onClick={messageProvider}><MessageSquare size={14} /> Send a Message</button>
            <button className="fx-btn fx-btn--primary" disabled={!firstListing} onClick={() => firstListing && navigate(`/listings/${firstListing.id}`)}>
              <CalendarCheck size={14} /> Book a Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProviderProfilePage;
