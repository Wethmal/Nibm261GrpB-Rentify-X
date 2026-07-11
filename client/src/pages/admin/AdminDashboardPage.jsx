import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { 
  Users, Activity, ShoppingBag, DollarSign, 
  CheckCircle, AlertTriangle, ArrowRight, BarChart2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import BarChart from '../../components/common/BarChart';
import '../../components/common/features.css';
import './AdminDashboardPage.css';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/admin/analytics');
        setStats(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="admin-loading">Loading Dashboard...</div>;
  if (error) return <div className="admin-error">Error: {error}</div>;

  const totalUsers = stats?.usersByRole?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;
  const totalListings = stats?.listingsByType?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;
  const totalBookings = stats?.bookingsByStatus?.reduce((acc, curr) => acc + Number(curr.count), 0) || 0;

