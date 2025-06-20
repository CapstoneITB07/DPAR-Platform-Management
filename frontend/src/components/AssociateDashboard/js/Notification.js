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
      <h2 style={{
        fontWeight: '600',
        marginBottom: 16,
        fontSize: '24px',
        color: '#1a1a1a',
        letterSpacing: '0.5px'
      }}>NOTIFICATION/INBOX</h2>
      {notifications.length === 0 && (
        <div style={{
          textAlign: 'center',
          color: '#6c757d',
          marginTop: 32,
          fontSize: '15px',
          fontStyle: 'italic'
        }}>No notifications yet.</div>
      )}
      {notifications.map(n => {
        const userId = Number(localStorage.getItem('userId'));
        const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
        return (
          <div key={n.id} style={{
            border: '1px solid #e0e0e0',
            marginBottom: 16,
            borderRadius: 8,
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            transition: 'all 0.2s ease',
            padding: 0
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <div>
                <div style={{
                  fontWeight: '600',
                  fontSize: '16px',
                  color: '#2c3e50',
                  marginBottom: 4
                }}>{n.title}</div>
                <div style={{
                  fontSize: '13px',
                  color: '#6c757d'
                }}>{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{
                color: '#495057',
                marginBottom: 16,
                fontSize: '14px',
                lineHeight: '1.5'
              }}>{n.description}</div>
              <ProgressBar recipients={n.recipients} />
              <div style={{ fontSize: 12, color: '#555', marginTop: 2, marginBottom: 12 }}>
                {n.recipients && n.recipients.length > 1 && (
                  <>
                    Recipients: {n.recipients.map(r => r.user && r.user.name ? r.user.name : '').filter(Boolean).join(', ')}
                  </>
                )}
              </div>
              {myRecipient && !myRecipient.response && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={{
                    background: '#1976d2',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)'
                  }} onClick={() => handleRespond(n.id, 'accept')} disabled={loading}>ACCEPT</button>
                  <button style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 20px',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)'
                  }} onClick={() => handleRespond(n.id, 'decline')} disabled={loading}>DECLINE</button>
                </div>
              )}
              {myRecipient && myRecipient.response && (
                <div style={{
                  color: myRecipient.response === 'accept' ? '#2ecc71' : '#e74c3c',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  marginTop: 12
                }}>
                  You responded: {myRecipient.response.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {error && <div style={{ color: '#e74c3c', fontSize: '14px', marginTop: 16 }}>{error}</div>}
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
        fontSize: '13px',
        marginBottom: 4,
        color: '#495057'
      }}>
        <span style={{ fontWeight: '500' }}>CONFIRMED {accepted} ASSOCIATES</span>
        <span style={{ color: '#6c757d' }}>DECLINED {declined} ASSOCIATES</span>
      </div>
      <div style={{
        width: '100%',
        background: '#e9ecef',
        borderRadius: 8,
        height: 20,
        position: 'relative',
        marginBottom: 8,
        overflow: 'hidden'
      }}>
        <div style={{
          width: percent + '%',
          background: '#2ecc71',
          height: '100%',
          borderRadius: 8,
          transition: 'width 0.3s ease'
        }} />
        <span style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '12px',
          color: '#fff',
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>{percent}% RESPONDED</span>
      </div>
    </>
  );
}

export default Notification; 