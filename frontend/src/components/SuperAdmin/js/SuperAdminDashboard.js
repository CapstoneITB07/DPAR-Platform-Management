import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/SuperAdminDashboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faUserShield, faDatabase, faFileAlt, 
  faCheckCircle, faExclamationTriangle, faChartLine,
  faServer, faShieldAlt, faHistory, faBell, faBullhorn,
  faGraduationCap, faGlobe
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';
import { useNavigate } from 'react-router-dom';

function SuperAdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const [overviewRes, healthRes] = await Promise.all([
        axiosInstance.get(`${API_BASE}/api/superadmin/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axiosInstance.get(`${API_BASE}/api/superadmin/overview`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setOverview(overviewRes.data);
      setSystemHealth(overviewRes.data.system_health);
      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="superadmin-dashboard">
          <div className="sa-loading">Loading dashboard...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="superadmin-dashboard">
        <div className="sa-dashboard-header">
          <h1 className="sa-dashboard-title">
            <FontAwesomeIcon icon={faShieldAlt} /> System Control Center
          </h1>
          <p className="sa-dashboard-subtitle">Platform Management & Monitoring</p>
        </div>

        {error && <div className="sa-error-message">{error}</div>}

        {/* System Health Status */}
        {systemHealth && (
          <div className={`sa-health-banner ${systemHealth.status}`}>
            <FontAwesomeIcon icon={faServer} />
            <div>
              <strong>System Status:</strong> {systemHealth.status.toUpperCase()}
              {systemHealth.checks && (
                <div className="sa-health-checks">
                  Database: {systemHealth.checks.database} | 
                  Storage: {systemHealth.checks.storage} | 
                  Cache: {systemHealth.checks.cache}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="sa-stats-grid">
          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/users')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.total_users || 0}</h3>
              <p>Total Users</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/head-admins')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #16213e 0%, #0f3460 100%)' }}>
              <FontAwesomeIcon icon={faUserShield} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.head_admins || 0}</h3>
              <p>Head Admins</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/associate-groups')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #0f3460 0%, #0a2642 100%)' }}>
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.associate_groups || 0}</h3>
              <p>Associate Groups</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/pending-applications')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)' }}>
              <FontAwesomeIcon icon={faFileAlt} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.pending_applications || 0}</h3>
              <p>Pending Applications</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/system-logs')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)' }}>
              <FontAwesomeIcon icon={faCheckCircle} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.total_reports || 0}</h3>
              <p>Total Reports</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/system-logs')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)' }}>
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.pending_reports || 0}</h3>
              <p>Pending Reports</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/notifications')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)' }}>
              <FontAwesomeIcon icon={faBell} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.total_notifications || 0}</h3>
              <p>Notifications</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/announcements')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)' }}>
              <FontAwesomeIcon icon={faBullhorn} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.total_announcements || 0}</h3>
              <p>Announcements</p>
            </div>
          </div>

          <div className="sa-stat-card clickable" onClick={() => navigate('/superadmin/training-programs')}>
            <div className="sa-stat-icon" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #e0a800 100%)' }}>
              <FontAwesomeIcon icon={faGraduationCap} />
            </div>
            <div className="sa-stat-content">
              <h3>{overview?.total_training_programs || 0}</h3>
              <p>Training Programs</p>
            </div>
          </div>
        </div>

        {/* Citizen Monitoring Section */}
        <div className="sa-citizen-monitoring">
          <h2 className="sa-section-title">
            <FontAwesomeIcon icon={faGlobe} /> Citizen Platform Monitoring
          </h2>
          <div className="sa-citizen-info">
            <p>The citizen-facing platform is publicly accessible and provides disaster preparedness information, announcements, and training programs to the general public.</p>
            <div className="sa-citizen-links">
              <button 
                className="sa-citizen-link"
                onClick={() => navigate('/superadmin/citizen-monitoring')}
              >
                <FontAwesomeIcon icon={faChartLine} />
                View Analytics & Monitoring
              </button>
              <a 
                href={(() => {
                  const hostname = window.location.hostname;
                  // Replace current subdomain with 'citizen' subdomain
                  if (hostname.includes('.')) {
                    const parts = hostname.split('.');
                    // If first part looks like a subdomain (not a TLD), replace it
                    if (parts.length > 2) {
                      // Has subdomain: superadmin.dparvc.com -> citizen.dparvc.com
                      parts[0] = 'citizen';
                      return `https://${parts.join('.')}/citizen`;
                    } else {
                      // No subdomain: dparvc.com -> citizen.dparvc.com
                      return `https://citizen.${hostname}/citizen`;
                    }
                  }
                  // Fallback for localhost or if no subdomain
                  return 'https://citizen.dparvc.com/citizen';
                })()}
                target="_blank" 
                rel="noopener noreferrer" 
                className="sa-citizen-link-secondary"
              >
                <FontAwesomeIcon icon={faGlobe} />
                View Citizen Portal
              </a>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="sa-quick-actions">
          <h2 className="sa-section-title">Quick Actions</h2>
          <div className="sa-actions-grid">
            <div className="sa-action-card" onClick={() => navigate('/superadmin/head-admins')}>
              <FontAwesomeIcon icon={faUserShield} />
              <h3>Manage Head Admins</h3>
              <p>Create, edit, or remove head admin accounts</p>
            </div>
            <div className="sa-action-card" onClick={() => navigate('/superadmin/database')}>
              <FontAwesomeIcon icon={faDatabase} />
              <h3>Database Management</h3>
              <p>View database statistics and manage data</p>
            </div>
            <div className="sa-action-card" onClick={() => navigate('/superadmin/system-logs')}>
              <FontAwesomeIcon icon={faHistory} />
              <h3>System Logs</h3>
              <p>Monitor system activities and audit trails</p>
            </div>
            <div className="sa-action-card" onClick={() => navigate('/superadmin/system-health')}>
              <FontAwesomeIcon icon={faChartLine} />
              <h3>System Analytics</h3>
              <p>View platform performance metrics</p>
            </div>
            <div className="sa-action-card" onClick={() => navigate('/superadmin/notifications')}>
              <FontAwesomeIcon icon={faBell} />
              <h3>Manage Notifications</h3>
              <p>View and monitor all system notifications</p>
            </div>
            <div className="sa-action-card" onClick={() => navigate('/superadmin/announcements')}>
              <FontAwesomeIcon icon={faBullhorn} />
              <h3>Manage Announcements</h3>
              <p>View and manage platform announcements</p>
            </div>
            <div className="sa-action-card" onClick={() => navigate('/superadmin/training-programs')}>
              <FontAwesomeIcon icon={faGraduationCap} />
              <h3>Manage Training Programs</h3>
              <p>View and manage training programs</p>
            </div>
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

export default SuperAdminDashboard;

