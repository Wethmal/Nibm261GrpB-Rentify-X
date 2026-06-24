import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import axiosInstance from '../../../api/axiosInstance';

export default function Step1Details() {
  const { register, formState: { errors } } = useFormContext();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        const services = res.data.filter(cat => cat.type === 'service');
        setCategories(services);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Basic Details</h2>
      
      <div className="form-group">
        <label>Listing Title *</label>
        <input 
          type="text" 
          placeholder="e.g. Professional Plumbing Services"
          {...register('title')}
        />
        {errors.title && <span className="error-msg">{errors.title.message}</span>}
      </div>

      <div className="form-group">
        <label>Category *</label>
        <select {...register('category')}>
          <option value="">Select a category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.category && <span className="error-msg">{errors.category.message}</span>}
      </div>

      <div className="form-group">
        <label>Description *</label>
        <textarea 
          placeholder="Describe your service in detail..."
          {...register('description')}
        />
        {errors.description && <span className="error-msg">{errors.description.message}</span>}
      </div>

      <div className="form-group">
        <label>Tags (Optional)</label>
        <input 
          type="text" 
          placeholder="e.g. repair, fast, 24/7 (comma separated)"
          {...register('tags')}
        />
        <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>Help customers find you easier by adding relevant tags.</small>
      </div>
    </div>
  );
}
