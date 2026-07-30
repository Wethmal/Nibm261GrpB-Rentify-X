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

