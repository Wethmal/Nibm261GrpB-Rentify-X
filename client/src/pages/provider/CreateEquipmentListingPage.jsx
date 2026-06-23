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

