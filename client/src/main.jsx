/**
 * @file main.jsx
 * @module AppEntry
 *
 * @description
 * Application entry point for the Rentify client. Creates the React root using
 * React 18's createRoot API and mounts the component tree. Wraps the App component
 * with BrowserRouter for client-side routing and AuthProvider for global authentication
 * state. This file is imported by index.html via Vite's module bundler.
 *
 * @dependencies
 * - react: React library for creating the root
 * - react-dom/client: createRoot API for React 18 concurrent rendering
 * - react-router-dom: BrowserRouter for client-side routing
 * - ./App.jsx: Root application component with route definitions
 * - ./context/AuthContext.jsx: AuthProvider for global auth state management
 *
 * @exports
 * - None (side-effect: mounts React app to DOM #root element)
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { RealtimeProvider } from './context/RealtimeContext.jsx';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <RealtimeProvider>
          <App />
        </RealtimeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
