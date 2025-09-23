import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import dayjs from 'dayjs';
import '../css/Notification.css';

const NOTIF_READ_KEY = 'associateNotifRead';

// Progress Tracker Component
function NotificationProgress({ notification }) {
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        // Use the volunteer progress endpoint to get overall progress from all associates
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
    return (
      <div className="notification-progress-container">
        <div className="notification-progress-title">Volunteer Progress</div>
        <div className="notification-progress-loading">Loading progress...</div>
      </div>
    );
  }

  if (!notification.expertise_requirements || notification.expertise_requirements.length === 0) {
    return null;
  }

  // Hide progress if notification is on hold
  if (notification.status === 'on_hold') {
    return null;
  }

  // Calculate overall progress from ALL associates (including current one)
  const totalRequired = notification.expertise_requirements.reduce((sum, req) => sum + (parseInt(req.count) || 0), 0);
  const totalProvided = Object.values(progress).reduce((sum, data) => sum + (data.provided || 0), 0);
  // Ensure provided never exceeds required
  const cappedProvided = Math.min(totalProvided, totalRequired);
  const progressPercentage = totalRequired > 0 ? Math.min(100, (cappedProvided / totalRequired) * 100) : 0;
  const remaining = Math.max(0, totalRequired - cappedProvided);

  return (
    <div className="notification-progress-container">
      <div className="notification-progress-title">
        Volunteer Progress
        {/* <span className="live-indicator">● LIVE</span> */}
      </div>
      <div className="notification-progress-bar-with-labels">
        <div className="notification-progress-bar-labels">
          <div className="notification-progress-bar-label">
            <div className="notification-progress-bar-label-text">Provided</div>
            <div className="notification-progress-bar-label-value">{cappedProvided}</div>
          </div>
          <div className="notification-progress-bar-label">
            <div className="notification-progress-bar-label-text">Remaining</div>
            <div className="notification-progress-bar-label-value">{remaining}</div>
          </div>
        </div>
        <div className="notification-progress-bar-container">
          <div className="notification-progress-bar">
            <div 
              className="notification-progress-fill" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reload, setReload] = useState(false);
  const [volunteerSelections, setVolunteerSelections] = useState({});
  const [availableCapacity, setAvailableCapacity] = useState({});
  const [liveUpdateIntervals, setLiveUpdateIntervals] = useState({});
  const [updatedMaxValues, setUpdatedMaxValues] = useState({});

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } else {
          setNotifications([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setNotifications([]);
        setLoading(false);
      });

    // Add polling to update notifications every 5 seconds
    const interval = setInterval(() => {
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
          } else {
            setNotifications([]);
          }
        });
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, [reload]);

  // Cleanup live updates when component unmounts
  useEffect(() => {
    return () => {
      Object.values(liveUpdateIntervals).forEach(interval => {
        clearInterval(interval);
      });
    };
  }, [liveUpdateIntervals]);

  // Clear available capacity data for notifications that go on hold
  useEffect(() => {
    const onHoldNotifications = notifications.filter(n => n.status === 'on_hold');
    onHoldNotifications.forEach(notification => {
      // Clear available capacity data
      setAvailableCapacity(prev => {
        const newState = { ...prev };
        delete newState[notification.id];
        return newState;
      });
      
      // Stop live updates
      stopLiveUpdates(notification.id);
    });
  }, [notifications]);

  const handleRespond = async (id, response, selections = null) => {
    setLoading(true);
    setError('');
    try {
      const payload = { response };
      if (response === 'accept' && selections) {
        payload.volunteer_selections = selections;
      }
      
      const res = await fetch(`http://localhost:8000/api/notifications/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.details && Array.isArray(errorData.details)) {
          setError(errorData.details.join(', '));
        } else {
          throw new Error('Failed to respond');
        }
        setLoading(false);
        return;
      }
      
      setLoading(false);
      setReload(r => !r);
      setVolunteerSelections({});
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVolunteerSelection = (notificationId, expertise, count) => {
    setVolunteerSelections(prev => ({
      ...prev,
      [notificationId]: {
        ...prev[notificationId],
        [expertise]: parseInt(count) || 0
      }
    }));
  };

  const getVolunteerSelections = (notificationId) => {
    const selections = volunteerSelections[notificationId] || {};
    return Object.entries(selections)
      .filter(([_, count]) => count > 0)
      .map(([expertise, count]) => ({ expertise, count }));
  };

  const canAccept = (notification) => {
    if (!notification.expertise_requirements) return true;
    
    const selections = getVolunteerSelections(notification.id);
    const totalSelected = selections.reduce((sum, sel) => sum + sel.count, 0);
    
    // Only require at least one expertise type to be selected
    return totalSelected > 0;
  };

  const fetchAvailableCapacity = async (notificationId) => {
    try {
      // Check if the notification is on hold before fetching
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && notification.status === 'on_hold') {
        // Don't fetch capacity for notifications on hold
        return;
      }

      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`http://localhost:8000/api/notifications/${notificationId}/available-capacity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Check if values have changed to trigger animation
      const currentCapacity = availableCapacity[notificationId] || {};
      const newCapacity = data.available || {};
      
      const hasChanged = Object.keys(newCapacity).some(expertise => {
        const currentRemaining = currentCapacity[expertise]?.remaining || 0;
        const newRemaining = newCapacity[expertise]?.remaining || 0;
        return currentRemaining !== newRemaining;
      });
      
      if (hasChanged) {
        // Trigger animation for updated values
        setUpdatedMaxValues(prev => ({
          ...prev,
          [notificationId]: Date.now()
        }));
        
        // Clear animation after 1 second
        setTimeout(() => {
          setUpdatedMaxValues(prev => {
            const newState = { ...prev };
            delete newState[notificationId];
            return newState;
          });
        }, 1000);
      }
      
      setAvailableCapacity(prev => ({
        ...prev,
        [notificationId]: newCapacity
      }));
    } catch (error) {
      console.error('Failed to fetch available capacity:', error);
    }
  };

  const startLiveUpdates = (notificationId) => {
    // Check if the notification is on hold before starting live updates
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification.status === 'on_hold') {
      // Don't start live updates for notifications on hold
      return;
    }

    // Clear any existing interval for this notification
    if (liveUpdateIntervals[notificationId]) {
      clearInterval(liveUpdateIntervals[notificationId]);
    }

    // Start new interval to fetch updates every 5 seconds
    const interval = setInterval(() => {
      fetchAvailableCapacity(notificationId);
    }, 5000);

    setLiveUpdateIntervals(prev => ({
      ...prev,
      [notificationId]: interval
    }));
  };

  const stopLiveUpdates = (notificationId) => {
    if (liveUpdateIntervals[notificationId]) {
      clearInterval(liveUpdateIntervals[notificationId]);
      setLiveUpdateIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[notificationId];
        return newIntervals;
      });
    }
  };

  // Search logic only
  const filteredNotifications = notifications.filter(n => n.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AssociateLayout>
      <div className="notification-container">
        <div className="notification-header">
          <div className="notification-title-row">
            <h2 className="notification-title">
              NOTIFICATION/INBOX
            </h2>
          </div>
          <div className="notification-search">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search notification title ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
        {/* Notification summary row */}
        {(() => {
            const userId = Number(localStorage.getItem('userId'));
          const total = filteredNotifications.length;
          let notResponded = 0;
          let responded = 0;
          filteredNotifications.forEach(n => {
            const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
            if (myRecipient) {
              if (myRecipient.response) responded++;
              else notResponded++;
            }
          });
          return (
            <div className="notification-summary">
              <span>
                Total:
                <span className="total">{total}</span>
              </span>
              <span>
                No Response:
                <span className="no-response">{notResponded}</span>
              </span>
              <span>
                Responded:
                <span className="responded">{responded}</span>
              </span>
            </div>
          );
        })()}
        
        {loading && (
          <div className="notification-loading">
            <div className="notification-loading-spinner"></div>
            <div className="notification-loading-text">Loading notifications...</div>
          </div>
        )}
        
        {!loading && (
          <>
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                <div className="notification-empty-icon">📭</div>
                <div className="notification-empty-text">No notifications found</div>
              </div>
            ) : (
              <div className="notification-list">
                {filteredNotifications.map(n => {
                  const userId = Number(localStorage.getItem('userId'));
                  const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
                  const isOpen = expanded === n.id;
                  
                  return (
                    <div key={n.id} className="notification-item">
                                              <div className="notification-item-header" onClick={() => {
                          if (!isOpen) {
                            fetchAvailableCapacity(n.id);
                            startLiveUpdates(n.id);
                          } else {
                            stopLiveUpdates(n.id);
                          }
                          setExpanded(isOpen ? null : n.id);
                        }} style={{ textAlign: 'left' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div className="notification-item-title" style={{ textAlign: 'left' }}>{n.title}</div>
                          <div className="notification-item-date" style={{ textAlign: 'left' }}>{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>

                        </div>
                        <div className="notification-item-arrow">{isOpen ? '▲' : '▼'}</div>
                      </div>
                      {isOpen && (
                        <div className="notification-item-content">
                          <div className="notification-item-description">{n.description}</div>
                          
                          {/* Requirements Info Container */}
                          <div className="requirements-info-container">
                            {/* Invited Groups Display */}
                            {n.recipients && n.recipients.length > 0 && (
                              <div className="invited-groups-container">
                                <div className="invited-groups-trigger">
                                  <span className="requirement-label">Invited Groups</span>
                                  <span className="requirement-value">
                                    {n.recipients.length} groups
                                  </span>
                                </div>
                                <div className="invited-groups-popup">
                                  <div className="invited-groups-content">
                                    {n.recipients.map((recipient, index) => (
                                      <div key={index} className="invited-group-item">
                                        <span className="group-name">{recipient.user ? recipient.user.name : `User ${recipient.user_id}`}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Volunteer Requirements Display */}
                            {n.expertise_requirements && n.expertise_requirements.length > 0 && (
                              <div className="volunteer-requirements-hover-container">
                                <div className="volunteer-requirements-trigger">
                                  <span className="requirement-label">Volunteer Requirements</span>
                                  <span className="requirement-value">
                                    {n.expertise_requirements.reduce((total, req) => total + (parseInt(req.count) || 0), 0)} needed
                                  </span>
                                </div>
                                <div className="volunteer-requirements-popup">
                                  <div className="popup-content">
                                    {n.expertise_requirements.map((req, index) => (
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
                          
                          {/* Progress Tracker */}
                          <NotificationProgress notification={n} />
                          
                          {/* Show hold message to ALL associates when notification is on hold */}
                          {(n.status === 'on_hold') && (
                            <div className="notification-on-hold">
                              <div className="notification-on-hold-icon">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <circle cx="12" cy="12" r="10"/>
                                  <line x1="12" y1="8" x2="12" y2="12"/>
                                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                              </div>
                              <div className="notification-on-hold-message"> 
                                Volunteer recruitment is on hold for this notification. 
                                You will not be able to respond at this time. 
                                Please check back later for updates.
                              </div>
                            </div>
                          )}
                          
                          {/* Only show response options if notification is active and user hasn't responded */}
                          {myRecipient && !myRecipient.response && n.status !== 'on_hold' && (
                            <>
                              {/* Check if all volunteers have been met */}
                              {(() => {
                                const totalRequired = n.expertise_requirements.reduce((sum, req) => sum + (parseInt(req.count) || 0), 0);
                                const totalRemaining = availableCapacity[n.id] ? 
                                  Object.values(availableCapacity[n.id]).reduce((sum, data) => sum + (data.remaining || 0), 0) : 
                                  totalRequired;
                                const allVolunteersMet = totalRemaining === 0;
                                
                                return (
                                  <>
                                    {allVolunteersMet ? (
                                      <div className="volunteer-requirements-met">
                                        <div className="requirements-met-icon">
                                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                          </svg>
                                        </div>
                                        <div className="requirements-met-message">
                                          Sorry, all volunteer requirements have been met. 
                                          No additional volunteers are needed at this time. 
                                          We hope to collaborate with your group next time.
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        {/* Volunteer Selection Form */}
                                        {n.expertise_requirements && n.expertise_requirements.length > 0 && (
                                          <div className="volunteer-selection-form">
                                            <div className="volunteer-selection-title">How many volunteers can you provide?</div>
                                            <div className="volunteer-selection-row">
                                              {n.expertise_requirements.map((req, index) => (
                                                <div key={index} className="volunteer-selection-item">
                                                  <div className="volunteer-selection-label">{req.expertise}:</div>
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    max={availableCapacity[n.id] ? (availableCapacity[n.id][req.expertise]?.remaining || 0) : req.count}
                                                    value={volunteerSelections[n.id]?.[req.expertise] || ''}
                                                    onChange={(e) => {
                                                      const value = parseInt(e.target.value) || 0;
                                                      const maxAllowed = availableCapacity[n.id] ? (availableCapacity[n.id][req.expertise]?.remaining || 0) : req.count;
                                                      if (value <= maxAllowed) {
                                                        handleVolunteerSelection(n.id, req.expertise, e.target.value);
                                                      }
                                                    }}
                                                    className="volunteer-selection-input"
                                                    placeholder={availableCapacity[n.id] ? 
                                                      `0-${availableCapacity[n.id][req.expertise]?.remaining || 0}` : 
                                                      `0-${req.count}`
                                                    }
                                                  />
                                                  <div className={`volunteer-selection-max ${updatedMaxValues[n.id] ? 'updated' : ''}`}>
                                                    {availableCapacity[n.id] ? 
                                                      `still need ${availableCapacity[n.id][req.expertise]?.remaining || 0}` : 
                                                      'Loading...'
                                                    }
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Action Buttons - Separate Row */}
                                        <div className="notification-item-actions">
                                          <div className="notification-item-action-buttons">
                                            <button 
                                              className="notification-item-action accept" 
                                              onClick={e => { 
                                                e.stopPropagation(); 
                                                const selections = getVolunteerSelections(n.id);
                                                handleRespond(n.id, 'accept', selections.length > 0 ? selections : null); 
                                              }} 
                                              disabled={loading || !canAccept(n)}
                                            >
                                              {canAccept(n) ? 'CONFIRM' : 'SELECT AT LEAST ONE EXPERTISE'}
                                            </button>
                                            <button 
                                              className="notification-item-action decline" 
                                              onClick={e => { e.stopPropagation(); handleRespond(n.id, 'decline'); } } 
                                              disabled={loading}
                                            >
                                              DECLINE
                                            </button>
                                          </div>
                                        </div>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          )}
                          
                          {/* Only show response status if notification is not on hold */}
                          {myRecipient && myRecipient.response && n.status !== 'on_hold' && (
                            <div className={`volunteer-commitments-hover-container ${myRecipient.response}`}>
                              <div className="volunteer-commitments-trigger">
                                <div className={`response-status ${myRecipient.response}`}>
                                  Action: {myRecipient.response.toUpperCase()}
                                </div>
                              </div>
                              {myRecipient.response === 'accept' && myRecipient.volunteer_selections && (
                                <div className="volunteer-commitments-popup">
                                  <div className="commitments-popup-content">
                                    <div className="popup-title">
                                      <span>Your Group's Commitments</span>
                                      <span style={{ marginLeft: '50px' }}><strong>{myRecipient.volunteer_selections.reduce((total, selection) => total + selection.count, 0)} in total</strong></span>
                                    </div>
                                    {myRecipient.volunteer_selections.map((selection, index) => (
                                      <div key={index} className="commitment-popup-item">
                                        <span className="commitment-popup-expertise">{selection.expertise}</span>
                                        <span className="commitment-popup-count">{selection.count} volunteers</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {error && <div style={{ color: '#e74c3c', fontSize: '15px', marginTop: 20, textAlign: 'center' }}>{error}</div>}
      </div>
    </AssociateLayout>
  );
}

export default Notification; 