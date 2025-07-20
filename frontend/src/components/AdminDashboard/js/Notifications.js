import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import dayjs from 'dayjs';
import '../css/Notifications.css';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="notifications-success-notification">
      {message}
    </div>
  );
}

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ 
    title: '', 
    description: '', 
    associate_ids: [],
    expertise_requirements: [{ expertise: '', count: 1 }]
  });
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [filterType, setFilterType] = useState('none');
  const [filterValue, setFilterValue] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [notification, setNotification] = useState('');

  // Fetch notifications
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } else {
          setNotifications([]);
        }
      });
  }, [showModal]);

  // Fetch associates for selection
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    fetch('http://localhost:8000/api/members', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(setAssociates);
  }, []);

  const openModal = () => {
    setForm({ 
      title: '', 
      description: '', 
      associate_ids: [],
      expertise_requirements: [{ expertise: '', count: 1 }]
    });
    setSelectAll(false);
    setShowModal(true);
    setError('');
  };
  const closeModal = () => setShowModal(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleAssociateChange = id => {
    setForm(f => {
      let ids = f.associate_ids.includes(id)
        ? f.associate_ids.filter(i => i !== id)
        : [...f.associate_ids, id];
      return { ...f, associate_ids: ids };
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setForm(f => ({ ...f, associate_ids: [] }));
      setSelectAll(false);
    } else {
      setForm(f => ({ ...f, associate_ids: associates.map(a => a.id) }));
      setSelectAll(true);
    }
  };

  const addExpertiseRequirement = () => {
    setForm(f => ({
      ...f,
      expertise_requirements: [...f.expertise_requirements, { expertise: '', count: 1 }]
    }));
  };

  const removeExpertiseRequirement = (index) => {
    setForm(f => ({
      ...f,
      expertise_requirements: f.expertise_requirements.filter((_, i) => i !== index)
    }));
  };

  const updateExpertiseRequirement = (index, field, value) => {
    setForm(f => ({
      ...f,
      expertise_requirements: f.expertise_requirements.map((req, i) => 
        i === index ? { ...req, [field]: value } : req
      )
    }));
  };

  const calculateTotalVolunteers = () => {
    return form.expertise_requirements.reduce((total, req) => total + (parseInt(req.count) || 0), 0);
  };

  useEffect(() => {
    setSelectAll(form.associate_ids.length === associates.length && associates.length > 0);
  }, [form.associate_ids, associates]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate that expertise requirements are provided
    const hasExpertiseRequirements = form.expertise_requirements && form.expertise_requirements.length > 0;
    
    if (!hasExpertiseRequirements) {
      setError('Please add at least one expertise requirement');
      setLoading(false);
      return;
    }
    
    // Validate expertise requirements
    if (hasExpertiseRequirements) {
      const invalidRequirements = form.expertise_requirements.filter(req => !req.expertise.trim());
      if (invalidRequirements.length > 0) {
        setError('Please fill in all expertise fields');
        setLoading(false);
        return;
      }
    }
    
    // Ensure associate_ids is always an array
    const associateIds = form.associate_ids && form.associate_ids.length > 0 
      ? form.associate_ids.map(id => Number(id))
      : [];
    
    try {
      const payload = {
        title: form.title,
        description: form.description,
        associate_ids: associateIds,
        expertise_requirements: form.expertise_requirements,
      };
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to create notification');
      }
      
      setShowModal(false);
      setNotification('Notification created successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async id => {
    if (!window.confirm('Are you sure you want to remove this notification?')) return;
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    await fetch(`http://localhost:8000/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(notifications.filter(n => n.id !== id));
    setNotification('Notification removed successfully!');
    setTimeout(() => setNotification(''), 2000);
  };

  const handleToggleHold = async id => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    try {
      const response = await fetch(`http://localhost:8000/api/notifications/${id}/toggle-hold`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, status: data.status } : n
        ));
        setNotification(data.message);
        setTimeout(() => setNotification(''), 2000);
      } else {
        setError(data.message || 'Failed to toggle hold status');
      }
    } catch (err) {
      setError('Failed to toggle hold status');
    }
  };

  // Helper to filter notifications
  const filterNotifications = (notifications) => {
    let filtered = notifications;
    if (filterType === 'date' && filterValue) {
      filtered = filtered.filter(n => {
        if (!n.created_at) return false;
        const created = dayjs(n.created_at);
        return created.format('YYYY-MM-DD') === filterValue;
      });
    } else if (filterType === 'month' && filterValue) {
      filtered = filtered.filter(n => {
        if (!n.created_at) return false;
        const created = dayjs(n.created_at);
        return created.format('YYYY-MM') === filterValue;
      });
    }
    // Sort
    filtered = filtered.slice().sort((a, b) => {
      if (sortOrder === 'asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    return filtered;
  };

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
      <h2 className="main-header" style={{ textAlign: 'left', marginLeft: 24 }}>NOTIFICATIONS</h2>
      {/* Filter Bar */}
      <div className="notification-filter-bar">
        <span className="notification-filter-label">Filters:</span>
        <select 
          value={filterType} 
          onChange={e => { setFilterType(e.target.value); setFilterValue(''); }} 
          className="notification-filter-select"
        >
          <option value="date">Date Only</option>
          <option value="month">Month</option>
        </select>
        {filterType === 'date' && (
          <input 
            type="date" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            className="notification-filter-input"
          />
        )}
        {filterType === 'month' && (
          <input 
            type="month" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            className="notification-filter-input"
          />
        )}
        <select 
          value={sortOrder} 
          onChange={e => setSortOrder(e.target.value)} 
          className="notification-filter-select"
          style={{ marginLeft: 12 }}
        >
          <option value="desc">Created Last</option>
          <option value="asc">Created First</option>
        </select>
        {(filterValue) && (
          <button 
            onClick={() => { setFilterValue(''); }} 
            className="notification-filter-clear"
          >Clear</button>
        )}
        <button 
          className="notification-add-btn"
          onClick={openModal}
        >
          Add Notification
        </button>
      </div>
      {notifications.length === 0 && (
        <div className="notification-empty">No notifications yet.</div>
      )}
      {filterNotifications(notifications).map(n => (
        <NotificationDropdown key={n.id} notification={n} onRemove={handleRemove} onToggleHold={handleToggleHold} />
      ))}
      {showModal && (
        <div className="notification-modal-overlay">
          <div className="notification-modal-card enhanced-notification-modal">
            {/* Enhanced Header */}
            <div className="notification-modal-header enhanced-notification-header">
              <div className="enhanced-header-left">
                <span className="enhanced-header-icon">
                  <svg width="38" height="38" fill="#fff" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7v3.586l.707.707A1 1 0 0 1 19.293 16H4.707a1 1 0 0 1-.707-1.707L4.707 12.586V9a7 7 0 0 1 7-7zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z"/></svg>
                </span>
                <span className="enhanced-header-title">Add Notification</span>
              </div>
              <button className="notification-close-icon enhanced-close-icon" onClick={closeModal} aria-label="Close">&times;</button>
            </div>
            <form className="add-edit-form notification-modal-content enhanced-notification-content" onSubmit={handleSubmit}>
              <div className="enhanced-section-label">Notification Details</div>
              <div className="notification-form-grid enhanced-form-grid">
                <div className="notification-form-group full-width">
                  <label>Title *</label>
                  <input 
                    name="title" 
                    value={form.title} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter notification title"
                    className="enhanced-input"
                  />
                </div>
                <div className="notification-form-group full-width">
                  <label>Description *</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    required
                    placeholder="Enter notification description"
                    rows="3"
                    className="enhanced-input"
                  />
                </div>
                <div className="notification-form-group full-width">
                  <label>Select Associate/s to Notify</label>
                  <div className="notification-associate-list enhanced-associate-list">
                    <div className="select-all associate-checkbox-row enhanced-checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={selectAll} 
                        onChange={handleSelectAll} 
                        id="selectAll"
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor="selectAll">Select All</label>
                    </div>
                    {[...associates]
                      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                      .map(a => (
                        <div key={a.id} className="associate-checkbox-row enhanced-checkbox-row">
                          <input
                            type="checkbox"
                            checked={form.associate_ids.includes(a.id)}
                            onChange={() => handleAssociateChange(a.id)}
                            id={`associate_${a.id}`}
                            className="enhanced-checkbox"
                            style={{ marginRight: '8px' }}
                          />
                          <label htmlFor={`associate_${a.id}`} className="associate-checkbox-label enhanced-checkbox-label">{a.name}</label>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="notification-form-group full-width">
                  <label>Numbers of Volunteers Needed</label>
                  <div className="expertise-requirements-help">
                    Specify volunteers needed by expertise (e.g., Medical, Engineering, Rescue).
                  </div>
                  <div className="expertise-requirements-container">
                    {form.expertise_requirements.map((req, index) => (
                      <div key={index} className="expertise-requirement-row">
                        <input
                          type="text"
                          value={req.expertise}
                          onChange={(e) => updateExpertiseRequirement(index, 'expertise', e.target.value)}
                          placeholder="Enter expertise (e.g., Medical, Engineering, Rescue)"
                          className="enhanced-input expertise-input"
                        />
                        <input
                          type="number"
                          value={req.count}
                          onChange={(e) => updateExpertiseRequirement(index, 'count', parseInt(e.target.value) || 1)}
                          placeholder="Count"
                          className="enhanced-input count-input"
                          min={1}
                          max={100}
                        />
                        <button
                          type="button"
                          onClick={() => removeExpertiseRequirement(index)}
                          className="remove-expertise-btn"
                          title="Remove this requirement"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <div className="expertise-actions-row">
                      <div className="expertise-total-chip">
                        <span className="expertise-total-label">Total:</span>
                        <span className="expertise-total-value">{calculateTotalVolunteers()}</span>
                      </div>
                      <button
                        type="button"
                        onClick={addExpertiseRequirement}
                        className="add-expertise-btn"
                      >
                        + Add Expertise Requirement
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {error && <div className="notification-error-message enhanced-error-message">{error}</div>}
              <div className="notification-form-actions enhanced-form-actions">
                <button type="button" className="cancel-btn enhanced-cancel-btn" onClick={closeModal}>
                  <span className="enhanced-btn-icon">&#10005;</span> Cancel
                </button>
                <button type="submit" className="notification-btn-submit enhanced-btn-submit" disabled={loading}>
                  <span className="enhanced-btn-icon">&#128276;</span> {loading ? 'Creating...' : 'Create Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function VolunteerProgress({ notification }) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const [hoveredLegend, setHoveredLegend] = useState(false);
  const [hoveredLegendItem, setHoveredLegendItem] = useState(null);
  const [activeTab, setActiveTab] = useState('contributing');

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`http://localhost:8000/api/notifications/${notification.id}/volunteer-progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        setProgress(data.progress || {});
      } catch (error) {
        console.error('Failed to fetch volunteer progress:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [notification.id]);

  if (loading) {
    return <div className="volunteer-progress-loading">Loading volunteer progress...</div>;
  }

  if (!notification.expertise_requirements || notification.expertise_requirements.length === 0) {
    return null;
  }

  // Calculate overall progress
  const totalRequired = notification.expertise_requirements.reduce((sum, req) => sum + (parseInt(req.count) || 0), 0);
  const totalProvided = Object.values(progress).reduce((sum, data) => sum + (data.provided || 0), 0);
  // Ensure provided never exceeds required
  const cappedProvided = Math.min(totalProvided, totalRequired);
  const progressPercentage = totalRequired > 0 ? Math.min(100, (cappedProvided / totalRequired) * 100) : 0;
  const isComplete = cappedProvided >= totalRequired;

  // Collect all contributing groups with their expertise breakdown
  const groupContributions = [];
  Object.entries(progress).forEach(([expertise, data]) => {
    if (data.groups) {
      data.groups.forEach(group => {
        const existingGroup = groupContributions.find(g => g.groupName === group.group);
        if (existingGroup) {
          existingGroup.contributions.push({
            expertise: expertise,
            count: group.count
          });
          existingGroup.totalCount += group.count;
        } else {
          groupContributions.push({
            groupName: group.group,
            totalCount: group.count,
            contributions: [{
              expertise: expertise,
              count: group.count
            }]
          });
        }
      });
    }
  });

  // Sort groups by total contribution
  groupContributions.sort((a, b) => b.totalCount - a.totalCount);

  // Get declined groups
  const declinedGroups = notification.recipients 
    ? notification.recipients
        .filter(r => r.response === 'decline')
        .map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`)
    : [];

  return (
    <div className="volunteer-progress-container">
      {/* <div className="volunteer-progress-title">Volunteer Progress</div> */}
      
      <div className="volunteer-progress-overview">
        <div className="volunteer-progress-bar-container">
          <div className="volunteer-progress-bar">
            {/* Progress bar with left and right labels */}
            <div className="progress-bar-with-labels">
              <div className="progress-label-left">
                <span className="label-text">Provided</span>
                <span className="label-value">{cappedProvided}</span>
              </div>
              
              <div className="progress-bar-wrapper">
                <div className="progress-segments">
                  {/* Main progress fill */}
                  <div 
                    className="progress-fill"
                    style={{
                      width: `${progressPercentage}%`,
                      backgroundColor: isComplete ? '#2ecc71' : '#dc2626'
                    }}
                  />
                  
                  {/* Group dividers */}
                  {groupContributions.map((group, index) => {
                    const segmentWidth = (group.totalCount / totalRequired) * 100;
                    const segmentPosition = groupContributions.slice(0, index).reduce((sum, g) => sum + (g.totalCount / totalRequired) * 100, 0);
                    
                    return (
                      <div
                        key={group.groupName}
                        className={`progress-segment ${hoveredSegment === group.groupName ? 'hovered' : ''}`}
                        style={{
                          width: `${segmentWidth}%`,
                          left: `${segmentPosition}%`,
                          position: 'absolute',
                          height: '100%',
                          zIndex: hoveredSegment === group.groupName ? 20 : 10
                        }}
                        onMouseEnter={() => {
                          console.log('Hovering over:', group.groupName);
                          setHoveredSegment(group.groupName);
                        }}
                        onMouseLeave={() => {
                          console.log('Leaving:', group.groupName);
                          setHoveredSegment(null);
                        }}
                      >
                        {hoveredSegment === group.groupName && (
                          <div className="segment-tooltip">
                            <div className="tooltip-header">{group.groupName}</div>
                            <div className="tooltip-content">
                              {group.contributions.length > 0 ? (
                                group.contributions.map((contribution, idx) => (
                                  <div key={idx} className="tooltip-item">
                                    {contribution.count} {contribution.expertise}
                                  </div>
                                ))
                              ) : (
                                <div className="tooltip-item">No volunteers provided</div>
                              )}
                            </div>
                            <div className="tooltip-total">
                              Total: {group.totalCount} volunteers
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="progress-label-right">
                <span className="label-text">Remaining</span>
                <span className="label-value">{Math.max(0, totalRequired - cappedProvided)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Groups Section */}
      <div className="groups-simple-container">
        <div className="groups-simple-header">
          <button 
            className={`groups-decline-link ${activeTab === 'contributing' ? 'contributing' : 'declined'}`}
            onClick={() => setActiveTab(activeTab === 'contributing' ? 'declined' : 'contributing')}
          >
            {activeTab === 'contributing' ? 'Contributing Groups' : 'Declined Groups'}
          </button>
          <button 
            className={`groups-eye-button ${activeTab === 'contributing' ? 'contributing' : 'declined'}`}
            onClick={() => setHoveredLegend(!hoveredLegend)}
          >
            {hoveredLegend ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
            )}
          </button>
        </div>
        
        {hoveredLegend && (
          <div className="groups-simple-content">
            {activeTab === 'contributing' && (
              <div className="group-legend">
                <div className="legend-items">
                  {groupContributions.length === 0 ? (
                    <div className="legend-empty">No groups have contributed</div>
                  ) : (
                    groupContributions.map((group, index) => (
                      <div 
                        key={group.groupName} 
                        className="legend-item"
                        onMouseEnter={() => setHoveredLegendItem(group.groupName)}
                        onMouseLeave={() => setHoveredLegendItem(null)}
                      >
                        <span className="legend-name">{group.groupName}</span>
                        <span className="legend-count">{group.totalCount} volunteers</span>
                        
                        {/* Hover popup for group breakdown */}
                        {hoveredLegendItem === group.groupName && group.contributions && group.contributions.length > 0 && (
                          <div className="legend-item-popup">
                            <div className="legend-item-popup-content">
                              {group.contributions.map((contribution, idx) => (
                                <div key={idx} className="legend-item-popup-row">
                                  <span className="legend-item-popup-expertise">{contribution.expertise}</span>
                                  <span className="legend-item-popup-count">{contribution.count} volunteers</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'declined' && (
              <div className="group-legend declined">
                <div className="legend-items">
                  {declinedGroups.length === 0 ? (
                    <div className="legend-empty">No groups have declined</div>
                  ) : (
                    declinedGroups.map((groupName, index) => (
                      <div key={index} className="legend-item declined">
                        <span className="legend-name">{groupName}</span>
                        <span className="legend-count declined">Declined</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper function to generate colors for segments
function getSegmentColor(index) {
  const colors = [
    '#3498db', // Blue
    '#e74c3c', // Red
    '#2ecc71', // Green
    '#f39c12', // Orange
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#e67e22', // Dark Orange
    '#34495e', // Dark Blue
    '#f1c40f', // Yellow
    '#e91e63'  // Pink
  ];
  return colors[index % colors.length];
}

function NotificationDropdown({ notification, onRemove, onToggleHold }) {
  const [open, setOpen] = useState(false);
  const [hoveredStatus, setHoveredStatus] = useState(null);
  const accepted = notification.recipients ? notification.recipients.filter(r => r.response === 'accept').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  const declined = notification.recipients ? notification.recipients.filter(r => r.response === 'decline').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  
  return (
    <div className={`notification-dropdown${open ? ' open' : ''}`}>
      <div className="notification-dropdown-header" onClick={() => setOpen(o => !o)} style={{ textAlign: 'left' }}>
        <div style={{ textAlign: 'left' }}>
          <div className="notification-dropdown-title" style={{ textAlign: 'left' }}>
            {notification.title}
            {notification.status === 'on_hold' && (
              <span className="notification-hold-badge">ON HOLD</span>
            )}
          </div>
          <div className="notification-dropdown-date" style={{ textAlign: 'left' }}>{dayjs(notification.created_at).format('MMM D, YYYY h:mm A')}</div>
        </div>
        <div className="notification-dropdown-arrow">{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div className="notification-dropdown-body">
          <div className="notification-dropdown-description">{notification.description}</div>
          
          {/* Requirements Info Container */}
          <div className="requirements-info-container">
            {/* Invited Groups Display - Hover Popup */}
            {notification.recipients && notification.recipients.length > 0 && (
              <div className="invited-groups-container">
                <div className="invited-groups-trigger">
                  <span className="requirement-label">Invited Groups</span>
                  <span className="requirement-value">
                    {notification.recipients.length} groups
                  </span>
                </div>
                <div className="invited-groups-popup">
                  <div className="invited-groups-content">
                    {notification.recipients.map((recipient, index) => (
                      <div key={index} className="invited-group-item">
                        <span className="group-name">{recipient.user ? recipient.user.name : `User ${recipient.user_id}`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Volunteer Requirements Display - Hover Popup */}
            {notification.expertise_requirements && notification.expertise_requirements.length > 0 && (
              <div className="volunteer-requirements-hover-container">
                <div className="volunteer-requirements-trigger">
                  <span className="requirement-label">Volunteer Requirements</span>
                  <span className="requirement-value">
                    {notification.expertise_requirements.reduce((total, req) => total + (parseInt(req.count) || 0), 0)} needed
                  </span>
                </div>
                <div className="volunteer-requirements-popup">
                  <div className="popup-content">
                    {notification.expertise_requirements.map((req, index) => (
                      <div key={index} className="popup-expertise-item">
                        <span className="expertise-name">{req.expertise}</span>
                        <span className="expertise-count">{req.count} needed</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <VolunteerProgress notification={notification} />
          {/* <div className="notification-dropdown-lists">
            <div 
              className="notification-dropdown-list accepted"
              onMouseEnter={() => setHoveredStatus('accepted')}
              onMouseLeave={() => setHoveredStatus(null)}
            >
              <div className="notification-dropdown-list-title accepted">Accepted ({accepted.length})</div>
              {hoveredStatus === 'accepted' && (
              <ul>
                {accepted.length === 0 ? <li className="notification-dropdown-list-empty">None</li> : accepted.map(name => <li key={name}>{name}</li>)}
              </ul>
              )}
            </div>
            <div 
              className="notification-dropdown-list declined"
              onMouseEnter={() => setHoveredStatus('declined')}
              onMouseLeave={() => setHoveredStatus(null)}
            >
              <div className="notification-dropdown-list-title declined">Declined ({declined.length})</div>
              {hoveredStatus === 'declined' && (
              <ul>
                {declined.length === 0 ? <li className="notification-dropdown-list-empty">None</li> : declined.map(name => <li key={name}>{name}</li>)}
              </ul>
              )}
            </div>
          </div> */}
          <div className="notification-dropdown-actions">
            <button 
              onClick={() => onToggleHold(notification.id)} 
              className={`notification-dropdown-hold ${notification.status === 'on_hold' ? 'active' : ''}`}
            >
              {notification.status === 'on_hold' ? 'ACTIVATE' : 'HOLD'}
            </button>
            <button 
              onClick={() => onRemove(notification.id)} 
              className="notification-dropdown-remove"
            >REMOVE</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications; 