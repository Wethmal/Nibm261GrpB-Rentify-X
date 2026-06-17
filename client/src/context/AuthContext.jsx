/**
 * @file AuthContext.jsx
 * @module AuthContext
 *
 * @description
 * Global authentication context for the Rentify application. Provides user state,
 * JWT token management, and authentication actions (login, logout, register) to all
 * child components via React Context API. The AuthProvider initializes by checking
 * localStorage for an existing token and validating it. All components needing auth
 * state should consume this context via the useAuth hook, never directly.
 *
 * @dependencies
 * - react: createContext, useState, useEffect, useCallback, useMemo for context setup
 * - ../api/axiosInstance.js: Axios client for auth API calls
 *
 * @exports
 * - AuthContext: The React context object (for useContext consumers)
 * - AuthProvider: Provider component that wraps the app tree
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    return localStorage.getItem('Rentify_token') || sessionStorage.getItem('Rentify_token') || null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await axiosInstance.get('/users/me');
        // If API returns user data, update user state
        setUser(response.data.user || response.data);
      } catch (error) {
        localStorage.removeItem('Rentify_token');
        sessionStorage.removeItem('Rentify_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    validateToken();
  }, [token]);

  const login = useCallback(async (credentials) => {
    const { identifier, password, rememberMe, twoFactorEnabled } = credentials;
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
    const payload = {
      password,
      twoFactorEnabled
    };
    if (isEmail) {
      payload.email = identifier;
    } else {
      payload.mobile = identifier;
    }

    const response = await axiosInstance.post('/auth/login', payload);
    const { token: returnedToken, user: loggedUser } = response.data;
    const requires2FA = response.data.requires2FA || response.data.requires2fa;

