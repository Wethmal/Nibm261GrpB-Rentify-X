/**
 * @file RealtimeContext.jsx
 * Live notifications and chat delivery over Server-Sent Events (US17/US18).
 * Opens one EventSource per logged-in user, tracks the unread badge count, shows
 * in-app toasts and (when the user allowed it) native desktop notifications.
 * Other components react through window CustomEvents:
 *   rentify:notification, rentify:message, rentify:message_read.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../hooks/useAuth';
import './RealtimeContext.css';

const RealtimeContext = createContext({ unreadCount: 0, refreshUnread: () => {}, connected: false });

export const useRealtime = () => useContext(RealtimeContext);

const emit = (name, detail) => window.dispatchEvent(new CustomEvent(`rentify:${name}`, { detail }));

export function RealtimeProvider({ children }) {
  const { token, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState([]);
  const sourceRef = useRef(null);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/notifications', { params: { limit: 100 } });
      setUnreadCount((res.data.notifications || []).filter((n) => !n.is_read).length);
    } catch (err) {
      /* badge simply stays as-is */
    }
  }, []);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const pushToast = useCallback((n) => {
    const id = n.id || `t_${Date.now()}`;
    setToasts((t) => [...t.slice(-3), { id, title: n.title, body: n.body }]);
    setTimeout(() => dismissToast(id), 6000);
  }, [dismissToast]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setUnreadCount(0);
      setConnected(false);
      return undefined;
    }

    refreshUnread();
    const base = axiosInstance.defaults.baseURL || '';
    const es = new EventSource(`${base}/realtime/stream?token=${encodeURIComponent(token)}`);
    sourceRef.current = es;

    es.addEventListener('ready', () => setConnected(true));
    es.addEventListener('notification', (e) => {
      const n = JSON.parse(e.data);
      setUnreadCount((c) => c + 1);
      pushToast(n);
      emit('notification', n);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
        try { new Notification(n.title, { body: n.body }); } catch (_) { /* unsupported */ }
      }
    });
    es.addEventListener('message', (e) => emit('message', JSON.parse(e.data)));
    es.addEventListener('message_read', (e) => emit('message_read', JSON.parse(e.data)));
    es.onerror = () => setConnected(false); // EventSource reconnects on its own

