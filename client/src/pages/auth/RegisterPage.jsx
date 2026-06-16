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
        
