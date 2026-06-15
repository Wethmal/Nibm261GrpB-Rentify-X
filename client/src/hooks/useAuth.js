/**
 * @file useAuth.js
 * @module UseAuth
 *
 * @description
 * Custom React hook that provides safe access to the AuthContext. Wraps useContext
 * with a guard that throws an informative error if the hook is used outside of an
 * AuthProvider. All components needing authentication state (user, token, login,
 * logout) should use this hook rather than importing AuthContext directly.
 *
 * @dependencies
 * - react: useContext hook for consuming context
 * - ../context/AuthContext.jsx: The AuthContext to consume
 *
 * @exports
 * - useAuth: Custom hook returning the auth context value
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

/**
 * Custom hook to consume AuthContext safely.
 *
 * @returns {{ user: object|null, token: string|null, loading: boolean, isAuthenticated: boolean, login: Function, logout: Function, register: Function }}
 * @throws {Error} If used outside of an AuthProvider
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === null || context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider. ' +
      'Wrap your component tree with <AuthProvider> in main.jsx.'
    );
  }

  return context;
}
