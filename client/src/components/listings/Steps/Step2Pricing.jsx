import React from 'react';
import { useFormContext } from 'react-hook-form';

export default function Step2Pricing() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div className="step-content">
      <h2 style={{ marginBottom: '1.5rem', color: '#1f2937' }}>Pricing Structure</h2>
      
