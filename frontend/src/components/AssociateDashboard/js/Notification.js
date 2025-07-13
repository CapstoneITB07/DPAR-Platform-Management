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

  const handleRespond = async (id, response) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/notifications/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ response })
      });
      if (!res.ok) throw new Error('Failed to respond');
      setLoading(false);
      setReload(r => !r);
    } catch (err) {
      setError(err.message);
      setLoading(false);
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
        {loading ? (
          <div className="notification-loading">
            Loading inbox ...
          </div>
        ) : (
          <>
            {filteredNotifications.length === 0 ? (
              <div className="notification-empty">
                No notifications found.
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                {filteredNotifications.map((n, idx) => {
                  const userId = Number(localStorage.getItem('userId'));
                  const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
                  const isOpen = expanded === n.id;
            return (
                    <div
                      key={n.id}
                      className={`notification-item ${isOpen ? 'expanded' : ''}`}
                      onClick={() => setExpanded(isOpen ? null : n.id)}
              >
                <div className="notification-item-header">
                  <div style={{ textAlign: 'left' }}>
                    <div className="notification-item-title">{n.title}</div>
                          <div className="notification-item-date">{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>
                        </div>
                    <div className={`notification-item-arrow ${isOpen ? 'expanded' : ''}`}>
                          ▼
                  </div>
                </div>
                      {isOpen && (
                <div className="notification-item-content">
                          <div className="notification-item-description">{n.description}</div>
                  <ProgressBar recipients={n.recipients} />
                  <div className="notification-item-recipients">
                    {n.recipients && n.recipients.length > 1 && (
                      <>
                        <span className="notification-item-recipients-label">Recipients:</span> <span className="notification-item-recipients-value">{n.recipients.map(r => r.user && r.user.name ? r.user.name : '').filter(Boolean).join(', ')}</span>
                      </>
                    )}
                  </div>
                  {myRecipient && !myRecipient.response && (
                    <div className="notification-item-actions">
                      <button className="notification-item-action accept" onClick={e => { e.stopPropagation(); handleRespond(n.id, 'accept'); }} disabled={loading}>ACCEPT</button>
                      <button className="notification-item-action decline" onClick={e => { e.stopPropagation(); handleRespond(n.id, 'decline'); }} disabled={loading}>DECLINE</button>
                    </div>
                  )}
                  {myRecipient && myRecipient.response && (
                    <div className={`notification-item-response ${myRecipient.response}`}>
                              Action: {myRecipient.response.toUpperCase()}
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

function ProgressBar({ recipients }) {
  if (!recipients || recipients.length === 0) return null;
  const total = recipients.length;
  const responded = recipients.filter(r => r.response).length;
  const percent = Math.round((responded / total) * 100);
  const accepted = recipients.filter(r => r.response === 'accept').length;
  const declined = recipients.filter(r => r.response === 'decline').length;
  return (
    <>
      <div className="notification-item-progress-bar-text">
        <span className="notification-item-progress-bar-text-confirmed">CONFIRMED {accepted} ASSOCIATES</span>
        <span className="notification-item-progress-bar-text-declined">DECLINED {declined} ASSOCIATES</span>
      </div>
      <div className="notification-item-progress-bar">
        <div className="notification-item-progress-bar-fill" style={{ width: percent + '%' }} />
        <span className="notification-item-progress-bar-percentage">{percent}% RESPONDED</span>
      </div>
    </>
  );
}

export default Notification; 