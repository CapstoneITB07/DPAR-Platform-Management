import React, { useState, useEffect } from 'react';
import SuperAdminLayout from './SuperAdminLayout';
import '../css/CitizenMonitoring.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faGlobe, faChartLine, faEye, faUsers, faCalendar,
  faBullhorn, faGraduationCap, faArrowUp, faArrowDown,
  faSearch, faChevronDown, faChevronUp
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../../utils/axiosConfig';
import { API_BASE } from '../../../utils/url';

function CitizenMonitoring() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [announcementLimit, setAnnouncementLimit] = useState(10);
  const [trainingLimit, setTrainingLimit] = useState(10);
  const [announcementSearch, setAnnouncementSearch] = useState('');
  const [trainingSearch, setTrainingSearch] = useState('');
  const [cleaningUp, setCleaningUp] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [days, announcementLimit, trainingLimit]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.get(`${API_BASE}/api/superadmin/citizen-analytics?days=${days}&announcement_limit=${announcementLimit}&training_limit=${trainingLimit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateFull = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleCleanup = async () => {
    if (!window.confirm('This will permanently delete analytics data older than 1 year. Continue?')) {
      return;
    }

    try {
      setCleaningUp(true);
      const token = localStorage.getItem('authToken');
      const response = await axiosInstance.post(`${API_BASE}/api/superadmin/citizen-analytics/cleanup`, 
        { days_to_keep: 365 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Cleanup completed. Deleted ${response.data.deleted_count} old records.`);
      fetchAnalytics();
    } catch (err) {
      alert('Failed to cleanup old data');
      console.error('Error:', err);
    } finally {
      setCleaningUp(false);
    }
  };

  if (loading) {
    return (
      <SuperAdminLayout>
        <div className="sa-citizenmonitoring-container">
          <div className="sa-citizenmonitoring-loading">Loading analytics...</div>
        </div>
      </SuperAdminLayout>
    );
  }

  return (
    <SuperAdminLayout>
      <div className="sa-citizenmonitoring-container">
        <div className="sa-citizenmonitoring-page-header">
          <div>
            <h1>
              <FontAwesomeIcon icon={faGlobe} /> Citizen Platform Monitoring
            </h1>
            <p>Track and analyze citizen engagement with the public platform</p>
          </div>
        </div>

        {error && <div className="sa-citizenmonitoring-error-message">{error}</div>}

        {/* Period Selector */}
        <div className="sa-citizenmonitoring-period-selector">
          <label>View Analytics for:</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
            <option value={365}>Last year</option>
          </select>
          <div className="sa-citizenmonitoring-data-info">
            <small>Data is automatically filtered by selected period.</small>
            <button 
              className="sa-citizenmonitoring-cleanup-btn"
              onClick={handleCleanup}
              disabled={cleaningUp}
              title="Delete analytics data older than 1 year"
            >
              {cleaningUp ? 'Cleaning...' : 'Cleanup Old Data'}
            </button>
          </div>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="sa-citizenmonitoring-summary-cards">
              <div className="sa-citizenmonitoring-summary-card">
                <div className="sa-citizenmonitoring-summary-icon" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
                  <FontAwesomeIcon icon={faEye} />
                </div>
                <div className="sa-citizenmonitoring-summary-content">
                  <h3>{formatNumber(analytics.total_views || 0)}</h3>
                  <p>Total Page Views</p>
                </div>
              </div>

              <div className="sa-citizenmonitoring-summary-card">
                <div className="sa-citizenmonitoring-summary-icon" style={{ background: 'linear-gradient(135deg, #17a2b8 0%, #138496 100%)' }}>
                  <FontAwesomeIcon icon={faUsers} />
                </div>
                <div className="sa-citizenmonitoring-summary-content">
                  <h3>{formatNumber(analytics.unique_visitors || 0)}</h3>
                  <p>Unique Visitors</p>
                </div>
              </div>

              <div className="sa-citizenmonitoring-summary-card">
                <div className="sa-citizenmonitoring-summary-icon" style={{ background: 'linear-gradient(135deg, #28a745 0%, #218838 100%)' }}>
                  <FontAwesomeIcon icon={faChartLine} />
                </div>
                <div className="sa-citizenmonitoring-summary-content">
                  <h3>{analytics.daily_views && analytics.daily_views.length > 0 && analytics.period_days > 0
                    ? formatNumber(Math.round((analytics.total_views || 0) / analytics.period_days))
                    : 0}</h3>
                  <p>Average Daily Views</p>
                </div>
              </div>
            </div>

            {/* Page Views */}
            <div className="sa-citizenmonitoring-analytics-section">
              <h2 className="sa-citizenmonitoring-section-title">
                <FontAwesomeIcon icon={faGlobe} /> Page Views by Path
              </h2>
              <div className="sa-citizenmonitoring-page-views-list">
                {analytics.page_views && analytics.page_views.length > 0 ? (
                  analytics.page_views.map((item, idx) => (
                    <div key={idx} className="sa-citizenmonitoring-page-view-item">
                      <div className="sa-citizenmonitoring-page-path">{item.page_path}</div>
                      <div className="sa-citizenmonitoring-page-views-count">{formatNumber(item.views)} views</div>
                    </div>
                  ))
                ) : (
                  <div className="sa-citizenmonitoring-empty-state">No page views recorded</div>
                )}
              </div>
            </div>

            {/* Content Views */}
            <div className="sa-citizenmonitoring-content-views-grid">
              {/* Announcement Views */}
              <div className="sa-citizenmonitoring-analytics-section">
                <div className="sa-citizenmonitoring-section-header">
                  <div>
                    <h2 className="sa-citizenmonitoring-section-title">
                      <FontAwesomeIcon icon={faBullhorn} /> Top Announcements
                    </h2>
                    <p className="sa-citizenmonitoring-section-subtitle">
                      Showing top {analytics.announcement_views?.length || 0} most viewed announcements (default: 10, click "Show More" to see more)
                    </p>
                  </div>
                  <div className="sa-citizenmonitoring-section-controls">
                    <div className="sa-citizenmonitoring-search-box-small">
                      <FontAwesomeIcon icon={faSearch} />
                      <input
                        type="text"
                        placeholder="Search announcements..."
                        value={announcementSearch}
                        onChange={(e) => setAnnouncementSearch(e.target.value)}
                        style={{ width: '180px' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="sa-citizenmonitoring-content-views-list sa-citizenmonitoring-scrollable-list">
                  {analytics.announcement_views && analytics.announcement_views.length > 0 ? (
                    analytics.announcement_views
                      .filter(item => 
                        !announcementSearch || 
                        item.title?.toLowerCase().includes(announcementSearch.toLowerCase()) ||
                        item.content_id?.toString().includes(announcementSearch)
                      )
                      .map((item, idx) => (
                        <div key={idx} className="sa-citizenmonitoring-content-view-item">
                          <div className="sa-citizenmonitoring-content-rank">#{idx + 1}</div>
                          <div className="sa-citizenmonitoring-content-info">
                            <div className="sa-citizenmonitoring-content-title">{item.title || `Announcement ID: ${item.content_id}`}</div>
                            <div className="sa-citizenmonitoring-content-views">{formatNumber(item.views)} views</div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="sa-citizenmonitoring-empty-state">No announcement views</div>
                  )}
                </div>
                {analytics.announcement_views && analytics.announcement_views.length >= announcementLimit && (
                  <div className="sa-citizenmonitoring-load-more-section">
                    <button 
                      className="sa-citizenmonitoring-load-more-btn"
                      onClick={() => setAnnouncementLimit(prev => prev + 10)}
                    >
                      Show More ({announcementLimit} shown)
                    </button>
                  </div>
                )}
              </div>

              {/* Training Program Views */}
              <div className="sa-citizenmonitoring-analytics-section">
                <div className="sa-citizenmonitoring-section-header">
                  <div>
                    <h2 className="sa-citizenmonitoring-section-title">
                      <FontAwesomeIcon icon={faGraduationCap} /> Top Training Programs
                    </h2>
                    <p className="sa-citizenmonitoring-section-subtitle">
                      Showing top {analytics.training_program_views?.length || 0} most viewed training programs (default: 10, click "Show More" to see more)
                    </p>
                  </div>
                  <div className="sa-citizenmonitoring-section-controls">
                    <div className="sa-citizenmonitoring-search-box-small">
                      <FontAwesomeIcon icon={faSearch} />
                      <input
                        type="text"
                        placeholder="Search programs..."
                        value={trainingSearch}
                        onChange={(e) => setTrainingSearch(e.target.value)}
                        style={{ width: '180px' }}
                      />
                    </div>
                  </div>
                </div>
                <div className="sa-citizenmonitoring-content-views-list sa-citizenmonitoring-scrollable-list">
                  {analytics.training_program_views && analytics.training_program_views.length > 0 ? (
                    analytics.training_program_views
                      .filter(item => 
                        !trainingSearch || 
                        item.title?.toLowerCase().includes(trainingSearch.toLowerCase()) ||
                        item.content_id?.toString().includes(trainingSearch)
                      )
                      .map((item, idx) => (
                        <div key={idx} className="sa-citizenmonitoring-content-view-item">
                          <div className="sa-citizenmonitoring-content-rank">#{idx + 1}</div>
                          <div className="sa-citizenmonitoring-content-info">
                            <div className="sa-citizenmonitoring-content-title">{item.title || `Program ID: ${item.content_id}`}</div>
                            <div className="sa-citizenmonitoring-content-views">{formatNumber(item.views)} views</div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="sa-citizenmonitoring-empty-state">No training program views</div>
                  )}
                </div>
                {analytics.training_program_views && analytics.training_program_views.length >= trainingLimit && (
                  <div className="sa-citizenmonitoring-load-more-section">
                    <button 
                      className="sa-citizenmonitoring-load-more-btn"
                      onClick={() => setTrainingLimit(prev => prev + 10)}
                    >
                      Show More ({trainingLimit} shown)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Daily Views Chart */}
            {analytics.daily_views && analytics.daily_views.length > 0 && (
              <div className="sa-citizenmonitoring-analytics-section">
                <div className="sa-citizenmonitoring-section-header">
                  <div>
                    <h2 className="sa-citizenmonitoring-section-title">
                      <FontAwesomeIcon icon={faCalendar} /> Daily Views Trend
                    </h2>
                    <p className="sa-citizenmonitoring-chart-description">
                      Shows the number of page views per day over the selected period. Helps identify peak engagement days and traffic patterns.
                    </p>
                  </div>
                </div>
                <div className="sa-citizenmonitoring-daily-views-chart">
                  {analytics.daily_views.map((item, idx) => {
                    const maxViews = Math.max(...analytics.daily_views.map(d => d.views));
                    const height = maxViews > 0 ? (item.views / maxViews) * 100 : 0;
                    return (
                      <div key={idx} className="sa-citizenmonitoring-chart-bar-container">
                        <div className="sa-citizenmonitoring-chart-value-above">{item.views}</div>
                        <div 
                          className="sa-citizenmonitoring-chart-bar" 
                          style={{ 
                            height: `calc(${height}% - 30px)`,
                            maxHeight: 'calc(100% - 30px)'
                          }}
                        ></div>
                        <div className="sa-citizenmonitoring-chart-label">{formatDate(item.date)}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="sa-citizenmonitoring-chart-footer">
                  <small>Dates are displayed from oldest to newest (left to right)</small>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SuperAdminLayout>
  );
}

export default CitizenMonitoring;

