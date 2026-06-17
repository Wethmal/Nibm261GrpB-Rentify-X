/**
 * @file LoginPage.jsx
 * @module LoginPage
 *
 * @description
 * Login page component for Rentify (US002). Renders a login form accepting
 * email/mobile and password. Supports optional two-factor authentication (2FA)
 * via OTP if the user has it enabled. On successful authentication, stores the
 * JWT token and redirects to the appropriate dashboard based on user role
 * (Consumer → Home, Provider → Dashboard, Admin → Admin Dashboard). Includes
 * links to registration and password reset pages.
 *
 * @dependencies
 * - react: useState, useEffect, useCallback
 * - react-router-dom: useNavigate, Link
 * - react-hook-form: Form validation
 * - @hookform/resolvers/zod: Zod resolver for react-hook-form
 * - zod: Validation schema definition
 * - lucide-react: UI icons
 * - ../../hooks/useAuth.js: useAuth hook for login action
 * - ../../api/axiosInstance.js: Axios instance for API calls
 *
 * @exports
 * - LoginPage: React functional component for the login page
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  HelpCircle,
  Loader2,
  ShieldAlert,
  KeyRound,
  LogIn
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import './LoginPage.css';

// Validation Schema for Login credentials
const loginSchema = z.object({
  identifier: z.string().min(1, "Email or Mobile is required").refine((val) => {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    const isMobile = /^(?:\+94|0)7\d{8}$/.test(val);
    return isEmail || isMobile;
  }, "Please enter a valid email address or Sri Lankan mobile number"),
  password: z.string().min(1, "Password is required"),
  twoFactorEnabled: z.boolean().optional(),
  rememberMe: z.boolean().optional()
});

// Validation Schema for 2FA OTP Step
const otpSchema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits")
});

function LoginPage() {
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(() => {
    // Set by the API client when a banned/suspended account is logged out mid-session (US24)
    try {
      const msg = sessionStorage.getItem('Rentify_restricted') || '';
      if (msg) sessionStorage.removeItem('Rentify_restricted');
      return msg;
    } catch (e) {
      return '';
    }
  });
  const [countdown, setCountdown] = useState(0); // 2FA OTP countdown
  const [resendCooldown, setResendCooldown] = useState(0); // Resend cooldown
  const [lockoutTime, setLockoutTime] = useState(0); // Lockout countdown
  const [failedCount, setFailedCount] = useState(0);
  const [preAuthToken, setPreAuthToken] = useState('');

  const navigate = useNavigate();
  const { login, loginSuccess } = useAuth();

  // Dynamic schema resolution depending on the active step
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    resolver: zodResolver(showOtpStep ? otpSchema : loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      twoFactorEnabled: false,
      rememberMe: false,
      otp: ''
    },
    mode: 'onBlur'
  });

  const watchIdentifier = watch("identifier") || "";

  // Load lockout state from localStorage on mount
  useEffect(() => {
    const storedFailures = localStorage.getItem('Rentify_failed_attempts');
    if (storedFailures) {
      setFailedCount(parseInt(storedFailures, 10));
    }

    const lockoutUntil = localStorage.getItem('Rentify_lockout_until');
    if (lockoutUntil) {
      const remaining = Math.ceil((parseInt(lockoutUntil, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutTime(remaining);
      } else {
        localStorage.removeItem('Rentify_lockout_until');
        localStorage.removeItem('Rentify_failed_attempts');
        setFailedCount(0);
      }
    }
  }, []);

  // Timer for lockout countdown
  useEffect(() => {
    let timer;
    if (lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime((prev) => {
          if (prev <= 1) {
            localStorage.removeItem('Rentify_lockout_until');
            localStorage.removeItem('Rentify_failed_attempts');
            setFailedCount(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTime]);

  // Timer for OTP countdown and resend cooldown
  useEffect(() => {
    let timer;
    if (showOtpStep && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpStep, countdown]);

  const handleFailure = () => {
    const nextFailed = failedCount + 1;
    setFailedCount(nextFailed);
    localStorage.setItem('Rentify_failed_attempts', nextFailed.toString());

    if (nextFailed >= 3) {
      const lockoutDuration = 300 * 1000; // 5 minutes lockout
      const until = Date.now() + lockoutDuration;
      localStorage.setItem('Rentify_lockout_until', until.toString());
      setLockoutTime(300);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

