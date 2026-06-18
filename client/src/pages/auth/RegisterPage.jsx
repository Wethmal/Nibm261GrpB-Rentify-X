/**
 * @file RegisterPage.jsx
 * @module RegisterPage
 *
 * @description
 * User registration page component for Rentify (US001). Renders a multi-step
 * registration form that collects the user's mobile number, password, role
 * selection (Consumer/Provider), OTP verification, and NIC document upload.
 * Uses react-hook-form and zod for robust client-side validation.
 *
 * @author Rentify Engineering Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { User, Briefcase, UploadCloud, FileText, X, ArrowRight, ArrowLeft, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import axiosInstance from '../../api/axiosInstance';
import './RegisterPage.css';

// Validation Schemas per Step
const step1Schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobile: z.string().regex(/^(?:\+94|0)7\d{8}$/, "Invalid Sri Lanka mobile number (e.g., +94712345678 or 0712345678)"),
  role: z.enum(["Consumer", "Provider"]),
  password: z.string().min(8, "Password must be at least 8 characters")
});

const step2Schema = z.object({
  otp: z.string().length(6, "OTP must be exactly 6 digits").regex(/^\d+$/, "OTP must contain only digits")
});

// Calculate password strength (0-4)
const calculateStrength = (password) => {
  if (!password) return 0;
  let strength = 0;
  if (password.length >= 8) strength += 1;
  if (/[A-Z]/.test(password)) strength += 1;
  if (/[0-9]/.test(password)) strength += 1;
  if (/[^A-Za-z0-9]/.test(password)) strength += 1;
  return strength;
};

const getStrengthColor = (strength) => {
  if (strength === 0) return 'var(--color-light-platinum)';
  if (strength === 1) return 'var(--color-error)';
  if (strength === 2) return '#F59E0B'; // Warning yellow
  if (strength === 3) return '#3B82F6'; // Blue
  return 'var(--color-success)';
};

const getStrengthLabel = (strength) => {
  if (strength === 0) return '';
  if (strength === 1) return 'Weak';
  if (strength === 2) return 'Fair';
  if (strength === 3) return 'Good';
  return 'Strong';
};

function RegisterPage() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [countdown, setCountdown] = useState(600); // 10 minutes = 600s for OTP expiry
  const [resendCooldown, setResendCooldown] = useState(60);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registeredUserId, setRegisteredUserId] = useState("");
  const [registeredUserToken, setRegisteredUserToken] = useState("");
  const navigate = useNavigate();
  const { loginSuccess } = useAuth();

  const { register, handleSubmit, formState: { errors }, watch, trigger, setValue, getValues } = useForm({
    resolver: zodResolver(step === 1 ? step1Schema : (step === 2 ? step2Schema : z.object({}))),
    defaultValues: {
      role: 'Consumer',
      fullName: '',
      mobile: '',
      email: '',
      password: '',
      otp: ''
    },
    mode: 'onBlur'
  });

  const watchPassword = watch("password");
  const watchRole = watch("role");
  const passwordStrength = calculateStrength(watchPassword);

  // Timers for OTP
  useEffect(() => {
    let timer;
    if (step === 2) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleNextStepClick = async () => {
    // We just manually trigger submit when button is clicked (handled by button type="submit" or calling handleSubmit)
  };

  const handlePrevStep = () => {
    setApiError("");
    setStep((prev) => prev - 1);
  };

  const handleResendOTP = async () => {
    if (resendCooldown === 0) {
      setApiError("");
      try {
        const otpRes = await axiosInstance.post('/auth/otp/send', { mobile: watch("mobile") });
        if (otpRes.data?.devCode) {
          setValue('otp', otpRes.data.devCode);
        }
        setResendCooldown(60);
        setCountdown(600);
      } catch (err) {
        setApiError(err.response?.data?.error || "Failed to resend OTP");
      }
    }
  };

  // Dropzone for NIC (Step 3)
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setFileError("");
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      if (rejection.errors[0]?.code === "file-too-large") {
        setFileError("File is larger than 5MB");
      } else if (rejection.errors[0]?.code === "file-invalid-type") {
        setFileError("Only JPG, PNG, and PDF files are accepted");
      } else {
        setFileError("Invalid file");
      }
      return;
    }

    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const onSubmit = async (data) => {
    setApiError("");
    const currentMobile = getValues('mobile');
    const currentRole = getValues('role');
    const currentFullName = getValues('fullName');
    const currentEmail = getValues('email');

    if (step === 1) {
      setLoading(true);
      try {
        // 1. Register User
        const regRes = await axiosInstance.post('/auth/register', {
          full_name: currentFullName,
          mobile: currentMobile,
          email: currentEmail,
          password: data.password,
          role: currentRole.toLowerCase()
        });
        
        if (regRes.data?.userId) {
          setRegisteredUserId(regRes.data.userId);
        }
        if (regRes.data?.token) {
          setRegisteredUserToken(regRes.data.token);
        }

        // 2. Send OTP
        const otpRes = await axiosInstance.post('/auth/otp/send', { mobile: currentMobile });
        if (otpRes.data?.devCode) {
          setValue('otp', otpRes.data.devCode);
        }

        setStep(2);
        setCountdown(600);
        setResendCooldown(60);
      } catch (err) {
        if (err.response?.status === 409) {
          setApiError("Mobile already registered. Please log in.");
        } else {
          setApiError(err.response?.data?.error || err.message || "Registration failed");
        }
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      setLoading(true);
      try {
        // Verify OTP
        const res = await axiosInstance.post('/auth/otp/verify', { mobile: currentMobile, otpCode: data.otp });

        if (currentRole === 'Consumer') {
          // Consumers do not need NIC. Finish and login!
          loginSuccess(res.data.token, res.data.user, false);
          navigate('/');
        } else {
          // Providers proceed to NIC Upload
          if (res.data.user?.id) {
            setRegisteredUserId(res.data.user.id);
          }
          if (res.data.token) {
            setRegisteredUserToken(res.data.token);
          }
          setStep(3);
        }
      } catch (err) {
        setApiError(err.response?.data?.error || err.message || "OTP verification failed");
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (!file) {
        setFileError("NIC document is required");
        return;
      }

      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        await axiosInstance.post(`/users/${registeredUserId}/nic-upload`, formData, {
          headers: {
            'Authorization': `Bearer ${registeredUserToken}`
          }
        });

        alert("Registration Successful!");
        navigate('/login');
      } catch (err) {
        setApiError(err.response?.data?.error || err.message || "NIC upload failed");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h1>Create your account</h1>
          <p>Join Rentify to connect with trusted services and rentals.</p>
        </div>

        <div className="step-indicator">
          <div className={`step-dot ${step >= 1 ? 'completed' : ''}`}>1</div>
          <div className={`step-dot ${step >= 2 ? 'completed' : ''}`}>2</div>
          {watchRole === 'Provider' && (
            <div className={`step-dot ${step >= 3 ? 'active' : ''}`}>3</div>
          )}
        </div>

        {apiError && (
          <div className="alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-error)', backgroundColor: 'rgba(220, 53, 69, 0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius)', border: '1px solid rgba(220, 53, 69, 0.2)' }}>
            <ShieldAlert size={18} />
            <span>{typeof apiError === 'object' ? (apiError.message || JSON.stringify(apiError)) : String(apiError)}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>

          {/* STEP 1: Basic Info & Role */}
          {step === 1 && (
            <div className="step-content">
              <div className="form-group">
                <label className="form-label">I want to register as a:</label>
                <div className="role-selector">
                  <div
                    className={`role-option ${watchRole === 'Consumer' ? 'selected' : ''}`}
                    onClick={() => setValue('role', 'Consumer')}
                  >
                    <User size={24} color={watchRole === 'Consumer' ? 'var(--color-primary-blue)' : 'var(--color-slate-gray)'} />
                    <span className="role-title">Consumer</span>
                    <span className="role-desc">Book services & rent items</span>
                  </div>
                  <div
                    className={`role-option ${watchRole === 'Provider' ? 'selected' : ''}`}
                    onClick={() => setValue('role', 'Provider')}
                  >
                    <Briefcase size={24} color={watchRole === 'Provider' ? 'var(--color-primary-blue)' : 'var(--color-slate-gray)'} />
                    <span className="role-title">Provider</span>
                    <span className="role-desc">Offer my services/items</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  className={`form-input ${errors.fullName ? 'error' : ''}`}
                  placeholder="Sasundul Wanasinghe"
                  {...register("fullName")}
                />
                {errors.fullName && <span className="error-message">{errors.fullName.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mobile">Mobile Number</label>
                <input
                  type="tel"
                  id="mobile"
                  className={`form-input ${errors.mobile ? 'error' : ''}`}
                  placeholder="+94 7X XXX XXXX"
                  {...register("mobile")}
                />
                {errors.mobile && <span className="error-message">{errors.mobile.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="sasuduln@gmail.com"
                  {...register("email")}
                />
                {errors.email && <span className="error-message">{errors.email.message}</span>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  className={`form-input ${errors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                  {...register("password")}
                />

                <div className="password-strength">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className="strength-bar"
                      style={{
                        backgroundColor: passwordStrength >= level
                          ? getStrengthColor(passwordStrength)
                          : 'var(--color-light-platinum)'
                      }}
                    />
                  ))}
                </div>
                <span className="strength-text" style={{ color: getStrengthColor(passwordStrength) }}>
                  {getStrengthLabel(passwordStrength)}
                </span>

                {errors.password && <span className="error-message">{errors.password.message}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <Loader2 className="spinner" size={18} /> : (
                  <>Continue <ArrowRight size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /></>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: OTP Verification */}
          {step === 2 && (
            <div className="step-content otp-container">
              <h3 style={{ marginBottom: '1rem', color: 'var(--color-primary-navy)' }}>Verify Mobile Number</h3>
              <p style={{ color: 'var(--color-slate-gray)', marginBottom: '2rem', fontSize: '0.9rem' }}>
                We sent a 6-digit code to <strong>{watch("mobile")}</strong>. <br />
                It expires in {formatTime(countdown)}.
              </p>

              <div className="form-group" style={{ width: '100%' }}>
                <input
                  type="text"
                  className={`form-input otp-input ${errors.otp ? 'error' : ''}`}
                  placeholder="------"
                  maxLength={6}
                  autoFocus
                  {...register("otp")}
                />
                {errors.otp && <span className="error-message">{errors.otp.message}</span>}
              </div>

              <div className="otp-actions">
                Didn't receive the code? <br />
                <button
                  type="button"
                  className="resend-btn"
                  disabled={resendCooldown > 0}
                  onClick={handleResendOTP}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>

              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Back
                </button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? <Loader2 className="spinner" size={18} /> : (
                    <>Verify <CheckCircle2 size={18} style={{ verticalAlign: 'middle', marginLeft: '4px' }} /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: NIC Upload */}
          {step === 3 && (
            <div className="step-content">
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--color-primary-navy)' }}>Identity Verification</h3>
              <p style={{ color: 'var(--color-slate-gray)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                To build trust in our community, we require a valid National Identity Card (NIC).
              </p>

              <div className="form-group">
                <label className="form-label">Upload NIC Document</label>

                {!file ? (
                  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    <UploadCloud className="dropzone-icon" size={48} />
                    <p className="dropzone-text">
                      {isDragActive ? "Drop the file here..." : "Drag & drop your NIC file here"}
                    </p>
                    <p className="dropzone-subtext">or click to browse (JPG, PNG, PDF up to 5MB)</p>
                  </div>
                ) : (
                  <div className="file-preview">
                    <div className="file-info">
                      <FileText size={24} color="var(--color-primary-blue)" />
                      <div>
                        <span style={{ display: 'block', fontWeight: 500 }}>{file.name}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-slate-gray)' }}>
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <button type="button" className="remove-file-btn" onClick={() => setFile(null)}>
                      <X size={20} />
                    </button>
                  </div>
                )}

                {fileError && <span className="error-message">{fileError}</span>}
              </div>

              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '2rem' }}>
                <button type="button" className="btn-secondary" onClick={handlePrevStep}>
                  <ArrowLeft size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Back
                </button>
                <button type="submit" className="btn-primary">
                  Complete Registration
                </button>
              </div>
            </div>
          )}
        </form>

        {step === 1 && (
          <div className="login-link">
            Already have an account? <Link to="/login">Log in here</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
