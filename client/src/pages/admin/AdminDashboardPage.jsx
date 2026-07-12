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

  return (
    <div className="admin-dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>Platform analytics, revenue, and key performance indicators.</p>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue"><Users /></div>
          <div className="kpi-info">
            <h3>Total Users</h3>
            <p className="kpi-value">{totalUsers}</p>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon green"><ShoppingBag /></div>
          <div className="kpi-info">
            <h3>Total Listings</h3>
            <p className="kpi-value">{totalListings}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon purple"><Activity /></div>
          <div className="kpi-info">
            <h3>Total Bookings</h3>
            <p className="kpi-value">{totalBookings}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon gold"><DollarSign /></div>
          <div className="kpi-info">
            <h3>Total Revenue</h3>
            <p className="kpi-value">Rs. {Number(stats?.totalRevenue || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon blue"><CheckCircle /></div>
          <div className="kpi-info">
            <h3>Active Users</h3>
            <p className="kpi-value">{stats?.activeUsers ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="action-card" style={{ marginBottom: '1.5rem' }}>
        <div className="action-header">
          <h3><BarChart2 className="icon-info" /> Bookings - last 30 days</h3>
        </div>
        <BarChart
          height={190}
          showEvery={5}
          data={(stats?.bookingsLast30Days || []).map((d) => ({ label: d.day.slice(5), value: d.bookings }))}
          valueFormatter={(v) => `${v} booking${v === 1 ? '' : 's'}`}
          ariaLabel="Bookings created per day over the last 30 days"
        />
      </div>

      <div className="action-grid">
        <div className="action-card">
          <div className="action-header">
            <h3><AlertTriangle className="icon-warning" /> Pending Approvals</h3>
          </div>
          <div className="action-stats">
            <div className="stat-item">
              <span>Pending Providers</span>
              <strong>{stats?.pendingProviders || 0}</strong>
            </div>
            <div className="stat-item">
              <span>Pending Listings</span>
              <strong>{stats?.pendingListings || 0}</strong>
            </div>
          </div>
          <div className="action-links">
            <Link to="/admin/provider-approvals" className="btn-action">
              Review Providers <ArrowRight size={16}/>
            </Link>
            <Link to="/admin/listing-moderation" className="btn-action">
              Review Listings <ArrowRight size={16}/>
            </Link>
          </div>
        </div>

        <div className="action-card">
          <div className="action-header">
            <h3><BarChart2 className="icon-info" /> Platform Data</h3>
          </div>
          <div className="action-stats breakdown-stats">
             {stats?.usersByRole?.map((role) => (
                <div key={role.role} className="stat-item">
                  <span style={{textTransform: 'capitalize'}}>{role.role}s</span>
                  <strong>{role.count}</strong>
                </div>
             ))}
          </div>
          <div className="action-links">
            <Link to="/admin/users" className="btn-action">
              Manage Users <ArrowRight size={16}/>
            </Link>
            <Link to="/admin/categories" className="btn-action">
              Manage Categories <ArrowRight size={16}/>
            </Link>
            <Link to="/admin/reports" className="btn-action">
              Reported Users <ArrowRight size={16}/>
            </Link>
            <Link to="/admin/nic-verification" className="btn-action">
              NIC Verification <ArrowRight size={16}/>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
