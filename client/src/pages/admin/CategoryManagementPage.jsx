import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  Plus, Edit2, Trash2, Tag, Layers, Search
} from 'lucide-react';
import './CategoryManagementPage.css';

function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'service' });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/admin/categories`);
      setCategories(response.data.categories || []);
    } catch (err) {
      setError('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({ name: category.name, type: category.type });
    } else {
      setEditingCategory(null);
      setFormData({ name: '', type: 'service' });
    }
    setIsModalOpen(true);
  };

