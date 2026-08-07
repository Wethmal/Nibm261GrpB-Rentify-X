import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  Bell, Check, MessageSquare, Calendar, 
  Settings, Info, ShieldAlert
} from 'lucide-react';
import './NotificationsPage.css';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread
  const [showSettings, setShowSettings] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/notifications');
      setNotifications(response.data.notifications || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setNotifications([]);
      } else {
        setError('Failed to fetch notifications');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Live notifications pushed by the SSE stream (US18)
    const onLive = (e) => setNotifications((prev) => (prev.some((n) => n.id === e.detail.id) ? prev : [e.detail, ...prev]));
    window.addEventListener('rentify:notification', onLive);
    return () => window.removeEventListener('rentify:notification', onLive);
  }, []);

  const syncBadge = () => window.dispatchEvent(new CustomEvent('rentify:notifications-changed'));

  const [desktopPermission, setDesktopPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const enableDesktopAlerts = async () => {
    if (typeof Notification === 'undefined') return;
    setDesktopPermission(await Notification.requestPermission());
  };

  const markAsRead = async (id) => {
    try {
      await axiosInstance.put(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
      syncBadge();
    } catch (err) {
      // Optimistic update for UI even if API fails
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put(`/notifications/read-all`);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      syncBadge();
    } catch (err) {
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    }
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'unread' ? !n.is_read : true
  );

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch(type) {
      case 'booking': return <Calendar size={20} className="text-blue-500" />;
      case 'message': return <MessageSquare size={20} className="text-green-500" />;
      case 'system': return <ShieldAlert size={20} className="text-red-500" />;
      default: return <Info size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated on your bookings, messages, and account activity.</p>
        </div>
        <button 
          className="btn-settings"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings size={20} /> Preferences
        </button>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <h3>Notification Preferences</h3>
          {desktopPermission !== 'unsupported' && (
            <div className="preference-group">
              <label className="toggle-label">
                <span>
                  Desktop push alerts: <strong>{desktopPermission === 'granted' ? 'enabled' : desktopPermission === 'denied' ? 'blocked in browser settings' : 'off'}</strong>
                </span>
              </label>
              {desktopPermission === 'default' && (
                <button type="button" className="btn-settings" onClick={enableDesktopAlerts}>Enable desktop alerts</button>
              )}
            </div>
          )}
          <div className="preference-group">
            <label className="toggle-label">
              <input type="checkbox" defaultChecked />
              <span>Email Notifications</span>
            </label>
            <label className="toggle-label">
              <input type="checkbox" defaultChecked />
              <span>In-App Notifications</span>
            </label>
            <label className="toggle-label">
              <input type="checkbox" />
              <span>SMS Alerts (Important only)</span>
            </label>
          </div>
          <button className="btn-save-prefs" onClick={() => setShowSettings(false)}>
            Save Preferences
          </button>
        </div>
      )}

      <div className="notifications-controls">
        <div className="filter-tabs">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>

        {unreadCount > 0 && (
          <button className="btn-mark-all" onClick={markAllAsRead}>
            <Check size={16} /> Mark all as read
          </button>
        )}
      </div>

      {loading ? (
        <div className="admin-loading">Loading notifications...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : filteredNotifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={48} className="empty-icon text-gray-400" />
          <h3>No {filter === 'unread' ? 'unread ' : ''}notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ) : (
        <div className="notifications-list">
          {filteredNotifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="notification-icon">
                {getIcon(notification.type)}
              </div>
              
              <div className="notification-content">
                <div className="notification-header">
                  <h4>{notification.title}</h4>
                  <span className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                </div>
                <p>{notification.body}</p>
              </div>

              {!notification.is_read && (
                <div className="unread-dot"></div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotificationsPage;
