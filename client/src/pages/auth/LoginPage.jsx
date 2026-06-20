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

  const redirectUser = (role) => {
    localStorage.removeItem('Rentify_failed_attempts');
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'provider') {
      navigate('/provider/dashboard');
    } else {
      navigate('/');
    }
  };

  const handleResendOtp = async () => {
    try {
      setApiError("");
      setResendCooldown(60);

      await axiosInstance.post('/auth/otp/send', { mobile: watchIdentifier });

      setCountdown(600); // Reset OTP validity window to 10 min
    } catch (err) {
      setApiError(err.response?.data?.error || err.message || "Failed to resend OTP");
    }
  };

  const onSubmit = async (data) => {
    if (lockoutTime > 0) return;

    setLoading(true);
    setApiError("");

    try {
      if (!showOtpStep) {
        // Step 1: Handle login authentication
        const result = await login({
          identifier: data.identifier,
          password: data.password,
          rememberMe: data.rememberMe,
          twoFactorEnabled: data.twoFactorEnabled
        });

        if (result?.requires2FA) {
          setPreAuthToken(result.preAuthToken || '');
          if (result.devCode) {
            setValue('otp', result.devCode);
          }
          setShowOtpStep(true);
          setCountdown(600);
          setResendCooldown(60);

          setLoading(false);
          return;
        }

        // Redirect user based on role
        const userRole = result?.user?.role || result?.role;
        redirectUser(userRole);
      } else {
        // Step 2: Handle 2FA OTP Verification
        const response = await axiosInstance.post('/auth/login/2fa/verify', {
          preAuthToken,
          otpCode: data.otp
        });

        const { token, user } = response.data;
        if (token && user) {
          loginSuccess(token, user, data.rememberMe);
          redirectUser(user.role);
        } else {
          throw new Error("Invalid response structure from verification server.");
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Authentication failed";

      if (!showOtpStep) {
        if (err.response?.status === 423) {
          setApiError(err.response?.data?.message || "Account locked due to too many failed attempts.");
          if (err.response?.data?.unlock_at) {
            const remaining = Math.ceil((new Date(err.response.data.unlock_at) - Date.now()) / 1000);
            if (remaining > 0) {
              setLockoutTime(remaining);
            }
          }
        } else {
          handleFailure();
          const attemptsLeft = 3 - (failedCount + 1);
          if (attemptsLeft > 0) {
            setApiError(`${errorMsg}. ${attemptsLeft} attempts remaining before lockout.`);
          } else {
            setApiError("Account locked due to too many failed attempts.");
          }
        }
      } else {
        setApiError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const getIdentifierIcon = () => {
    if (watchIdentifier.includes('@')) {
      return <Mail size={18} className="input-icon-left" />;
    } else if (/^\+?\d+$/.test(watchIdentifier)) {
      return <Phone size={18} className="input-icon-left" />;
    }
    return <Mail size={18} className="input-icon-left" />;
  };

  return (
    <div className="login-container">
      <div className={`login-card ${lockoutTime > 0 ? 'locked' : ''}`}>

        <div className="login-header">
          <h1>Login to Rentify</h1>
          <p>{showOtpStep ? "Enter your 2FA verification code" : "Welcome back! Sign in to access your dashboard"}</p>
        </div>

        {/* Lockout Screen */}
        {lockoutTime > 0 && (
          <div className="lockout-banner">
            <Lock className="lockout-icon" size={20} />
            <div className="lockout-content">
              <div className="lockout-title">Account Lockout</div>
              <div className="lockout-desc">
                Too many failed login attempts. Please wait before attempting again:
                <br />
                <span className="lockout-timer">{formatTime(lockoutTime)}</span>
              </div>
            </div>
          </div>
        )}

        {apiError && !lockoutTime && (
          <div className="alert-error">
            <ShieldAlert size={18} />
            <span>{apiError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {!showOtpStep ? (
            /* Step 1: Login Credentials Form */
            <>
              <div className="form-group">
                <label className="form-label" htmlFor="identifier">Mobile or Email</label>
                <div className="input-wrapper">
                  {getIdentifierIcon()}
                  <input
                    id="identifier"
                    type="text"
                    placeholder="Enter mobile or email"
                    className={`form-input ${errors.identifier ? 'error' : ''}`}
                    disabled={lockoutTime > 0}
                    {...register("identifier")}
                  />
                </div>
                {errors.identifier && (
                  <span className="error-message">{errors.identifier.message}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon-left" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className={`form-input has-right-icon ${errors.password ? 'error' : ''}`}
                    disabled={lockoutTime > 0}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={lockoutTime > 0}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">{errors.password.message}</span>
                )}
              </div>

              <div className="form-options-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    disabled={lockoutTime > 0}
                    {...register("rememberMe")}
                  />
                  <span>Remember me</span>
                </label>

                <div className="toggle-2fa-container">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      className="checkbox-input"
                      disabled={lockoutTime > 0}
                      {...register("twoFactorEnabled")}
                    />
                    <span>2FA Enabled</span>
                  </label>
                  <div className="tooltip-container">
                    <HelpCircle size={15} />
                    <span className="tooltip-text">
                      Requires entering a 6-digit OTP verification code sent via SMS/Email on login.
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Step 2: 2FA OTP Screen */
            <>
              <div className="form-group" style={{ textAlign: 'center' }}>
                <label className="form-label" htmlFor="otp">Security Code</label>
                <div className="input-wrapper" style={{ justifyContent: 'center' }}>
                  <KeyRound size={18} className="input-icon-left" style={{ left: '1.25rem' }} />
                  <input
                    id="otp"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    autoFocus
                    className={`form-input ${errors.otp ? 'error' : ''}`}
                    style={{ letterSpacing: '0.25rem', textAlign: 'center', fontSize: '1.25rem', paddingLeft: '2.5rem' }}
                    {...register("otp")}
                  />
                </div>
                {errors.otp && (
                  <span className="error-message">{errors.otp.message}</span>
                )}
              </div>

              <div className="login-footer-links" style={{ margin: '1rem 0' }}>
                <span>OTP expires in: <strong style={{ color: 'var(--color-primary-navy)' }}>{formatTime(countdown)}</strong></span>
                <button
                  type="button"
                  className="resend-btn"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || countdown === 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--color-slate-gray)' : 'var(--color-primary-blue)',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    textDecoration: 'underline'
                  }}
                >
                  {resendCooldown > 0 ? `Resend OTP in (${resendCooldown}s)` : "Resend OTP"}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || lockoutTime > 0}
          >
            {loading ? (
              <Loader2 className="spinner" size={20} />
            ) : showOtpStep ? (
              <>
                <span>Verify & Login</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="login-footer-links">
          {!showOtpStep ? (
            <>
              <Link to="/reset-password" className="forgot-password-link">
                Forgot password?
              </Link>
              <span>
                Don't have an account? <Link to="/register">Register</Link>
              </span>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowOtpStep(false);
                setApiError("");
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-slate-gray)',
                cursor: 'pointer',
                fontSize: '0.9rem',
                textDecoration: 'underline'
              }}
            >
              Back to Credentials Login
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
