import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import '../css/ApprovalAOR.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faTimes, faCheck, faBan } from '@fortawesome/free-solid-svg-icons';

// Notification component
function Notification({ message, type, onClose }) {
  if (!message) return null;
  
  const getNotificationClass = () => {
    console.log('Notification type:', type); // Debug log
    switch (type) {
      case 'reject':
        console.log('Using reject notification class'); // Debug log
        return 'approval-aor-reject-notification';
      case 'approve':
        return 'approval-aor-approve-notification';
      default:
        return 'approval-aor-success-notification';
    }
  };
  
  const notificationClass = getNotificationClass();
  console.log('Final notification class:', notificationClass); // Debug log
  
  return (
    <div className={notificationClass}>
      {message}
    </div>
  );
}

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
  const [allReports, setAllReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [notificationType, setNotificationType] = useState('success');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmReportId, setConfirmReportId] = useState(null);

  // Create a wrapper for setNotification to add debugging
  const setNotificationWithDebug = (message, type = 'success') => {
    console.log(`Setting notification: "${message}" with type: "${type}"`);
    setNotification(message);
    setNotificationType(type);
  };

  useEffect(() => {
    fetchReports();
    
    // Debug: Check current user role
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      // Decode JWT token to get user info
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Current user role:', payload.role);
        console.log('Current user info:', payload);
      } catch (e) {
        console.log('Could not decode token:', e);
      }
    }
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      // Fetch all reports instead of just submitted ones
      const response = await axios.get(`${API_BASE}/api/reports`, {
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

      // Set all reports for history, and filter sent reports for main grid
      setAllReports(reportsWithGroups);
      setReports(reportsWithGroups.filter(report => report.status === 'sent'));
      
      // Debug logging
      console.log('All reports fetched:', reportsWithGroups.length);
      console.log('Reports by status:', {
        sent: reportsWithGroups.filter(r => r.status === 'sent').length,
        approved: reportsWithGroups.filter(r => r.status === 'approved').length,
        rejected: reportsWithGroups.filter(r => r.status === 'rejected').length,
        draft: reportsWithGroups.filter(r => r.status === 'draft').length
      });
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
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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
      setNotificationWithDebug('AOR downloaded successfully!');
      setTimeout(() => {
        setNotification('');
        setNotificationType('success');
      }, 2000);
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
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
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
      
      // If the report doesn't exist, show an error message
      if (error.response && error.response.status === 404) {
        console.error(`Report with ID ${report.id} not found. It may have been deleted.`);
        // Use the existing report data from the list instead
        setSelectedReport(report);
      } else {
        // For other errors, still use the existing report data
      setSelectedReport(report);
      }
    }
    setShowPreviewModal(true);
  };

  const handleApprove = async (reportId) => {
    try {
      console.log('Attempting to approve report:', reportId);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await axios.put(`${API_BASE}/api/reports/${reportId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Approve response:', response.data);
      await fetchReports(); // Refresh the list after approval
      setShowPreviewModal(false);
      setNotificationWithDebug('Report approved successfully!', 'approve');
      setTimeout(() => {
        setNotification('');
        setNotificationType('approve');
      }, 2000);
    } catch (err) {
      console.error('Approve error:', err);
      console.error('Approve error response:', err.response?.data);
      setError('Failed to approve report: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async (reportId) => {
    try {
      console.log('Attempting to reject report:', reportId);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      
      const response = await axios.put(`${API_BASE}/api/reports/${reportId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Reject response:', response.data);
      await fetchReports(); // Refresh the list after rejection
      setShowPreviewModal(false);
      
      // Set rejection notification with explicit type
      setNotificationWithDebug('Report rejected successfully!', 'reject');
      
      // Clear notification after 2 seconds
      setTimeout(() => {
        setNotification('');
        setNotificationType('reject');
      }, 2000);
    } catch (err) {
      console.error('Reject error:', err);
      console.error('Reject error response:', err.response?.data);
      setError('Failed to reject report: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleConfirmApprove = (reportId) => {
    setConfirmAction('approve');
    setConfirmReportId(reportId);
    setShowConfirmModal(true);
  };

  const handleConfirmReject = (reportId) => {
    setConfirmAction('reject');
    setConfirmReportId(reportId);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = async () => {
    // Close modal immediately for better UX
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReportId(null);
    
    // Handle the action in the background
    if (confirmAction === 'approve') {
      await handleApprove(confirmReportId);
    } else if (confirmAction === 'reject') {
      await handleReject(confirmReportId);
    }
  };

  const handleCancelAction = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmReportId(null);
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
      <Notification message={notification} type={notificationType} onClose={() => {
        setNotification('');
        setNotificationType(notificationType);
      }} />
      <div className="approval-aor-container">
        <div className="header-section">
          <h2 className="main-header">APPROVAL / AOR</h2>
          <button className="show-history-btn" onClick={handleShowHistory} style={{ fontWeight: 700 }}>
            SHOW HISTORY
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="reports-grid">
            {reports.filter(report => report.status === 'sent').map(report => {
              const logoUrl = getOrganizationLogo(report);
              let displayStatus = report.status.toUpperCase();
              
              // Customize status display
              if (report.status === 'sent') {
                displayStatus = 'PENDING APPROVAL';
              } else if (report.status === 'approved') {
                displayStatus = 'APPROVED';
              } else if (report.status === 'rejected') {
                displayStatus = 'REJECTED';
              }
              
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
                      {displayStatus}
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
                <div className="history-list">
                  {(() => {
                    const approvedReports = allReports.filter(report => report.status === 'approved');
                    console.log('Approved reports in history:', approvedReports.length);
                    console.log('Approved reports:', approvedReports);
                    
                    return approvedReports.map(report => (
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
                          <p className="history-status approved">
                            Approved on {new Date(report.approved_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        className="generate-btn"
                        onClick={() => handleGenerateAOR(report.id)}
                      >
                        <FontAwesomeIcon icon={faDownload} /> Generate AOR
                      </button>
                    </div>
                    ));
                  })()}
                  {allReports.filter(report => report.status === 'approved').length === 0 && (
                    <div className="no-approved-reports">
                      <p>No approved reports found.</p>
                      <p>Reports will appear here after they are approved.</p>
                    </div>
                  )}
                </div>
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
                    <div className="section-header">Report Details</div>
                    {Object.entries(selectedReport.data).map(([key, value]) => {
                      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
                      
                      // Helper function to format value with "NONE" for empty fields
                      const formatValue = (val) => {
                        if (val === null || val === undefined || val === '' || 
                            (Array.isArray(val) && val.length === 0) ||
                            (typeof val === 'object' && Object.keys(val).length === 0)) {
                          return 'NONE';
                        }
                        return String(val);
                      };

                      if (key === 'activities' && typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="preview-field-group">
                            <strong>{formattedKey}:</strong>
                            <div className="activities-list">
                              {Array.isArray(value) && value.length > 0
                                ? value.map((activity, idx) => (
                                    <div key={idx} className="activity-item">
                                      <div className="activity-number">Activity {idx + 1}:</div>
                                      {Object.entries(activity).map(([k, v]) => (
                                        <div key={k} className="activity-detail">
                                          <strong>{k.charAt(0).toUpperCase() + k.slice(1)}:</strong> 
                                          <span className="activity-value">{formatValue(v)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  ))
                                : <span className="preview-value">NONE</span>
                              }
                            </div>
                          </div>
                        );
                      }

                      if (key === 'associateGroup' && typeof value === 'object' && value !== null) {
                        return (
                          <div key={key} className="preview-field-group">
                            <div className="section-header">Associate Group</div>
                            <div className="associate-details">
                              <p><strong>Name:</strong> {formatValue(value.name)}</p>
                              <p><strong>Director:</strong> {formatValue(value.director)}</p>
                              <p><strong>Description:</strong> {formatValue(value.description)}</p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={key} className="preview-field">
                          <strong>{formattedKey}:</strong> <span className="preview-value">{formatValue(value)}</span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="preview-actions">
                    {selectedReport.status === 'sent' && (
                      <>
                    <button 
                      className="preview-btn approve"
                          onClick={() => handleConfirmApprove(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faCheck} /> Approve
                    </button>
                    <button 
                      className="preview-btn reject"
                          onClick={() => handleConfirmReject(selectedReport.id)}
                    >
                      <FontAwesomeIcon icon={faBan} /> Reject
                    </button>
                      </>
                    )}
                    
                    {selectedReport.status === 'approved' && (
                      <>
                        <button 
                          className="preview-btn approve disabled"
                          disabled
                          title="Already approved"
                        >
                          <FontAwesomeIcon icon={faCheck} /> Approved
                        </button>
                      </>
                    )}
                    
                    {selectedReport.status === 'rejected' && (
                      <>
                    <button 
                          className="preview-btn reject disabled"
                          disabled
                          title="Already rejected"
                    >
                          <FontAwesomeIcon icon={faBan} /> Rejected
                    </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Action</h3>
                <button className="modal-close" onClick={handleCancelAction}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to {confirmAction === 'approve' ? 'approve' : 'reject'} this report?</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                  {confirmAction === 'approve' 
                    ? 'This will approve the report and make it available for download in the history.'
                    : 'This will reject the report and the associate will need to submit a new one.'
                  }
                </p>
                <div className="modal-actions">
                  <button className={`modal-btn ${confirmAction === 'approve' ? 'confirm-approve' : 'confirm-reject'}`} onClick={handleConfirmAction}>
                    <FontAwesomeIcon icon={confirmAction === 'approve' ? faCheck : faBan} /> Confirm {confirmAction === 'approve' ? 'Approve' : 'Reject'}
                  </button>
                  <button className="modal-btn cancel-btn" onClick={handleCancelAction}>
                    Cancel
                  </button>
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