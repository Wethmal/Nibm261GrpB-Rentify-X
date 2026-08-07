import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  CheckCircle, XCircle, Search, Shield, Filter,
  MoreVertical, UserX, UserCheck
} from 'lucide-react';
import './UserManagementPage.css';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [actionUserId, setActionUserId] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [actionType, setActionType] = useState(null); // 'suspend' | 'ban'
  const [suspendDays, setSuspendDays] = useState(7);
  const [detail, setDetail] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/users`);
      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    if (newStatus === 'suspended' || newStatus === 'banned') {
      if (!actionReason.trim()) {
        alert('Please provide a reason');
        return;
      }
    } else {
      if (!window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    }

    try {
      if (newStatus === 'banned') {
        await axiosInstance.put(`/admin/users/${id}/ban`, { reason: actionReason.trim() });
      } else if (newStatus === 'suspended') {
        const days = Number(suspendDays);
        if (!Number.isInteger(days) || days < 1) {
          alert('Enter the suspension length as a whole number of days.');
          return;
        }
        await axiosInstance.put(`/admin/users/${id}/suspend`, { reason: actionReason.trim(), days });
      } else {
        await axiosInstance.put(`/admin/users/${id}/reinstate`);
      }
      setActionUserId(null);
      setActionReason('');
      setDetail(null);
      fetchUsers(); // Refresh list to get updated status
    } catch (err) {
      alert(err.response?.data?.message || `Error updating user status to ${newStatus}`);
    }
  };

  // Load the user's report + moderation history for the inline moderation panel
  useEffect(() => {
    if (!actionUserId) { setDetail(null); return undefined; }
    let alive = true;
    axiosInstance.get(`/admin/users/${actionUserId}`)
      .then((res) => { if (alive) setDetail(res.data); })
      .catch(() => { if (alive) setDetail(null); });
    return () => { alive = false; };
  }, [actionUserId]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (u.mobile?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>Search, view, and manage platform user accounts.</p>
        </div>
      </div>

      <div className="admin-controls filters-row">
        <div className="search-bar flex-2">
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name, email, or mobile..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="filter-dropdown">
          <Filter size={16} />
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="consumer">Consumer</option>
            <option value="provider">Provider</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="filter-dropdown">
          <Filter size={16} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="pending_verification">Pending</option>
            <option value="verified">Verified</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading users...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Contact</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <React.Fragment key={user.id}>
                    <tr>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-sm">
                            {user.full_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <strong>{user.full_name || 'N/A'}</strong>
                            <div className="text-sm text-gray-500">{user.id.substring(0,8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-sm">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.mobile || 'No mobile'}</div>
                      </td>
                      <td>
                        <span className={`role-badge ${user.role}`}>{user.role}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.status}`}>
                          {user.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="table-actions">
                          {user.status === 'suspended' || user.status === 'banned' ? (
                            <button 
                              className="btn-icon btn-restore"
                              title="Restore Access"
                              onClick={() => handleStatusUpdate(user.id, 'verified')}
                            >
                              <UserCheck size={18} />
                            </button>
                          ) : (
                            <>
                              <button 
                                className="btn-icon btn-suspend"
                                title="Suspend User"
                                onClick={() => {
                                  setActionUserId(user.id);
                                  setActionType('suspended');
                                }}
                              >
                                <UserX size={18} />
                              </button>
                              <button 
                                className="btn-icon btn-ban"
                                title="Ban User"
                                onClick={() => {
                                  setActionUserId(user.id);
                                  setActionType('banned');
                                }}
                              >
                                <Shield size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    
                    {/* Inline Action Form */}
                    {actionUserId === user.id && (
                      <tr className="action-row">
                        <td colSpan="6">
                          <div className="action-form">
                            <h4>{actionType === 'banned' ? 'Ban' : 'Suspend'} User: {user.full_name}</h4>
                            <input 
                              type="text" 
                              placeholder={`Reason for ${actionType}...`} 
                              value={actionReason}
                              onChange={(e) => setActionReason(e.target.value)}
                              autoFocus
                            />
                            {actionType === 'suspended' && (
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' }}>
                                Suspend for
                                <input
                                  type="number"
                                  min="1"
                                  max="3650"
                                  value={suspendDays}
                                  onChange={(e) => setSuspendDays(e.target.value)}
                                  style={{ width: 90 }}
                                  aria-label="Suspension days"
                                />
                                day(s) - the account is restored automatically afterwards.
                              </label>
                            )}
                            {detail && (
                              <div className="user-moderation-history" style={{ fontSize: '0.85rem', color: '#475569', margin: '8px 0' }}>
                                <div><strong>Reports against this user:</strong> {detail.reports.length}</div>
                                {detail.moderationHistory.length > 0 && (
                                  <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
                                    {detail.moderationHistory.slice(0, 5).map((h) => (
                                      <li key={h.id}>{h.action} - {new Date(h.created_at).toLocaleDateString()}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                            <div className="action-buttons">
                              <button 
                                className="btn-confirm-action" 
                                onClick={() => handleStatusUpdate(user.id, actionType)}
                              >
                                Confirm {actionType === 'banned' ? 'Ban' : 'Suspension'}
                              </button>
                              <button 
                                className="btn-cancel" 
                                onClick={() => {
                                  setActionUserId(null);
                                  setActionReason('');
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
