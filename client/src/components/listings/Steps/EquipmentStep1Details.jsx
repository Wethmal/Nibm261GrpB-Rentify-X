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

      <div className="form-group">
        <label>Description *</label>
        <textarea 
          placeholder="Describe your equipment in detail (condition features, accessories included, etc.)..."
          {...register('description')}
        />
        {errors.description && <span className="error-msg">{errors.description.message}</span>}
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Specifications (Optional)</span>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={() => append({ key: '', value: '' })}
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', borderRadius: '6px' }}
          >
            + Add Spec
          </button>
        </label>
        
        {fields.map((field, index) => (
          <div key={field.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <input 
              type="text" 
              placeholder="e.g. Brand" 
              {...register(`specifications.${index}.key`)}
              style={{ flex: 1 }}
            />
            <input 
              type="text" 
              placeholder="e.g. Sony" 
              {...register(`specifications.${index}.value`)}
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              onClick={() => remove(index)}
              style={{
                background: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                borderRadius: '6px',
                width: '38px',
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              🗑️
            </button>
          </div>
        ))}
        {errors.specifications && <span className="error-msg">{errors.specifications.message}</span>}
      </div>
    </div>
  );
}
