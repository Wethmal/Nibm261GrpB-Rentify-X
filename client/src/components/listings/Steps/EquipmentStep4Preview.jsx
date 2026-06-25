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

export default function EquipmentStep4Preview() {
  const { register, watch, formState: { errors } } = useFormContext();
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
  
  // Watch fields to render dynamic preview card
  const title = watch('title');
  const description = watch('description');
  const category = watch('category');
  const price = watch('price_per_unit');
  const quantity = watch('quantity');
  const condition = watch('condition');
  const specifications = watch('specifications') || [];
  const photos = watch('photos') || [];
  const district = watch('district');

  const coverPhoto = photos.length > 0 ? photos[0].preview : null;
  const categoryName = categories.find(c => c.id === category)?.name || 'Category';

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Location & Final Preview</h2>

      <div className="form-group">
        <label>District *</label>
        <select {...register('district')}>
          <option value="">Select listing location (District)</option>
          {DISTRICTS.map(dist => (
            <option key={dist} value={dist}>{dist}</option>
          ))}
        </select>
        {errors.district && <span className="error-msg">{errors.district.message}</span>}
      </div>

      <h3 style={{ margin: '2rem 0 1rem', color: '#374151' }}>Listing Preview</h3>
      
      <div className="preview-card">
        {coverPhoto ? (
          <img src={coverPhoto} alt="Cover Preview" className="preview-cover" />
        ) : (
          <div className="preview-cover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', color: '#64748b' }}>
            No image uploaded yet
          </div>
        )}

        <div className="preview-content">
          <span className="preview-category">{categoryName}</span>
          <h4 className="preview-title">{title || 'Untitled Equipment Listing'}</h4>
          <p className="preview-desc">{description || 'No description provided.'}</p>
          
          <div style={{ marginBottom: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#334155' }}>
              Condition: <span style={{ fontWeight: 500, color: '#475569', textTransform: 'capitalize' }}>{condition || 'Not specified'}</span>
            </p>
            <p style={{ margin: '0 0 0.5rem', fontWeight: 600, color: '#334155' }}>
              Quantity Available: <span style={{ fontWeight: 500, color: '#475569' }}>{quantity || 1}</span>
            </p>
            
            {specifications.length > 0 && specifications.some(spec => spec.key && spec.value) && (
              <div>
                <p style={{ margin: '0 0 0.25rem', fontWeight: 600, color: '#334155' }}>Specifications:</p>
                <ul style={{ margin: 0, paddingLeft: '1.25rem', color: '#475569' }}>
                  {specifications.map((spec, i) => (
                    spec.key && spec.value && (
                      <li key={i}>{spec.key}: {spec.value}</li>
                    )
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="preview-details">
            <span className="preview-price">
              LKR {price || 0} <span className="preview-unit">/ day</span>
            </span>
            {district && (
              <span className="preview-district">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ display: 'inline', width: '18px', height: '18px', marginRight: '4px', verticalAlign: 'text-bottom' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                {district}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
