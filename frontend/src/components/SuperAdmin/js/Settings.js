import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/Settings.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faSave, faInfoCircle, faSync } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function Settings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    systemAlerts: true,
    autoBackup: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (err) {
      setError('Failed to load settings');
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    setError('');
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.put(
        `${API_BASE}/api/superadmin/settings`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setMessage('Settings saved successfully!');
      setSettings(response.data.settings ? {
        maintenanceMode: response.data.settings.maintenance_mode ?? settings.maintenanceMode,
        systemAlerts: response.data.settings.system_alerts ?? settings.systemAlerts,
        autoBackup: response.data.settings.auto_backup ?? settings.autoBackup,
      } : settings);
      
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings');
      console.error('Error saving settings:', err);
      setTimeout(() => setError(''), 5000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="sa-settings-container">
          <div className="sa-settings-loading">Loading settings...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-settings-container">
        <div className="sa-settings-page-header">
          <div>
            <h1><FontAwesomeIcon icon={faCog} /> System Settings</h1>
            <p>Configure system-wide settings and preferences</p>
          </div>
          <button 
            className="sa-settings-btn-refresh" 
            onClick={fetchSettings}
            disabled={loading || saving}
            title="Refresh settings"
          >
            <FontAwesomeIcon icon={faSync} spin={loading} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="sa-settings-error-message">{error}</div>
        )}

        {message && (
          <div className={`sa-settings-message ${message.includes('success') ? 'sa-settings-success' : 'sa-settings-error'}`}>
            {message}
          </div>
        )}

        <div className="sa-settings-sections">
          <div className="sa-settings-section">
            <h2>System Configuration</h2>
            <div className="sa-settings-item">
              <div className="sa-settings-info">
                <label>Maintenance Mode</label>
                <p>Enable to put the system in maintenance mode. Users will see a maintenance page.</p>
              </div>
              <label className="sa-settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                  disabled={saving}
                />
                <span className="sa-settings-slider"></span>
              </label>
            </div>
          </div>

          <div className="sa-settings-section">
            <h2>System Alerts</h2>
            <div className="sa-settings-item">
              <div className="sa-settings-info">
                <label>Enable System-Wide Alerts</label>
                <p>When enabled, you can send system-wide notifications to all users about maintenance, updates, or important announcements.</p>
                <small className="sa-settings-note">
                  <FontAwesomeIcon icon={faInfoCircle} /> <a href="/superadmin/system-alerts" style={{ color: '#1a1a2e', textDecoration: 'underline' }}>Manage System Alerts →</a>
                </small>
              </div>
              <label className="sa-settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.systemAlerts}
                  onChange={(e) => handleChange('systemAlerts', e.target.checked)}
                  disabled={saving}
                />
                <span className="sa-settings-slider"></span>
              </label>
            </div>
          </div>

          <div className="sa-settings-section">
            <h2>Backup & Recovery</h2>
            <div className="sa-settings-item">
              <div className="sa-settings-info">
                <label>Automatic Backups</label>
                <p>Enable automatic database backups. Your existing backup system will respect this setting.</p>
              </div>
              <label className="sa-settings-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoBackup}
                  onChange={(e) => handleChange('autoBackup', e.target.checked)}
                  disabled={saving}
                />
                <span className="sa-settings-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="sa-settings-actions">
          <button 
            className="sa-settings-btn-save" 
            onClick={handleSave} 
            disabled={saving || loading}
          >
            <FontAwesomeIcon icon={faSave} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

export default Settings;
