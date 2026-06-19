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

