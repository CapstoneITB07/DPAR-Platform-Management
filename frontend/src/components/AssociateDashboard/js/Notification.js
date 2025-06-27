import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import dayjs from 'dayjs';

const NOTIF_READ_KEY = 'associateNotifRead';

function Notification() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
        } else {
          setNotifications([]);
        }
      });
  }, [loading]);

  const handleRespond = async (id, response) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:8000/api/notifications/${id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ response })
      });
      if (!res.ok) throw new Error('Failed to respond');
      setLoading(false);
      fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
          } else {
            setNotifications([]);
          }
        });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <AssociateLayout>
      <div className="volunteer-list-container">
        <div className="header-section">
          <div className="header-left">
            <h2>NOTIFICATION/INBOX</h2>
          </div>
        </div>
        {notifications.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#6c757d',
            marginTop: 32,
            fontSize: '15px',
            fontStyle: 'italic'
          }}>No notifications yet.</div>
        )}
        <div style={{ width: '100%' }}>
          {notifications.map((n, idx) => {
            const userId = Number(localStorage.getItem('userId'));
            const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
            return (
              <div key={n.id} style={{
                border: '1px solid #e0e0e0',
                marginBottom: 32,
                borderRadius: 14,
                background: '#fff',
                boxShadow: '0 4px 16px rgba(25, 118, 210, 0.07)',
                transition: 'box-shadow 0.2s',
                padding: 0,
                position: 'relative',
                overflow: 'hidden',
                width: '100%',
                marginLeft: 0,
                marginRight: 0,
              }}
                onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(25, 118, 210, 0.13)'}
                onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(25, 118, 210, 0.07)'}
              >
                <div style={{
                  padding: '18px 28px',
                  borderBottom: '1px solid #e0e0e0',
                  background: '#f8fafc',
                  borderTopLeftRadius: 14,
                  borderTopRightRadius: 14
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{
                      fontWeight: '700',
                      fontSize: '18px',
                      color: '#2c3e50',
                      marginBottom: 4
                    }}>{n.title}</div>
                    <div style={{
                      fontSize: '13px',
                      color: '#6c757d'
                    }}>{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>
                  </div>
                </div>
                <div style={{ padding: '28px 28px 18px 28px' }}>
                  <div style={{
                    color: '#495057',
                    marginBottom: 18,
                    fontSize: '15px',
                    lineHeight: '1.7',
                    letterSpacing: '0.01em'
                  }}>{n.description}</div>
                  <ProgressBar recipients={n.recipients} />
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4, marginBottom: 16, wordBreak: 'break-word' }}>
                    {n.recipients && n.recipients.length > 1 && (
                      <>
                        <span style={{ fontWeight: 500, color: '#1976d2' }}>Recipients:</span> <span style={{ color: '#333' }}>{n.recipients.map(r => r.user && r.user.name ? r.user.name : '').filter(Boolean).join(', ')}</span>
                      </>
                    )}
                  </div>
                  {myRecipient && !myRecipient.response && (
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <button style={{
                        background: 'linear-gradient(90deg, #1976d2 60%, #42a5f5 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 28px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(25, 118, 210, 0.13)'
                      }} onClick={() => handleRespond(n.id, 'accept')} disabled={loading}>ACCEPT</button>
                      <button style={{
                        background: 'linear-gradient(90deg, #e74c3c 60%, #ff7675 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        padding: '12px 28px',
                        fontWeight: '700',
                        fontSize: '15px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(231, 76, 60, 0.13)'
                      }} onClick={() => handleRespond(n.id, 'decline')} disabled={loading}>DECLINE</button>
                    </div>
                  )}
                  {myRecipient && myRecipient.response && (
                    <div style={{
                      color: myRecipient.response === 'accept' ? '#2ecc71' : '#e74c3c',
                      fontWeight: 'bold',
                      fontSize: '15px',
                      marginTop: 16
                    }}>
                      You responded: {myRecipient.response.toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Divider between notifications */}
                {idx !== notifications.length - 1 && (
                  <div style={{
                    height: 2,
                    background: 'linear-gradient(90deg, #e0e0e0 60%, #f8fafc 100%)',
                    width: '100%',
                    margin: 0
                  }} />
                )}
              </div>
            );
          })}
        </div>
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
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '14px',
        marginBottom: 6,
        color: '#495057',
        fontWeight: 500
      }}>
        <span style={{ color: '#2ecc71' }}>CONFIRMED {accepted} ASSOCIATES</span>
        <span style={{ color: '#e74c3c' }}>DECLINED {declined} ASSOCIATES</span>
      </div>
      <div style={{
        width: '100%',
        background: '#e9ecef',
        borderRadius: 10,
        height: 22,
        position: 'relative',
        marginBottom: 10,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(44,62,80,0.04)'
      }}>
        <div style={{
          width: percent + '%',
          background: 'linear-gradient(90deg, #2ecc71 60%, #b2f7cc 100%)',
          height: '100%',
          borderRadius: 10,
          transition: 'width 0.5s cubic-bezier(.4,2,.6,1)',
          boxShadow: '0 1px 4px rgba(46,204,113,0.08)'
        }} />
        <span style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '13px',
          color: '#fff',
          fontWeight: '700',
          textShadow: '0 1px 2px rgba(0,0,0,0.13)'
        }}>{percent}% RESPONDED</span>
      </div>
    </>
  );
}

export default Notification; 