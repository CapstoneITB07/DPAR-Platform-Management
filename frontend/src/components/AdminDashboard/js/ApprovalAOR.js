import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import '../css/ApprovalAOR.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faCheck, faBan } from '@fortawesome/free-solid-svg-icons';

const organizationLogos = {
  'AKLMV': '/Assets/AKLMV.png',
  'ALERT': '/Assets/ALERT.png',
  'CCVOL': '/Assets/CCVOL.png',
  'CRRG': '/Assets/CRRG.png',
  'DRRM-Y': '/Assets/DRRM - Y.png',
  'FRONTLINER': '/Assets/FRONTLINER.png',
  'JKM': '/Assets/JKM.png',
  'KAIC': '/Assets/KAIC.png',
  'MRAP': '/Assets/MRAP.png',
  'MSG-ERU': '/Assets/MSG - ERU.png',
  'PCGA 107th': '/Assets/PCGA 107th.png',
  'RMFB': '/Assets/RMFB.png',
  'SPAG': '/Assets/SPAG.png',
  'SRG': '/Assets/SRG.png',
  'TF': '/Assets/TF.png'
};

const API_BASE = 'http://localhost:8000';

const getLogoUrl = (logoPath) => {
  if (!logoPath) return `${window.location.origin}/Assets/disaster_logo.png`;
  
  if (logoPath.startsWith('logos/')) {
    return `${API_BASE}/storage/${logoPath}`;
  }
  
  if (logoPath.startsWith('/storage/')) {
    return `${API_BASE}${logoPath}`;
  }
  
  if (logoPath.startsWith('/Assets/')) {
    return `${window.location.origin}${logoPath}`;
  }
  
  return logoPath;
};

function ApprovalAOR() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE}/api/reports/submitted`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!response.data) {
        throw new Error('No data received from server');
      }

      // Fetch associate groups for each report
      const reportsWithGroups = await Promise.all(
        response.data.map(async (report) => {
          if (report.user_id) {
            try {
              const groupResponse = await axios.get(`${API_BASE}/api/associate-groups`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const associateGroup = groupResponse.data.find(group => group.user_id === report.user_id);
              return {
                ...report,
                data: {
                  ...report.data,
                  associateGroup
                }
              };
            } catch (error) {
              console.error('Error fetching associate group:', error);
              return report;
            }
          }
          return report;
        })
      );

      // Only show submitted reports
      const submittedReports = reportsWithGroups.filter(report => report.status === 'sent');
      setReports(submittedReports);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to load reports. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getOrganizationLogo = (report) => {
    try {
      // Get the organization from the report data
      const organization = report?.data?.organization;
      if (!organization) {
        console.log('No organization found in report data:', report);
        return `${window.location.origin}/Assets/disaster_logo.png`;
      }

      // First check if there's a logo in the associate group data
      const associateGroup = report?.data?.associateGroup;
      if (associateGroup?.logo) {
        return getLogoUrl(associateGroup.logo);
      }

      // Fallback to the predefined logos
      const logo = organizationLogos[organization];
      if (!logo) {
        console.log('No logo found for organization:', organization);
        return `${window.location.origin}/Assets/disaster_logo.png`;
      }
      
      return `${window.location.origin}${logo}`;
    } catch (error) {
      console.error('Error getting organization logo:', error);
      return `${window.location.origin}/Assets/disaster_logo.png`;
    }
  };

  const handleGenerateAOR = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`http://localhost:8000/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'AOR_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to generate AOR');
    }
  };

  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  const handlePreview = async (report) => {
    try {
      // Fetch the latest data for this report before showing the modal
      const token = localStorage.getItem('authToken');
      const reportResponse = await axios.get(`${API_BASE}/api/reports/${report.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch the latest associate group data
      if (reportResponse.data.user_id) {
        const groupResponse = await axios.get(`${API_BASE}/api/associate-groups`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const associateGroup = groupResponse.data.find(group => group.user_id === reportResponse.data.user_id);
        reportResponse.data.data = {
          ...reportResponse.data.data,
          associateGroup
        };
      }
      
      setSelectedReport(reportResponse.data);
    } catch (error) {
      console.error('Error fetching latest report data:', error);
      setSelectedReport(report);
    }
    setShowPreviewModal(true);
  };

  const handleApprove = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_BASE}/api/reports/${reportId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchReports(); // Refresh the list after approval
      setShowPreviewModal(false);
    } catch (err) {
      setError('Failed to approve report');
    }
  };

  const handleReject = async (reportId) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_BASE}/api/reports/${reportId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchReports(); // Refresh the list after rejection
      setShowPreviewModal(false);
    } catch (err) {
      setError('Failed to reject report');
    }
  };

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <AdminLayout>
      <div className="approval-aor-container">
        <div className="header-section">
          <h2>APPROVAL / AOR</h2>
          <button className="show-history-btn" onClick={handleShowHistory}>
            SHOW HISTORY
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="reports-grid">
            {reports.map(report => {
              const logoUrl = getOrganizationLogo(report);
              return (
                <div key={report.id} className="report-card">
                  <img 
                    src={logoUrl}
                    alt={report.user?.organization || 'Organization Logo'} 
                    className="org-logo"
                    onError={(e) => {
                      console.log('Failed to load logo:', e.target.src);
                      e.target.src = '/Assets/disaster_logo.png';
                    }}
                  />
                  <div className="report-info">
                    <span className="org-label">{report.user?.organization || 'ASSOCIATE'}</span>
                    <h3>{report.title}</h3>
                    <span className={`report-status ${report.status}`}>
                      {report.status.toUpperCase()}
                    </span>
                    <button className="see-more-btn" onClick={() => handlePreview(report)}>
                      SEE MORE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>After Operation Report History</h3>
                <button className="modal-close" onClick={() => setShowHistoryModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                {reports.map(report => (
                  <div key={report.id} className="history-item">
                    <img 
                      src={getOrganizationLogo(report)}
                      alt={report.user?.organization || 'Organization Logo'} 
                      className="history-logo"
                    />
                    <div className="history-info">
                      <h4 className="history-title">{report.title}</h4>
                      <p className="history-date">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button 
                      className="generate-btn"
                      onClick={() => handleGenerateAOR(report.id)}
                    >
                      <FontAwesomeIcon icon={faDownload} /> Generate AOR
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreviewModal && selectedReport && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <div className="preview-header">
                  <img 
                    src={getOrganizationLogo(selectedReport)}
                    alt={selectedReport.user?.organization || 'Organization Logo'} 
                    className="preview-org-logo"
                  />
                  <div className="preview-org-info">
                    <h4>{selectedReport.user?.organization || 'ASSOCIATE'}</h4>
                    <p>{selectedReport.title}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setShowPreviewModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                <div className="preview-content">
                  <div className="preview-details">
                    {Object.entries(selectedReport.data).map(([key, value]) => {
                      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);

                      if (key === 'activities' && typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="preview-field-group">
                            <strong>{formattedKey}:</strong>
                            <div className="activities-list">
                              {Object.entries(value).map(([activityKey, activityValue]) => (
                                <div key={activityKey} className="activity-item">
                                  <span className="activity-key">{activityKey}:</span>
                                  <span className="activity-value">{String(activityValue)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (key === 'associateGroup' && typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="preview-field-group">
                            <strong>Associate Group:</strong>
                            <div className="associate-details">
                              <p><strong>Name:</strong> {value.name}</p>
                              <p><strong>Director:</strong> {value.director}</p>
                              <p><strong>Description:</strong> {value.description}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <p key={key}>
                          <strong>{formattedKey}:</strong> {String(value)}
                        </p>
                      );
                    })}
                  </div>
                  
                  <div className="preview-actions">
                    <button 
                      className="preview-btn approve"
                      onClick={() => handleApprove(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Approve
                    </button>
                    <button 
                      className="preview-btn reject"
                      onClick={() => handleReject(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faBan} /> Reject
                    </button>
                    <button 
                      className="preview-btn download"
                      onClick={() => handleGenerateAOR(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faDownload} /> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default ApprovalAOR; 