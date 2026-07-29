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

