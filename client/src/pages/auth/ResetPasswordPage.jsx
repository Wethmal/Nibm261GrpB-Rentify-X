/**
 * @file ResetPasswordPage.jsx
 * @module ResetPasswordPage
 * @description
 * Password reset page component for Rentify (US005). Implements a two-step flow:
 * (1) User enters their registered email/mobile to receive a reset token,
 * (2) User enters the token and their new password.
 * On success, redirects to the login page.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { 
  KeyRound, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Loader2
} from 'lucide-react';
import './LoginPage.css'; // Reuse premium auth page styles

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Check if token exists in URL query param (Step 2 entry point)
  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
      setStep(2);
    }
  }, [searchParams]);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your email address or mobile number.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const payload = isEmail ? { email: identifier } : { mobile: identifier };

      const response = await axiosInstance.post('/auth/request-password-reset', payload);
      setSuccessMsg(response.data.message || 'If an account exists, a reset link has been sent.');
      
      // Move to step 2 after a brief moment so they can enter the token manually if desired
      setTimeout(() => {
        setStep(2);
        setSuccessMsg(null);
      }, 3000);
    } catch (err) {
      const errDetail = err.response?.data?.error;
      setError(typeof errDetail === 'object' ? (errDetail.message || JSON.stringify(errDetail)) : String(errDetail || 'Failed to request password reset.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      const response = await axiosInstance.post('/auth/reset-password', {
        token,
        newPassword
      });

      setSuccessMsg(response.data.message || 'Password reset successful!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      const errDetail = err.response?.data?.error;
      setError(typeof errDetail === 'object' ? (errDetail.message || JSON.stringify(errDetail)) : String(errDetail || 'Failed to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Reset Password</h1>
          {step === 1 ? (
            <p>Enter your email or mobile to receive a reset token</p>
          ) : (
            <p>Set a secure new password for your account</p>
          )}
        </div>

        {/* Banners */}
        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="lockout-banner" style={{ borderColor: 'rgba(40, 167, 69, 0.2)', backgroundColor: 'rgba(40, 167, 69, 0.08)' }}>
            <CheckCircle2 size={18} style={{ color: '#28a745' }} className="lockout-icon" />
            <div className="lockout-content">
              <div className="lockout-title" style={{ color: '#28a745' }}>Success</div>
              <div className="lockout-desc">{successMsg}</div>
            </div>
          </div>
        )}

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleRequestReset}>
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">Email or Mobile Number</label>
              <div className="input-wrapper">
                {identifier.includes('@') ? (
                  <Mail className="input-icon-left" size={18} />
                ) : (
                  <Phone className="input-icon-left" size={18} />
                )}
                <input
                  id="identifier"
                  type="text"
                  placeholder="e.g. user@example.com or 0771234567"
                  className="form-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Sending Request...
                </>
              ) : (
                'Send Reset Token'
              )}
            </button>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label" htmlFor="token">Reset Token</label>
              <div className="input-wrapper">
                <KeyRound className="input-icon-left" size={18} />
                <input
                  id="token"
                  type="text"
                  placeholder="Enter or paste token from your email"
                  className="form-input"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon-left" size={18} />
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="form-input"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon-left" size={18} />
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Verify password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  Updating Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>
            
            <button 
              type="button" 
              className="btn-primary" 
              style={{ backgroundColor: 'transparent', color: 'var(--color-slate-gray)', border: '1px solid var(--color-border)', marginTop: '0.5rem' }}
              onClick={() => setStep(1)}
              disabled={loading}
            >
              Request a new token
            </button>
          </form>
        )}

        <div className="login-footer-links">
          <Link to="/login" className="forgot-password-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
