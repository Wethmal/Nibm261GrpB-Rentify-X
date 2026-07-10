import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  CheckCircle, XCircle, FileText, Search, User, 
  Phone, Mail, Calendar, ExternalLink
} from 'lucide-react';
import './ProviderApprovalPage.css';

function ProviderApprovalPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending_verification');
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/providers?status=${statusFilter}`);
      setProviders(response.data.providers || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm('Are you sure you want to approve this provider?')) return;
    try {
      await axiosInstance.put(`/admin/providers/${id}/approve`);
      setProviders(providers.filter(p => p.id !== id));
    } catch (err) {
      alert('Error approving provider');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }
    try {
      await axiosInstance.put(`/admin/providers/${id}/reject`, { reason: rejectReason });
      setRejectingId(null);
      setRejectReason('');
      setProviders(providers.filter(p => p.id !== id));
    } catch (err) {
      alert('Error rejecting provider');
    }
  };

  const filteredProviders = providers.filter(p => 
    (p.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (p.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (p.mobile?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="provider-approval-page">
      <div className="page-header">
        <div>
          <h1>Provider Approvals</h1>
          <p>Review and verify provider accounts before they can list items.</p>
        </div>
      </div>

      <div className="admin-controls">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email, or mobile..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-tabs">
          <button 
            className={`filter-btn ${statusFilter === 'pending_verification' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending_verification')}
          >
            Pending
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'verified' ? 'active' : ''}`}
            onClick={() => setStatusFilter('verified')}
          >
            Verified
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading providers...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : filteredProviders.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} className="empty-icon" />
          <h3>No providers found</h3>
          <p>You're all caught up on approvals!</p>
        </div>
      ) : (
        <div className="provider-grid">
          {filteredProviders.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <div className="provider-avatar">
                  <User size={24} />
                </div>
                <div className="provider-info">
                  <h3>{provider.full_name || 'N/A'}</h3>
                  <span className={`status-badge ${provider.status}`}>
                    {provider.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="provider-details">
                <div className="detail-item">
                  <Mail size={16} /> <span>{provider.email || 'N/A'}</span>
                </div>
                <div className="detail-item">
                  <Phone size={16} /> <span>{provider.mobile}</span>
                </div>
                <div className="detail-item">
                  <FileText size={16} /> <span>NIC: {provider.nic_number || 'Not provided'}</span>
                </div>
                <div className="detail-item">
                  <Calendar size={16} /> 
                  <span>Joined: {new Date(provider.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {provider.nic_document_url && (
                <div className="nic-preview">
                  <a href={provider.nic_document_url} target="_blank" rel="noopener noreferrer" className="nic-link">
                    <ExternalLink size={16} /> View NIC Document
                  </a>
                </div>
              )}

              {provider.status === 'pending_verification' && (
                <div className="provider-actions">
                  {rejectingId === provider.id ? (
                    <div className="reject-form">
                      <input 
                        type="text" 
                        placeholder="Reason for rejection..." 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        autoFocus
                      />
                      <div className="reject-actions">
                        <button className="btn-confirm-reject" onClick={() => handleReject(provider.id)}>
                          Confirm
                        </button>
                        <button className="btn-cancel" onClick={() => setRejectingId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button className="btn-approve" onClick={() => handleApprove(provider.id)}>
                        <CheckCircle size={18} /> Approve
                      </button>
                      <button className="btn-reject" onClick={() => setRejectingId(provider.id)}>
                        <XCircle size={18} /> Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProviderApprovalPage;
