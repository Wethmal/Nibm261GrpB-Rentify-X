import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import axiosInstance from '../../../api/axiosInstance';

const DISTRICTS = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

export default function Step4Preview() {
  const { register, getValues, formState: { errors } } = useFormContext();
  const values = getValues();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        setCategories(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const categoryName = categories.find(c => c.id === values.category)?.name || 'Category';

  // Handle the case where no photo is uploaded (e.g. if it was optional, but preview needs something)
  const coverImage = values.photos && values.photos.length > 0 
    ? values.photos[0].preview 
    : 'https://via.placeholder.com/600x400?text=No+Image+Provided';

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Review & Location</h2>
      
      <div className="form-group" style={{ marginBottom: '2rem' }}>
        <label>Service District *</label>
        <select {...register('district')}>
          <option value="">Select primary district</option>
          {DISTRICTS.map(dist => (
            <option key={dist} value={dist}>{dist}</option>
          ))}
        </select>
        {errors.district && <span className="error-msg">{errors.district.message}</span>}
      </div>

      <h3 style={{ marginBottom: '1rem', color: '#374151' }}>Listing Preview</h3>
      
      <div className="preview-card">
        <img src={coverImage} alt="Cover Preview" className="preview-cover" />
        
        <div className="preview-content">
          <span className="preview-category">{categoryName}</span>
          <h3 className="preview-title">{values.title || 'Your Title Here'}</h3>
          
          <p className="preview-desc">
            {values.description 
              ? (values.description.length > 150 ? values.description.substring(0, 150) + '...' : values.description)
              : 'Your description will appear here...'}
          </p>
          
          <div className="preview-details">
            <div>
              <span className="preview-price">LKR {values.price_per_unit || '0'}</span>
              <span className="preview-unit"> / {values.unit_label || 'session'}</span>
            </div>
            
            <div className="preview-district">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              {values.district || 'Select district'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
