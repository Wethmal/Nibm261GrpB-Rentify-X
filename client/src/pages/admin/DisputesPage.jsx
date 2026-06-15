import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  AlertOctagon, CheckCircle, Clock, ShieldAlert,
  MessageSquare, User, FileText
} from 'lucide-react';
import './DisputesPage.css';

function DisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('open');

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/disputes?status=${statusFilter}`);
      setDisputes(response.data.disputes || []);
    } catch (err) {
      if (err.response?.status === 404) {
        // API not implemented yet
        setDisputes([]);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch disputes');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, [statusFilter]);

  return (
    <div className="disputes-page">
      <div className="page-header">
        <div>
          <h1>Reports & Resolutions</h1>
          <p>Review reported users, resolve booking disputes, and maintain platform safety.</p>
        </div>
      </div>

      <div className="admin-controls">
        <div className="filter-tabs">
          <button 
            className={`filter-btn ${statusFilter === 'open' ? 'active' : ''}`}
            onClick={() => setStatusFilter('open')}
          >
            Open Disputes
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'under_review' ? 'active' : ''}`}
            onClick={() => setStatusFilter('under_review')}
          >
            Under Review
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'resolved' ? 'active' : ''}`}
            onClick={() => setStatusFilter('resolved')}
          >
            Resolved
          </button>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading disputes...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : disputes.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert size={48} className="empty-icon" style={{color: '#10b981'}} />
          <h3>No {statusFilter.replace('_', ' ')} disputes found</h3>
          <p>The platform is running smoothly.</p>
        </div>
      ) : (
        <div className="disputes-list">
          {disputes.map(dispute => (
            <div key={dispute.id} className="dispute-card">
              <div className="dispute-header">
                <div className="dispute-title">
                  <AlertOctagon size={24} className="text-red-500" />
                  <h3>Dispute #{dispute.id}</h3>
                  <span className={`status-badge ${dispute.status}`}>
                    {dispute.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="dispute-date">
                  Reported on: {new Date(dispute.created_at).toLocaleDateString()}
                </div>
              </div>

              <div className="dispute-parties">
                <div className="party reporter">
                  <span className="party-label">Reporter</span>
                  <div className="party-info">
                    <User size={16} />
                    <strong>{dispute.reporter_name}</strong>
                  </div>
                </div>
                <div className="party reported">
                  <span className="party-label">Reported User</span>
                  <div className="party-info">
                    <User size={16} />
                    <strong>{dispute.reported_name}</strong>
                  </div>
                </div>
              </div>

              <div className="dispute-details">
                <div className="detail-item">
                  <FileText size={16} />
                  <span><strong>Reason:</strong> {dispute.reason}</span>
                </div>
                <div className="detail-item">
                  <MessageSquare size={16} />
                  <span><strong>Description:</strong> {dispute.description}</span>
                </div>
              </div>

              <div className="dispute-actions">
                <button className="btn-action bg-blue-500">
                  Contact Parties
                </button>
                <button className="btn-action bg-yellow-500 text-black">
                  Issue Warning
                </button>
                <button className="btn-action bg-red-500">
                  Suspend User
                </button>
                <button className="btn-action bg-green-500">
                  Mark Resolved
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DisputesPage;
