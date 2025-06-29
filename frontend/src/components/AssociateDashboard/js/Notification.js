import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import dayjs from 'dayjs';

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
    fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
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
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
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
      <div className="volunteer-list-container">
        <div className="header-section" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 0 }}>
          <h2 style={{ fontWeight: 800, fontSize: '2.2rem', color: '#1e293b', margin: 0, letterSpacing: '-0.03em', textShadow: '0 2px 8px rgba(30,41,59,0.04)', flexShrink: 0 }}>
            NOTIFICATION/INBOX
          </h2>
          <div style={{ position: 'relative', flex: 1, minWidth: 0, maxWidth: 320, marginRight: 65 }}>
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: '#94a3b8', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search notification title ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                fontSize: 16,
                padding: '10px 16px 10px 48px',
                borderRadius: 12,
                border: '1.5px solid #e2e8f0',
                minWidth: 0,
                width: '100%',
                maxWidth: 320,
                background: '#f8fafc',
                boxShadow: '0 1px 6px rgba(30,41,59,0.06)',
                outline: 'none',
                transition: 'border 0.2s, box-shadow 0.2s',
              }}
              onFocus={e => e.target.style.border = '1.5px solid #3b82f6'}
              onBlur={e => e.target.style.border = '1.5px solid #e2e8f0'}
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
            <div style={{
              display: 'flex',
              gap: 18,
              margin: '14px 0 28px 0',
              fontSize: 15,
              fontWeight: 600,
              color: '#374151',
              background: '#f8fafc',
              borderRadius: 12,
              padding: '10px 18px',
              boxShadow: '0 1px 6px rgba(30,41,59,0.04)',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Total:
                <span style={{ background: '#fdecea', color: '#b71c1c', fontWeight: 700, borderRadius: 16, padding: '3px 14px', fontSize: 15, marginLeft: 2, boxShadow: '0 1px 3px rgba(183,28,28,0.07)' }}>{total}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                No Response:
                <span style={{ background: '#fff4e6', color: '#e67e22', fontWeight: 700, borderRadius: 16, padding: '3px 14px', fontSize: 15, marginLeft: 2, boxShadow: '0 1px 3px rgba(230,126,34,0.07)' }}>{notResponded}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Responded:
                <span style={{ background: '#e3f2fd', color: '#1976d2', fontWeight: 700, borderRadius: 16, padding: '3px 14px', fontSize: 15, marginLeft: 2, boxShadow: '0 1px 3px rgba(25,118,210,0.07)' }}>{responded}</span>
              </span>
            </div>
          );
        })()}
        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', marginTop: 80, fontSize: 18, fontStyle: 'italic', width: '100%' }}>
            Loading inbox ...
          </div>
        ) : (
          <>
            {filteredNotifications.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6c757d', marginTop: 80, fontSize: '15px', fontStyle: 'italic', width: '100%' }}>
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
                      style={{
                        border: isOpen ? '2px solid #b71c1c' : '1px solid #e0e0e0',
                        marginBottom: 32,
                        borderRadius: 16,
                        background: '#fff',
                        boxShadow: isOpen ? '0 4px 16px rgba(183,28,28,0.07)' : '0 4px 16px rgba(25, 118, 210, 0.07)',
                        transition: 'box-shadow 0.2s, border 0.2s',
                        padding: 0,
                        position: 'relative',
                        overflow: 'hidden',
                        width: '100%',
                        marginLeft: 0,
                        marginRight: 0,
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpanded(isOpen ? null : n.id)}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '18px 28px',
                        borderBottom: isOpen ? '1px solid #e0e0e0' : 'none',
                        background: '#fff',
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16
                      }}>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{
                            fontWeight: 700,
                            fontSize: '1.4rem',
                            color: '#b71c1c',
                            marginBottom: 4,
                            letterSpacing: '-0.01em',
                            textShadow: isOpen ? '0 2px 8px rgba(183,28,28,0.04)' : 'none',
                          }}>{n.title}</div>
                          <div style={{ fontSize: '16px', color: '#888', fontWeight: 500 }}>{dayjs(n.created_at).format('MMM D, YYYY h:mm A')}</div>
                        </div>
                        <div style={{
                          fontSize: 22,
                          color: '#b71c1c',
                          fontWeight: 700,
                          userSelect: 'none',
                          transition: 'transform 0.2s',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          marginLeft: 12,
                          marginTop: 2
                        }}>
                          ▼
                        </div>
                      </div>
                      {isOpen && (
                        <div style={{ padding: '28px 28px 18px 28px' }}>
                          <div style={{ color: '#495057', marginBottom: 18, fontSize: '15px', lineHeight: '1.7', letterSpacing: '0.01em' }}>{n.description}</div>
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
                              }} onClick={e => { e.stopPropagation(); handleRespond(n.id, 'accept'); }} disabled={loading}>ACCEPT</button>
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
                              }} onClick={e => { e.stopPropagation(); handleRespond(n.id, 'decline'); }} disabled={loading}>DECLINE</button>
                            </div>
                          )}
                          {myRecipient && myRecipient.response && (
                            <div style={{
                              color: myRecipient.response === 'accept' ? '#2ecc71' : '#e74c3c',
                              fontWeight: 'bold',
                              fontSize: '15px',
                              marginTop: 16
                            }}>
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