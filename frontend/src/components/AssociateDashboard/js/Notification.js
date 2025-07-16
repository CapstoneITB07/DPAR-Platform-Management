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
                      <div className="notification-item-header" onClick={() => setExpanded(isOpen ? null : n.id)}>
                        <div className="notification-item-title">{n.title}</div>
                        <div className="notification-item-date">{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>
                        <div className="notification-item-arrow">{isOpen ? '▲' : '▼'}</div>
                      </div>
                      {isOpen && (
                        <div className="notification-item-content">
                          <div className="notification-item-description">{n.description}</div>
                          
                          {/* Volunteer Requirements Display */}
                          {n.expertise_requirements && n.expertise_requirements.length > 0 && (
                            <div className="notification-volunteer-requirements">
                              <div className="volunteer-requirements-title">Volunteers Needed:</div>
                              {n.expertise_requirements.map((req, index) => (
                                <div key={index} className="volunteer-requirement-display">
                                  <span className="expertise-name">{req.expertise}</span>
                                  <span className="expertise-count">{req.count} needed</span>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="notification-item-recipients">
                            {n.recipients && n.recipients.length > 1 && (
                              <>
                                <span className="notification-item-recipients-label">Recipients:</span> <span className="notification-item-recipients-value">{n.recipients.map(r => r.user && r.user.name ? r.user.name : '').filter(Boolean).join(', ')}</span>
                              </>
                            )}
                          </div>
                          
                          {myRecipient && !myRecipient.response && (
                            <div className="notification-item-actions">
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
                          )}
                          
                          {myRecipient && myRecipient.response && (
                            <div className="notification-item-response">
                              <div className={`response-status ${myRecipient.response}`}>
                                Action: {myRecipient.response.toUpperCase()}
                              </div>
                              {myRecipient.response === 'accept' && myRecipient.volunteer_selections && (
                                <div className="volunteer-selections-display">
                                  <div className="volunteer-selections-title">Your Volunteer Commitments:</div>
                                  {myRecipient.volunteer_selections.map((selection, index) => (
                                    <div key={index} className="volunteer-selection-display">
                                      <span className="selection-expertise">{selection.expertise}</span>
                                      <span className="selection-count">{selection.count} volunteers</span>
                                    </div>
                                  ))}
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