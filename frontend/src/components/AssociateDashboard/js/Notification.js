import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import dayjs from 'dayjs';
import '../css/Notification.css';

const NOTIF_READ_KEY = 'associateNotifRead';

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reload, setReload] = useState(false);
  const [volunteerSelections, setVolunteerSelections] = useState({});

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
  }, [reload]);

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
      if (!res.ok) throw new Error('Failed to respond');
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
            <span>Loading notifications...</span>
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
                      <div className="notification-item-header" onClick={() => setExpanded(isOpen ? null : n.id)} style={{ textAlign: 'left' }}>
                        <div style={{ textAlign: 'left' }}>
                          <div className="notification-item-title" style={{ textAlign: 'left' }}>{n.title}</div>
                          <div className="notification-item-date" style={{ textAlign: 'left' }}>{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>
                        </div>
                        <div className="notification-item-arrow">{isOpen ? '▲' : '▼'}</div>
                      </div>
                      {isOpen && (
                        <div className="notification-item-content">
                          <div className="notification-item-description">{n.description}</div>
                          
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
                          
                          {/* Progress Tracker */}
                          {n.expertise_requirements && n.expertise_requirements.length > 0 && (
                            <div className="notification-progress-container">
                              <div className="notification-progress-title">Volunteer Progress</div>
                              <div className="notification-progress-overview">
                                <div className="notification-progress-stat">
                                  <div className="notification-progress-label">Provided</div>
                                  <div className="notification-progress-number">0</div>
                                </div>
                                <div className="notification-progress-bar-container">
                                  <div className="notification-progress-bar">
                                    <div 
                                      className="notification-progress-fill" 
                                      style={{ width: '0%' }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="notification-progress-stat">
                                  <div className="notification-progress-label">Remaining</div>
                                  <div className="notification-progress-number">
                                    {n.expertise_requirements.reduce((total, req) => total + (parseInt(req.count) || 0), 0)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {myRecipient && !myRecipient.response && (
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
                                          max={req.count}
                                          value={volunteerSelections[n.id]?.[req.expertise] || ''}
                                          onChange={(e) => handleVolunteerSelection(n.id, req.expertise, e.target.value)}
                                          className="volunteer-selection-input"
                                          placeholder={`0-${req.count}`}
                                        />
                                        <div className="volunteer-selection-max">max {req.count}</div>
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
                                    {canAccept(n) ? 'CONFIRM VOLUNTEERS' : 'SELECT AT LEAST ONE EXPERTISE'}
                                  </button>
                                  <button 
                                    className="notification-item-action decline" 
                                    onClick={e => { e.stopPropagation(); handleRespond(n.id, 'decline'); }} 
                                    disabled={loading}
                                  >
                                    DECLINE
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                          
                          {myRecipient && myRecipient.response && (
                            <div className={`volunteer-commitments-hover-container ${myRecipient.response}`}>
                              <div className="volunteer-commitments-trigger">
                                <div className={`response-status ${myRecipient.response}`}>
                                  Action: {myRecipient.response.toUpperCase()}
                                </div>
                              </div>
                              {myRecipient.response === 'accept' && myRecipient.volunteer_selections && (
                                <div className="volunteer-commitments-popup">
                                  <div className="commitments-popup-content">
                                    <div className="popup-title">Your Volunteer Commitments:</div>
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