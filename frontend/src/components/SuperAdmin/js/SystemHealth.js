import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/SystemHealth.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faCheckCircle, faTimesCircle, faServer, faDatabase, faHdd, faSync } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHealth(false);
    const interval = setInterval(() => fetchHealth(false), 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHealth = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealth(response.data.system_health);
      setError('');
    } catch (err) {
      setError('Failed to fetch system health');
      console.error('Error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchHealth(true);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return faCheckCircle;
      case 'warning': return faExclamationTriangle;
      case 'error': return faTimesCircle;
      default: return faExclamationTriangle;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'healthy': return '#28a745';
      case 'warning': return '#ffc107';
      case 'error': return '#dc3545';
      default: return '#999';
    }
  };

  if (loading && !health) {
    return (
      <SuperAdminLayout>
        <div className="sa-systemhealth-container">
          <div className="sa-systemhealth-loading">Loading system health...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-systemhealth-container">
        <div className="sa-systemhealth-page-header">
          <div>
            <h1><FontAwesomeIcon icon={faServer} /> System Health</h1>
            <p>Monitor database connectivity, storage capacity, and cache functionality</p>
          </div>
          <button 
            className="sa-systemhealth-btn-refresh" 
            onClick={handleRefresh}
            disabled={refreshing || loading}
          >
            <FontAwesomeIcon icon={faSync} spin={refreshing} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <div className="sa-systemhealth-error-message">{error}</div>}

        {health && (
          <>
            <div className={`sa-systemhealth-overall-status sa-systemhealth-status-${health.status}`}>
              <FontAwesomeIcon icon={getStatusIcon(health.status)} />
              <div>
                <h2>Overall System Status: {health.status.toUpperCase()}</h2>
                <p>Last checked: {new Date().toLocaleString()}</p>
              </div>
            </div>

            <div className="sa-systemhealth-checks-grid">
              <div className="sa-systemhealth-check-card">
                <div className="sa-systemhealth-check-header">
                  <FontAwesomeIcon icon={faDatabase} className="sa-systemhealth-check-icon" />
                  <h3>Database</h3>
                </div>
                <div className={`sa-systemhealth-check-status sa-systemhealth-status-${health.checks?.database || 'unknown'}`}>
                  <FontAwesomeIcon icon={getStatusIcon(health.checks?.database || 'unknown')} />
                  <span>{health.checks?.database || 'Unknown'}</span>
                </div>
              </div>

              <div className="sa-systemhealth-check-card">
                <div className="sa-systemhealth-check-header">
                  <FontAwesomeIcon icon={faHdd} className="sa-systemhealth-check-icon" />
                  <h3>Storage</h3>
                </div>
                <div className={`sa-systemhealth-check-status sa-systemhealth-status-${health.checks?.storage || 'unknown'}`}>
                  <FontAwesomeIcon icon={getStatusIcon(health.checks?.storage || 'unknown')} />
                  <span>{health.checks?.storage || 'Unknown'}</span>
                </div>
                {health.storage_details && (
                  <div className="sa-systemhealth-storage-details">
                    <div className="sa-systemhealth-disk-info">
                      <p><strong>Disk Usage:</strong> {health.storage_details.usage_percent}%</p>
                      <p><strong>Used Space:</strong> {health.storage_details.used_space_gb} GB / {health.storage_details.total_space_gb} GB</p>
                      <p><strong>Free Space:</strong> {health.storage_details.free_space_gb} GB</p>
                      <p className="sa-systemhealth-info-note">Includes all files: database, cache, logs, uploaded files, system files</p>
                    </div>
                    <div className="sa-systemhealth-storage-info">
                      <p><strong>Storage Directory Size:</strong> {health.storage_details.storage_size_gb} GB</p>
                      <p className="sa-systemhealth-info-note">Laravel storage folder: uploaded files, logs, backups, framework cache</p>
                    </div>
                    {health.storage_details.status === 'warning' && (
                      <p className="sa-systemhealth-warning-text">
                        ⚠️ <strong>Critical:</strong> Server disk space is running low (usage: {health.storage_details.usage_percent}% or free space: {health.storage_details.free_space_gb} GB). 
                        Consider cleaning up old files, logs, backups, or upgrading server storage.
                      </p>
                    )}
                    {health.storage_details.storage_warning && health.storage_details.status !== 'warning' && (
                      <p className="sa-systemhealth-info-text">
                        ℹ️ Storage directory size ({health.storage_details.storage_size_gb} GB) is large. Consider cleaning up old application files.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="sa-systemhealth-check-card">
                <div className="sa-systemhealth-check-header">
                  <FontAwesomeIcon icon={faServer} className="sa-systemhealth-check-icon" />
                  <h3>Cache</h3>
                </div>
                <div className={`sa-systemhealth-check-status sa-systemhealth-status-${health.checks?.cache || 'unknown'}`}>
                  <FontAwesomeIcon icon={getStatusIcon(health.checks?.cache || 'unknown')} />
                  <span>{health.checks?.cache || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default SystemHealth;

