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

export default function Step4Preview() {
  const { register, getValues, formState: { errors } } = useFormContext();
  const values = getValues();
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

  const categoryName = categories.find(c => c.id === values.category)?.name || 'Category';

  // Handle the case where no photo is uploaded (e.g. if it was optional, but preview needs something)
  const coverImage = values.photos && values.photos.length > 0 
    ? values.photos[0].preview 
    : 'https://via.placeholder.com/600x400?text=No+Image+Provided';

