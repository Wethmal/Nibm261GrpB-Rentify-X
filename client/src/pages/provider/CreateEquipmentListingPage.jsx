import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosInstance from '../../api/axiosInstance';
import './CreateListingPage.css';

// Step Components
import EquipmentStep1Details from '../../components/listings/Steps/EquipmentStep1Details';
import EquipmentStep2Pricing from '../../components/listings/Steps/EquipmentStep2Pricing';
import Step3Photos from '../../components/listings/Steps/Step3Photos';
import EquipmentStep4Preview from '../../components/listings/Steps/EquipmentStep4Preview';

// Zod schema for the equipment form
const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  price_per_unit: z.number({ invalid_type_error: 'Daily price must be a number' }).min(1, 'Daily price must be at least 1'),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' }).min(1, 'Quantity must be at least 1'),
  condition: z.string().min(1, 'Please select the equipment condition'),
  specifications: z.array(
    z.object({
      key: z.string().min(1, 'Key required'),
      value: z.string().min(1, 'Value required')
    })
  ).optional(),
  photos: z.array(z.any()).max(10, 'You can upload up to 10 photos').optional(),
  district: z.string().min(1, 'Please select a district')
});

const STEPS = [
  { id: 1, title: 'Details', fields: ['title', 'description', 'category', 'specifications'] },
  { id: 2, title: 'Pricing', fields: ['price_per_unit', 'quantity', 'condition'] },
  { id: 3, title: 'Photos', fields: ['photos'] },
  { id: 4, title: 'Preview', fields: ['district'] }
];

export default function CreateEquipmentListingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const methods = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      specifications: [],
      price_per_unit: 0,
      quantity: 1,
      condition: '',
      photos: [],
      district: ''
    },
    mode: 'onTouched'
  });

  const { trigger, getValues } = methods;

  const handleNext = async () => {
    // Validate current step fields before proceeding
    const fieldsToValidate = STEPS[currentStep - 1].fields;
    const isStepValid = await trigger(fieldsToValidate);
    
    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = async () => {
    const isValid = await trigger();
    if (!isValid) return;

    setIsSubmitting(true);
    setError('');

    try {
      const data = getValues();

      // 1. Create listing
      const res = await axiosInstance.post('/listings', {
        title: data.title,
        description: data.description,
        category_id: data.category,
        type: 'equipment',
        price_per_unit: Number(data.price_per_unit),
        unit_label: 'day', // Equipment is typically per day
        district: data.district,
        quantity: Number(data.quantity),
        condition: data.condition,
        specifications: data.specifications || []
      });

      const listingId = res.data.listingId;

      // 2. Upload photos if present
      if (data.photos && data.photos.length > 0) {
        const formData = new FormData();
        data.photos.forEach(file => {
          formData.append('photos', file);
        });

        await axiosInstance.post(`/listings/${listingId}/photos`, formData);
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="create-listing-page" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{ color: '#10b981', marginBottom: '1rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '1rem' }}>Listing Submitted!</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
          Your equipment listing is now pending approval. Our team will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="create-listing-page">
      <div className="create-listing-header">
        <h1>Create Equipment Listing</h1>
        <p>List your cameras, drones, tools for rental</p>
      </div>

      {error && (
        <div className="alert-error" style={{ marginBottom: '1.5rem', color: 'var(--color-error)', backgroundColor: 'rgba(220, 53, 69, 0.08)', padding: '0.75rem 1rem', borderRadius: 'var(--border-radius)', border: '1px solid rgba(220, 53, 69, 0.2)', fontSize: '0.95rem' }}>
          {error}
        </div>
      )}

      <div className="progress-indicator">
        <div 
          className="progress-bar" 
          style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
        />
        {STEPS.map(step => (
          <div 
            key={step.id} 
            className={`step-indicator ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
          >
            {currentStep > step.id ? '✓' : step.id}
          </div>
        ))}
      </div>

      <FormProvider {...methods}>
        <div className="step-container">
          {currentStep === 1 && <EquipmentStep1Details />}
          {currentStep === 2 && <EquipmentStep2Pricing />}
          {currentStep === 3 && <Step3Photos />}
          {currentStep === 4 && <EquipmentStep4Preview />}
        </div>
      </FormProvider>

      <div className="step-navigation">
        <button 
          className="btn btn-secondary" 
          onClick={handleBack} 
          disabled={currentStep === 1 || isSubmitting}
          style={{ opacity: currentStep === 1 ? 0 : 1 }}
        >
          Back
        </button>
        
        {currentStep < 4 ? (
          <button className="btn btn-primary" onClick={handleNext}>
            Continue
          </button>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Listing'}
          </button>
        )}
      </div>
    </div>
  );
}
