import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function EquipmentStep2Pricing() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Pricing & Inventory</h2>
      
      <div className="form-group">
        <label>Daily Rental Price (LKR) *</label>
        <input 
          type="number" 
          placeholder="e.g. 5000"
          {...register('price_per_unit', { valueAsNumber: true })}
        />
        {errors.price_per_unit && <span className="error-msg">{errors.price_per_unit.message}</span>}
      </div>

