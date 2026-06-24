import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step2Pricing() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Pricing Structure</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="form-group">
          <label>Price (LKR) *</label>
          <input 
            type="number" 
            placeholder="0.00"
            {...register('price_per_unit', { valueAsNumber: true })}
          />
          {errors.price_per_unit && <span className="error-msg">{errors.price_per_unit.message}</span>}
        </div>

        <div className="form-group">
          <label>Unit *</label>
          <select {...register('unit_label')}>
            <option value="per session">per session</option>
            <option value="per hour">per hour</option>
            <option value="per day">per day</option>
            <option value="per item">per item</option>
            <option value="fixed price">fixed price</option>
          </select>
          {errors.unit_label && <span className="error-msg">{errors.unit_label.message}</span>}
        </div>
      </div>
      
      <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', color: '#1e40af', marginTop: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Pro Tip:</h4>
        <p style={{ margin: 0, fontSize: '0.9rem' }}>
          Clear pricing helps you attract serious clients. If your service price varies, set a base price and use "fixed price", then elaborate in your description.
        </p>
      </div>
    </div>
  );
}
