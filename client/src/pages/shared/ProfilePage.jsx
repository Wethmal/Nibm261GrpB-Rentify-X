import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../hooks/useAuth';
import { 
  Camera, Lock, Unlock, Shield, Star, AlertCircle, Save, 
  User, Bell, CreditCard, List, LogOut, UploadCloud, CheckCircle, XCircle 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './ProfilePage.css';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  bio: z.string().max(300, 'Bio must be less than 300 characters').optional().nullable(),
  address: z.string().optional().nullable(),
  mobile: z.string().optional().nullable().refine(
    val => !val || /^(?:\+94|0)7\d{8}$/.test(val),
    { message: 'Invalid Sri Lanka mobile number' }
  ),
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [avatar, setAvatar] = useState('/default-avatar.png');
  const [trustScore, setTrustScore] = useState(0);
  const [visibility, setVisibility] = useState({ mobile: false, address: false });
  const [notifications, setNotifications] = useState({
    newBookings: { inApp: true, email: true, sms: true },
    messages: { inApp: true, email: false, sms: true },
    marketing: { inApp: false, email: false, sms: false }
  });
  
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty, isSubmitting }
  } = useForm({
    resolver: zodResolver(profileSchema),
  });

  const bioContent = watch('bio') || '';



  // Prompt before unload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/users/me');
        const data = response.data;
        
        reset({
          full_name: data.full_name || '',
          bio: data.bio || '',
          address: data.address || '',
          mobile: data.mobile || '',
        });
        
        if (data.profile_photo_url) setAvatar(data.profile_photo_url);
        if (data.trust_score !== undefined) setTrustScore(data.trust_score);
        if (data.visibility_settings) setVisibility(data.visibility_settings);
        
      } catch (err) {
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [reset]);

  const onSubmit = async (data) => {
    try {
      setError(null);
      setSuccessMsg(null);
      await axiosInstance.put(`/users/${user.id}`, {
        ...data,
        visibility_settings: visibility
      });
      // reset isDirty state
      reset(data);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Discard unsaved changes?')) {
      reset();
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Please select a valid image (JPEG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    try {
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axiosInstance.post(`/users/${user.id}/avatar`, formData);
      
      setAvatar(response.data.url);
      setSuccessMsg('Avatar uploaded successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('Failed to upload avatar.');
    }
  };

  const toggleVisibility = (field) => {
    setVisibility(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleNotification = (type, channel) => {
    setNotifications(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel]
      }
    }));
  };

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    // Extract base URL from VITE_API_BASE_URL (remove /api/v1)
    const baseUrl = import.meta.env.VITE_API_BASE_URL 
      ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') 
      : 'http://localhost:5000';
    return `${baseUrl}${url}`;
  };

