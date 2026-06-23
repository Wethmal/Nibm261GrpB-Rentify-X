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
      
