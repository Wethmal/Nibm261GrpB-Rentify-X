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

