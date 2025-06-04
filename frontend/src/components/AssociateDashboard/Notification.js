import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';

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
      <h2>NOTIFICATION/INBOX</h2>
      {notifications.map(n => {
        const userId = Number(localStorage.getItem('userId'));
        const myRecipient = n.recipients && n.recipients.find(r => r.user_id === userId);
        return (
          <div key={n.id} style={{ border: '1px solid #ccc', marginBottom: 8, borderRadius: 4, padding: 12 }}>
            <div style={{ fontWeight: 'bold' }}>{n.title}</div>
            <div>{n.description}</div>
            <div style={{ margin: '8px 0' }}>
              <ProgressBar recipients={n.recipients} />
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
                {n.recipients && n.recipients.length > 1 && (
                  <>
                    Recipients: {n.recipients.map(r => r.user && r.user.name ? r.user.name : '').filter(Boolean).join(', ')}
                  </>
                )}
              </div>
            </div>
            {myRecipient && !myRecipient.response && (
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ background: 'blue', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px' }} onClick={() => handleRespond(n.id, 'accept')} disabled={loading}>ACCEPT</button>
                <button style={{ background: 'red', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px' }} onClick={() => handleRespond(n.id, 'decline')} disabled={loading}>DECLINE</button>
              </div>
            )}
            {myRecipient && myRecipient.response && (
              <div style={{ color: myRecipient.response === 'accept' ? 'green' : 'red', fontWeight: 'bold' }}>
                You responded: {myRecipient.response.toUpperCase()}
              </div>
            )}
          </div>
        );
      })}
      {error && <div style={{ color: 'red' }}>{error}</div>}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
        <span style={{ color: '#222' }}>CONFIRMED {accepted} ASSOCIATES</span>
        <span style={{ color: '#888' }}>DECLINED {declined} ASSOCIATES</span>
      </div>
      <div style={{ width: '100%', background: '#eee', borderRadius: 8, height: 18, position: 'relative' }}>
        <div style={{ width: percent + '%', background: 'green', height: '100%', borderRadius: 8 }} />
        <span style={{ position: 'absolute', left: 8, top: 0, fontSize: 12, color: 'black' }}>{percent}% RESPONDED</span>
      </div>
    </>
  );
}

export default Notification; 