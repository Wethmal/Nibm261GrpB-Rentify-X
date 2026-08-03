import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  CheckCircle, XCircle, Search, 
  MapPin, Tag, DollarSign, Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './ListingModerationPage.css';

function ListingModerationPage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending_approval');
  const [searchQuery, setSearchQuery] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendingId, setSuspendingId] = useState(null);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/listings?status=${statusFilter}`);
      setListings(response.data.listings || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this listing?')) return;
    try {
      await axiosInstance.put(`/admin/listings/${id}/approve`);
      setListings(listings.filter(l => l.id !== id));
    } catch (err) {
      alert('Error approving listing');
    }
  };

  const handleSuspend = async (id) => {
    if (!suspendReason.trim()) {
      alert('Please provide a suspension reason');
      return;
    }
    try {
      await axiosInstance.put(`/admin/listings/${id}/suspend`, { reason: suspendReason });
      setSuspendingId(null);
      setSuspendReason('');
      setListings(listings.filter(l => l.id !== id));
    } catch (err) {
      alert('Error suspending listing');
    }
  };

  const filteredListings = listings.filter(l => 
    (l.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (l.provider_name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="listing-moderation-page">
      <div className="page-header">
        <div>
          <h1>Listing Moderation</h1>
          <p>Review, approve, or suspend listings to maintain platform quality.</p>
        </div>
      </div>

      <div className="admin-controls">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search listings by title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-btn ${statusFilter === 'pending_approval' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending_approval')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'suspended' ? 'active' : ''}`}
            onClick={() => setStatusFilter('suspended')}
          >
            Suspended
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading listings...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : filteredListings.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} className="empty-icon" />
          <h3>No listings found</h3>
          <p>You're all caught up on moderation!</p>
        </div>
      ) : (
        <div className="listing-grid">
          {filteredListings.map(listing => (
            <div key={listing.id} className="moderation-card">
              <div className="moderation-image">
                {listing.photos && listing.photos.length > 0 ? (
                  <img src={listing.photos[0]} alt={listing.title} />
                ) : (
                  <div className="no-image">
                    <ImageIcon size={32} />
                    <span>No Image</span>
                  </div>
                )}
                <div className={`status-badge floating ${listing.status}`}>
                  {listing.status.replace('_', ' ')}
                </div>
              </div>
              
              <div className="moderation-content">
                <h3>{listing.title}</h3>
                
                <div className="moderation-details">
                  <div className="detail-item">
                    <Tag size={16} /> <span>{listing.category_name || 'Category'}</span>
                  </div>
                  <div className="detail-item">
                    <DollarSign size={16} /> 
                    <span>Rs. {listing.price_per_unit}/{listing.unit_label}</span>
                  </div>
                  <div className="detail-item">
                    <MapPin size={16} /> <span>{listing.district}</span>
                  </div>
                </div>

                <div className="moderation-provider">
                  <span className="label">Provider:</span>
                  <strong>{listing.provider_name || 'Unknown'}</strong>
                </div>

                <p className="moderation-desc">{listing.description}</p>

                <div className="moderation-actions">
                  <Link to={`/listings/${listing.id}`} target="_blank" className="btn-view">
                    <ExternalLink size={16} /> View Details
                  </Link>

                  {listing.status === 'pending_approval' && (
                    suspendingId === listing.id ? (
                      <div className="suspend-form">
                        <input 
                          type="text" 
                          placeholder="Reason for suspension..." 
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          autoFocus
                        />
                        <div className="suspend-actions">
                          <button className="btn-confirm-suspend" onClick={() => handleSuspend(listing.id)}>
                            Confirm
                          </button>
                          <button className="btn-cancel" onClick={() => setSuspendingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button className="btn-approve" onClick={() => handleApprove(listing.id)}>
                          <CheckCircle size={18} /> Approve
                        </button>
                        <button className="btn-reject" onClick={() => setSuspendingId(listing.id)}>
                          <XCircle size={18} /> Suspend
                        </button>
                      </div>
                    )
                  )}
                  
                  {listing.status === 'active' && (
                    <div className="action-buttons">
                      <button className="btn-reject" onClick={() => setSuspendingId(listing.id)}>
                        <XCircle size={18} /> Suspend
                      </button>
                    </div>
                  )}
                  
                  {listing.status === 'active' && suspendingId === listing.id && (
                     <div className="suspend-form" style={{marginTop: '1rem', width: '100%'}}>
                        <input 
                          type="text" 
                          placeholder="Reason for suspension..." 
                          value={suspendReason}
                          onChange={(e) => setSuspendReason(e.target.value)}
                          autoFocus
                        />
                        <div className="suspend-actions">
                          <button className="btn-confirm-suspend" onClick={() => handleSuspend(listing.id)}>
                            Confirm
                          </button>
                          <button className="btn-cancel" onClick={() => setSuspendingId(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ListingModerationPage;
