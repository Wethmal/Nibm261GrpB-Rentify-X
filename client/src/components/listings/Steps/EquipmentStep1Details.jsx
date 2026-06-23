import React, { useState, useEffect } from 'react';
import { useFormContext, useFieldArray } from 'react-hook-form';
import axiosInstance from '../../../api/axiosInstance';

export default function EquipmentStep1Details() {
  const { register, control, formState: { errors } } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'specifications'
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        const equipment = res.data.filter(cat => cat.type === 'equipment');
        setCategories(equipment);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Equipment Details</h2>
      
      <div className="form-group">
        <label>Equipment Title *</label>
        <input 
          type="text" 
          placeholder="e.g. Sony Alpha a7 III Mirrorless Camera"
          {...register('title')}
        />
        {errors.title && <span className="error-msg">{errors.title.message}</span>}
      </div>

      <div className="form-group">
        <label>Category *</label>
        <select {...register('category')}>
          <option value="">Select an equipment category</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {errors.category && <span className="error-msg">{errors.category.message}</span>}
      </div>

