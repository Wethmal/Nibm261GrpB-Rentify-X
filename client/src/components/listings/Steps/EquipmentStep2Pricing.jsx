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

      <div className="form-group">
        <label>Quantity Available *</label>
        <input 
          type="number" 
          placeholder="e.g. 1"
          {...register('quantity', { valueAsNumber: true })}
        />
        {errors.quantity && <span className="error-msg">{errors.quantity.message}</span>}
      </div>

      <div className="form-group">
        <label>Condition *</label>
        <select {...register('condition')}>
          <option value="">Select equipment condition</option>
          <option value="new">New (Unused, original packaging)</option>
          <option value="good">Good (Slight wear, fully functional)</option>
          <option value="fair">Fair (Visible wear, fully functional)</option>
        </select>
        {errors.condition && <span className="error-msg">{errors.condition.message}</span>}
      </div>
    </div>
  );
}
