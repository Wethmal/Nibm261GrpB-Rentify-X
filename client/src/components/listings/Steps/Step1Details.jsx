import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import axiosInstance from '../../../api/axiosInstance';

export default function Step1Details() {
  const { register, formState: { errors } } = useFormContext();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosInstance.get('/search/categories');
        const services = res.data.filter(cat => cat.type === 'service');
        setCategories(services);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchCategories();
  }, []);

