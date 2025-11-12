import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/Database.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faChartBar, faDownload, faSync } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function Database() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/database-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch database statistics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchStats(true);
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="sa-database-container">
          <div className="sa-database-loading">Loading database statistics...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  const statItems = stats ? [
    { label: 'Total Users', value: stats.users, icon: faChartBar, color: '#1a1a2e' },
    { label: 'Associate Groups', value: stats.associate_groups, icon: faChartBar, color: '#16213e' },
    { label: 'Applications', value: stats.pending_applications, icon: faChartBar, color: '#0f3460' },
    { label: 'Reports', value: stats.reports, icon: faChartBar, color: '#dc3545' },
    { label: 'Notifications', value: stats.notifications, icon: faChartBar, color: '#17a2b8' },
    { label: 'Announcements', value: stats.announcements, icon: faChartBar, color: '#28a745' },
    { label: 'Training Programs', value: stats.training_programs, icon: faChartBar, color: '#ffc107' },
    { label: 'Evaluations', value: stats.evaluations, icon: faChartBar, color: '#6f42c1' },
    { label: 'Activity Logs', value: stats.activity_logs, icon: faChartBar, color: '#20c997' },
    { label: 'Director Histories', value: stats.director_histories, icon: faChartBar, color: '#fd7e14' },
  ] : [];

  return (
    <SuperAdminLayout>
      <div className="sa-database-container">
        <div className="sa-database-page-header">
          <div>
            <h1><FontAwesomeIcon icon={faDatabase} /> Database Statistics</h1>
            <p>View comprehensive database metrics and record counts across all platform tables</p>
          </div>
          <button 
            className="sa-database-btn-refresh" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="sa-database-error-message">{error}</div>}

        <div className="sa-database-stats-grid">
          {statItems.map((item, index) => (
            <div key={index} className="sa-database-stat-card">
              <div className="sa-database-stat-icon" style={{ background: item.color }}>
                <FontAwesomeIcon icon={item.icon} />
              </div>
              <div className="sa-database-stat-content">
                <h3>{item.value.toLocaleString()}</h3>
                <p>{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="sa-database-info">
          <h2>Database Information</h2>
          <div className="sa-database-info-grid">
            <div className="sa-database-info-card">
              <h3>Total Records</h3>
              <p className="sa-database-info-value">
                {stats ? Object.values(stats).reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0).toLocaleString() : 0}
              </p>
            </div>
            <div className="sa-database-info-card">
              <h3>Last Updated</h3>
              <p className="sa-database-info-value">{new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

export default Database;

