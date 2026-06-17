/**
 * @file axiosInstance.js
 * @module AxiosInstance
 *
 * @description
 * Configures and exports a pre-configured Axios HTTP client instance for the Rentify
 * frontend. Sets the base URL from environment variables, attaches JWT tokens to every
 * outgoing request via a request interceptor, and handles 401 responses globally via a
 * response interceptor (triggering logout and redirect to login). All API modules
 * throughout the client should import this instance instead of raw axios.
 *
 * @dependencies
 * - axios: HTTP client library for making API requests
 *
 * @exports
 * - default: Pre-configured Axios instance with interceptors
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

