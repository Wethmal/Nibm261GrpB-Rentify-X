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

