import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axiosInstance from '../../api/axiosInstance';
import './CreateListingPage.css';

// Step Components
import Step1Details from '../../components/listings/Steps/Step1Details';
import Step2Pricing from '../../components/listings/Steps/Step2Pricing';
import Step3Photos from '../../components/listings/Steps/Step3Photos';
import Step4Preview from '../../components/listings/Steps/Step4Preview';

// Zod schema for the entire form
const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title cannot exceed 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().min(1, 'Please select a category'),
  tags: z.string().optional(),
  price_per_unit: z.number().min(1, 'Price must be at least 1'),
  unit_label: z.string().min(1, 'Please enter a unit label (e.g. per session)'),
  photos: z.array(z.any()).max(10, 'You can upload up to 10 photos').optional(),
  district: z.string().min(1, 'Please select a district')
});

const STEPS = [
  { id: 1, title: 'Details', fields: ['title', 'description', 'category', 'tags'] },
  { id: 2, title: 'Pricing', fields: ['price_per_unit', 'unit_label'] },
  { id: 3, title: 'Photos', fields: ['photos'] },
  { id: 4, title: 'Preview', fields: ['district'] }
];

export default function CreateListingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const methods = useForm({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      tags: '',
      price_per_unit: 0,
      unit_label: 'per session',
      photos: [],
      district: ''
    },
    mode: 'onTouched'
  });

