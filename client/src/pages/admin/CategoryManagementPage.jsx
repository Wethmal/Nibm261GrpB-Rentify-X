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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    try {
      if (editingCategory) {
        await axiosInstance.put(`/admin/categories/${editingCategory.id}`, formData);
        setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, ...formData } : c));
      } else {
        const response = await axiosInstance.post(`/admin/categories`, formData);
        setCategories([...categories, response.data]);
      }
      setIsModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await axiosInstance.delete(`/admin/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(c => 
    (c.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="category-management-page">
      <div className="page-header">
        <div>
          <h1>Category Management</h1>
          <p>Create, edit, and manage service and equipment categories.</p>
        </div>
        <button className="btn-add-category" onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Category
        </button>
      </div>

      <div className="admin-controls">
        <div className="search-bar" style={{ maxWidth: '100%' }}>
          <Search size={20} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search categories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="admin-loading">Loading categories...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="categories-list">
          {filteredCategories.length === 0 ? (
            <div className="empty-state">
              <Layers size={48} className="empty-icon text-gray-400" />
              <h3>No categories found</h3>
              <p>Add a new category to get started.</p>
            </div>
          ) : (
            filteredCategories.map(category => (
              <div key={category.id} className="category-card">
                <div className="category-info">
                  <div className="category-icon-wrapper">
                    <Tag size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3>{category.name}</h3>
                    <span className={`type-badge ${category.type}`}>
                      {category.type}
                    </span>
                  </div>
                </div>
                <div className="category-actions">
                  <button className="btn-icon btn-edit" onClick={() => handleOpenModal(category)}>
                    <Edit2 size={18} />
                  </button>
                  <button className="btn-icon btn-delete" onClick={() => handleDelete(category.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Category Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Category Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="service">Service</option>
                  <option value="equipment">Equipment</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoryManagementPage;
