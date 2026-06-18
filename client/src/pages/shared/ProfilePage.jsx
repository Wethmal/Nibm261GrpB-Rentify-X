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

  if (loading) return <div className="profile-loading">Loading profile...</div>;

  return (
    <div className="profile-dashboard">
      
      {/* Sidebar */}
      <aside className="profile-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">R</div>
          <span className="brand-text">Rentify</span>
        </div>
        
        <div className="sidebar-user-snippet">
          {avatar && avatar !== '/default-avatar.png' ? (
            <img src={getImageUrl(avatar)} alt="User avatar" className="snippet-avatar" />
          ) : (
            <div className="snippet-avatar placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#64748b' }}>
              <User size={24} />
            </div>
          )}
          <div className="snippet-info">
            <h4>{watch('full_name') || user?.name || 'User'}</h4>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link to="#" className="nav-item active"><User size={18}/> Profile</Link>
          <Link to="#" className="nav-item"><Bell size={18}/> Notifications</Link>
          <Link to="#" className="nav-item"><Shield size={18}/> Privacy & Security</Link>
          <Link to="#" className="nav-item"><CreditCard size={18}/> Billing</Link>
          <Link to="#" className="nav-item"><Star size={18}/> Reviews</Link>
          <Link to="#" className="nav-item"><List size={18}/> My Listings</Link>
          <button onClick={logout} className="nav-item sign-out"><LogOut size={18}/> Sign out</button>
        </nav>

        <div className="sidebar-completion">
          <div className="completion-header">
            <span>Profile completion</span>
          </div>
          <div className="completion-bar-bg">
            <div className="completion-bar-fill" style={{width: '72%'}}></div>
          </div>
          <div className="completion-footer">
            <span>72% — <Link to="#">what's missing?</Link></span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="profile-main">
        <form onSubmit={handleSubmit(onSubmit)} className="profile-form-container">
          
          {/* Topbar */}
          <header className="profile-topbar">
            <div className="topbar-title-section">
              <h1>Profile & Settings</h1>
              <p>Manage your public profile, privacy, and notification preferences.</p>
            </div>
            
            <div className="topbar-actions">
              {isDirty && (
                <div className="unsaved-badge">
                  <AlertCircle size={14} />
                  <span>Unsaved changes</span>
                </div>
              )}
              <button 
                type="button" 
                onClick={handleDiscard} 
                disabled={!isDirty} 
                className="btn-discard"
              >
                Discard
              </button>
              <button 
                type="submit" 
                disabled={!isDirty || isSubmitting} 
                className="btn-save"
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </header>

          {/* Alerts */}
          {error && <div className="profile-alert error">{typeof error === 'object' ? (error.message || JSON.stringify(error)) : String(error)}</div>}
          {successMsg && <div className="profile-alert success">{successMsg}</div>}

          {/* Grid Layout */}
          <div className="profile-grid">
            
            {/* Left Column */}
            <div className="profile-left-col">
              
              {/* Photo Card */}
              <div className="profile-card photo-card">
                <h3 className="card-heading">PROFILE PHOTO</h3>
                
                <div className="avatar-large-container">
                  {avatar && avatar !== '/default-avatar.png' ? (
                    <img src={getImageUrl(avatar)} alt="Profile Large" className="avatar-large" />
                  ) : (
                    <div className="avatar-large placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0', color: '#64748b' }}>
                      <User size={64} />
                    </div>
                  )}
                  <div className="avatar-badge"><Camera size={14}/></div>
                </div>

                <div 
                  className="drag-drop-zone" 
                  onClick={handleAvatarClick}
                >
                  <UploadCloud size={24} className="upload-icon" />
                  <h4>Drag photo here</h4>
                  <p>Auto-cropped to square - JPG, PNG - Max 5MB</p>
                  <button type="button" className="btn-browse">Browse files</button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }}
                    accept="image/jpeg, image/png, image/webp"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* Trust Score Card */}
              <div className="profile-card trust-score-card">
                <div className="trust-header">
                  <h3 className="card-heading trust-heading">TRUST SCORE</h3>
                  <div className="verified-badge">
                    <CheckCircle size={12} />
                    Verified
                  </div>
                </div>
                
                <div className="score-display">
                  <span className="score-main">4.7</span>
                  <span className="score-max">/ 5.00</span>
                </div>
                
                <div className="score-bars">
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                  <div className="bar active"></div>
                  <div className="bar inactive"></div>
                </div>

                <div className="trust-stats">
                  <div className="stat-item">
                    <Shield size={16} />
                    <span>Identity Verified</span>
                  </div>
                  <div className="stat-item">
                    <Star size={16} />
                    <span>142 reviews</span>
                  </div>
                  <div className="stat-item">
                    <List size={16} />
                    <span>286 completed bookings</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div className="profile-right-col">
              
              {/* Profile Information Card */}
              <div className="profile-card info-card">
                <h3 className="card-heading">PROFILE INFORMATION</h3>
                
                <div className="form-row split-2">
                  <div className="form-group">
                    <label>Full name</label>
                    <div className="input-wrapper">
                      <User size={16} className="input-icon" />
                      <input 
                        {...register('full_name')} 
                        className={`input-field has-icon ${errors.full_name ? 'error' : ''}`} 
                        placeholder="Ashan Perera"
                      />
                    </div>
                    {errors.full_name && <span className="error-text">{errors.full_name.message}</span>}
                  </div>
                  <div className="form-group">
                    <label>Display name</label>
                    <div className="input-wrapper">
                      <span className="input-addon">@</span>
                      <input 
                        {...register('display_name')} 
                        className={`input-field has-addon ${errors.display_name ? 'error' : ''}`} 
                        placeholder="ashan.p"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea 
                    {...register('bio')} 
                    className={`input-field textarea ${errors.bio ? 'error' : ''}`}
                    placeholder="Freelance photographer & videographer based in Colombo..."
                    rows={4}
                  ></textarea>
                  <div className="char-counter">
                    {bioContent.length} / 300
                  </div>
                  {errors.bio && <span className="error-text">{errors.bio.message}</span>}
                </div>

                <div className="form-group">
                  <div className="label-with-toggle">
                    <label>Address</label>
                    <div className="privacy-toggle">
                      <button 
                        type="button" 
                        className={`toggle-btn ${!visibility.address ? 'active' : ''}`}
                        onClick={() => toggleVisibility('address')}
                      >
                        <Lock size={12} /> Private
                      </button>
                      <button 
                        type="button" 
                        className={`toggle-btn ${visibility.address ? 'active public' : ''}`}
                        onClick={() => toggleVisibility('address')}
                      >
                        <Unlock size={12} /> Public
                      </button>
                    </div>
                  </div>
                  <input 
                    {...register('address')} 
                    className={`input-field ${errors.address ? 'error' : ''}`} 
                    placeholder="45 Flower Road, Colombo 07"
                  />
                  {errors.address && <span className="error-text">{errors.address.message}</span>}
                </div>

                <div className="form-group">
                  <div className="label-with-toggle">
                    <label>Contact number</label>
                    <div className="privacy-toggle">
                      <button 
                        type="button" 
                        className={`toggle-btn ${!visibility.mobile ? 'active' : ''}`}
                        onClick={() => toggleVisibility('mobile')}
                      >
                        <Lock size={12} /> Private
                      </button>
                      <button 
                        type="button" 
                        className={`toggle-btn ${visibility.mobile ? 'active public' : ''}`}
                        onClick={() => toggleVisibility('mobile')}
                      >
                        <Unlock size={12} /> Public
                      </button>
                    </div>
                  </div>
                  <input 
                    {...register('mobile')} 
                    className={`input-field ${errors.mobile ? 'error' : ''}`} 
                    placeholder="+94 077 123 4567"
                  />
                  {errors.mobile && <span className="error-text">{errors.mobile.message}</span>}
                </div>
              </div>

              {/* Notification Preferences Card */}
              <div className="profile-card notifications-card">
                <h3 className="card-heading">NOTIFICATION PREFERENCES</h3>
                <p className="card-subheading">Choose how and when we contact you.</p>
                
                <div className="notifications-table">
                  <div className="table-header">
                    <div className="col-event">Event</div>
                    <div className="col-check">In-App</div>
                    <div className="col-check">Email</div>
                    <div className="col-check">SMS</div>
                  </div>
                  
                  <div className="table-row">
                    <div className="col-event">New Bookings</div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.newBookings.inApp ? 'checked' : ''}`} onClick={() => toggleNotification('newBookings', 'inApp')}>
                        {notifications.newBookings.inApp && <CheckCircle size={14} />}
                      </div>
                    </div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.newBookings.email ? 'checked' : ''}`} onClick={() => toggleNotification('newBookings', 'email')}>
                        {notifications.newBookings.email && <CheckCircle size={14} />}
                      </div>
                    </div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.newBookings.sms ? 'checked' : ''}`} onClick={() => toggleNotification('newBookings', 'sms')}>
                        {notifications.newBookings.sms && <CheckCircle size={14} />}
                      </div>
                    </div>
                  </div>

                  <div className="table-row">
                    <div className="col-event">Messages</div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.messages.inApp ? 'checked' : ''}`} onClick={() => toggleNotification('messages', 'inApp')}>
                        {notifications.messages.inApp && <CheckCircle size={14} />}
                      </div>
                    </div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.messages.email ? 'checked' : ''}`} onClick={() => toggleNotification('messages', 'email')}>
                        {notifications.messages.email && <CheckCircle size={14} />}
                      </div>
                    </div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.messages.sms ? 'checked' : ''}`} onClick={() => toggleNotification('messages', 'sms')}>
                        {notifications.messages.sms && <CheckCircle size={14} />}
                      </div>
                    </div>
                  </div>

                  <div className="table-row">
                    <div className="col-event">Marketing Updates</div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.marketing.inApp ? 'checked' : ''}`} onClick={() => toggleNotification('marketing', 'inApp')}>
                        {notifications.marketing.inApp && <CheckCircle size={14} />}
                      </div>
                    </div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.marketing.email ? 'checked' : ''}`} onClick={() => toggleNotification('marketing', 'email')}>
                        {notifications.marketing.email && <CheckCircle size={14} />}
                      </div>
                    </div>
                    <div className="col-check">
                      <div className={`custom-checkbox ${notifications.marketing.sms ? 'checked' : ''}`} onClick={() => toggleNotification('marketing', 'sms')}>
                        {notifications.marketing.sms && <CheckCircle size={14} />}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="table-footer-text">Marketing messages are sent at most once per week. Unsubscribe any time.</p>
              </div>

            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ProfilePage;
