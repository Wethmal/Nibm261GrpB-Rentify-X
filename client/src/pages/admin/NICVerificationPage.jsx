import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  CheckCircle, XCircle, Search, ExternalLink, ShieldAlert
} from 'lucide-react';
import './NICVerificationPage.css';

function NICVerificationPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rejectingId, setRejectingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/admin/nic-verifications');
      setUsers(response.data.verifications || []);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch verifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // A review note is mandatory for every decision (SCRUM-162)
  const decide = async (id, decision) => {
    const note = window.prompt(
      decision === 'approve'
        ? 'Add a review note for this approval (required):'
        : 'Why is this NIC being rejected? (required, sent to the user)'
    );
    if (note === null) return;
    if (note.trim().length < 3) {
      alert('A review note is required.');
      return;
    }
    try {
      await axiosInstance.put(`/admin/nic-verifications/${id}/decision`, { decision, note: note.trim() });
      setRejectingId(null);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || `Error trying to ${decision} NIC`);
    }
  };

  const handleApprove = (id) => decide(id, 'approve');
  const handleReject = (id) => decide(id, 'reject');

  const filteredUsers = users.filter(u => 
    (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (u.nic_number?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="nic-verification-page">
      <div className="page-header">
        <div>
          <h1>NIC Verification</h1>
          <p>Review and verify user-uploaded National Identity Card documents.</p>
        </div>
      </div>

      <div className="admin-controls">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or NIC number..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading NIC documents...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <ShieldAlert size={48} className="empty-icon" />
          <h3>No pending NIC verifications</h3>
          <p>All user documents have been processed.</p>
        </div>
      ) : (
        <div className="nic-grid">
          {filteredUsers.map(user => (
            <div key={user.id} className="nic-card">
              <div className="nic-image-container">
                <a href={user.nic_document_url} target="_blank" rel="noopener noreferrer">
                  <img src={user.nic_document_url} alt="NIC Document" className="nic-image" />
                  <div className="nic-overlay">
                    <ExternalLink size={24} />
                    <span>View Full Size</span>
                  </div>
                </a>
              </div>
              
              <div className="nic-details">
                <div className="detail-row">
                  <span className="label">User:</span>
                  <strong>{user.full_name}</strong>
                </div>
                <div className="detail-row">
                  <span className="label">Role:</span>
                  <span className="role-badge">{user.role}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="label">Provided NIC No:</span>
                  <strong>{user.nic_number}</strong>
                </div>

                <div className="nic-actions">
                  <button className="btn-approve" onClick={() => handleApprove(user.id)}>
                    <CheckCircle size={18} /> Verify Match
                  </button>
                  <button className="btn-reject" onClick={() => handleReject(user.id)}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NICVerificationPage;
