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

