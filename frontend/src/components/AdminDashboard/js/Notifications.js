import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import dayjs from 'dayjs';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', volunteers_needed: '', associate_ids: [] });
  const [associates, setAssociates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectAll, setSelectAll] = useState(false);
  const [filterType, setFilterType] = useState('none');
  const [filterValue, setFilterValue] = useState('');

  // Fetch notifications
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
  }, [showModal]);

  // Fetch associates for selection
  useEffect(() => {
    fetch('http://localhost:8000/api/members', { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } })
      .then(res => res.json())
      .then(setAssociates);
  }, []);

  const openModal = () => {
    setForm({ title: '', description: '', volunteers_needed: '', associate_ids: [] });
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

  useEffect(() => {
    setSelectAll(form.associate_ids.length === associates.length && associates.length > 0);
  }, [form.associate_ids, associates]);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        associate_ids: form.associate_ids.map(id => Number(id)),
      };
      const res = await fetch('http://localhost:8000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create notification');
      setShowModal(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async id => {
    if (!window.confirm('Are you sure you want to remove this notification?')) return;
    await fetch(`http://localhost:8000/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
    });
    setNotifications(notifications.filter(n => n.id !== id));
  };

  // Helper to filter notifications
  const filterNotifications = (notifications) => {
    if (filterType === 'none' || !filterValue) return notifications;
    return notifications.filter(n => {
      if (!n.created_at) return false;
      const created = dayjs(n.created_at);
      if (filterType === 'date') {
        return created.format('YYYY-MM-DD') === filterValue;
      } else if (filterType === 'time') {
        return created.format('HH:mm') === filterValue;
      } else if (filterType === 'datetime') {
        return created.format('YYYY-MM-DDTHH:mm') === filterValue;
      } else if (filterType === 'month') {
        return created.format('YYYY-MM') === filterValue;
      }
      return true;
    });
  };

  return (
    <AdminLayout>
      <h2 style={{ 
        fontWeight: '600', 
        marginBottom: 16,
        fontSize: '24px',
        color: '#1a1a1a',
        letterSpacing: '0.5px'
      }}>NOTIFICATIONS</h2>
      {/* Filter Bar */}
      <div style={{ 
        marginBottom: 24, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 16,
        padding: '12px 16px',
        background: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <span style={{ 
          fontWeight: '600', 
          color: '#2c3e50',
          fontSize: '14px'
        }}>Filters:</span>
        <select 
          value={filterType} 
          onChange={e => { setFilterType(e.target.value); setFilterValue(''); }} 
          style={{ 
            padding: '8px 12px', 
            borderRadius: 6,
            border: '1px solid #e0e0e0',
            fontSize: '14px',
            color: '#2c3e50',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          <option value="none">None</option>
          <option value="date">Date Only</option>
          <option value="time">Time Only</option>
          <option value="datetime">Date & Time</option>
          <option value="month">Month</option>
        </select>
        {filterType === 'date' && (
          <input 
            type="date" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              color: '#2c3e50'
            }}
          />
        )}
        {filterType === 'time' && (
          <input 
            type="time" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              color: '#2c3e50'
            }}
          />
        )}
        {filterType === 'datetime' && (
          <input 
            type="datetime-local" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              color: '#2c3e50'
            }}
          />
        )}
        {filterType === 'month' && (
          <input 
            type="month" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e0e0e0',
              fontSize: '14px',
              color: '#2c3e50'
            }}
          />
        )}
        {(filterType !== 'none' && filterValue) && (
          <button 
            onClick={() => { setFilterType('none'); setFilterValue(''); }} 
            style={{ 
              background: '#f1f3f5', 
              border: '1px solid #e0e0e0',
              borderRadius: 6, 
              padding: '8px 16px', 
              cursor: 'pointer',
              fontSize: '14px',
              color: '#2c3e50',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >Clear</button>
        )}
        <button 
          style={{ 
            marginLeft: 'auto',
            background: '#1976d2', 
            color: 'white', 
            border: 'none', 
            borderRadius: 6, 
            padding: '10px 20px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            letterSpacing: '0.3px',
            boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
            transition: 'all 0.2s ease'
          }} 
          onClick={openModal}
        >
          Add Notification
        </button>
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
      {filterNotifications(notifications).map(n => (
        <NotificationDropdown key={n.id} notification={n} onRemove={handleRemove} />
      ))}
      {showModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-card enhanced-modal">
            <div className="profile-modal-header" style={{ background: '#A11C22', borderRadius: '14px 14px 0 0', padding: '18px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '-32px -28px 0 -28px' }}>
              <h3 style={{ color: '#fff', fontWeight: 700, fontSize: '1.3rem', margin: 0 }}>Add Notification</h3>
              <span className="close-icon" style={{ color: '#fff' }} onClick={closeModal}>&times;</span>
            </div>
            <form className="add-edit-form enhanced-form" onSubmit={handleSubmit}>
              <div className="step-content">
                <div className="step-header">
                  <span style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 12 }}>
                    <svg width="48" height="48" fill="#A11C22" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7v3.586l.707.707A1 1 0 0 1 19.293 16H4.707a1 1 0 0 1-.707-1.707L4.707 12.586V9a7 7 0 0 1 7-7zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z"/></svg>
                  </span>
                  <h4>Notification Details</h4>
                  <p>Fill out the details to notify associates and request volunteers.</p>
                </div>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Title *</label>
                    <input 
                      name="title" 
                      value={form.title} 
                      onChange={handleChange} 
                      required 
                      placeholder="Enter notification title"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Description *</label>
                    <textarea 
                      name="description" 
                      value={form.description} 
                      onChange={handleChange} 
                      required
                      placeholder="Enter notification description"
                      rows="3"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Select Associate/s to Notify</label>
                    <div style={{ border: '1px solid #e0e0e0', borderRadius: '6px', padding: '12px', maxHeight: '150px', overflowY: 'auto', background: '#f8f9fa' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectAll} 
                          onChange={handleSelectAll} 
                          id="selectAll"
                          style={{ marginRight: '8px' }}
                        />
                        <label htmlFor="selectAll" style={{ fontWeight: 600, color: '#2c3e50', fontSize: '14px', cursor: 'pointer' }}>Select All</label>
                      </div>
                      {associates.map(a => (
                        <div key={a.id} style={{ marginBottom: '6px' }}>
                          <input
                            type="checkbox"
                            checked={form.associate_ids.includes(a.id)}
                            onChange={() => handleAssociateChange(a.id)}
                            id={`associate_${a.id}`}
                            style={{ marginRight: '8px' }}
                          />
                          <label htmlFor={`associate_${a.id}`} style={{ color: '#495057', fontSize: '14px', cursor: 'pointer' }}>{a.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Number of Volunteers Needed</label>
                    <input 
                      name="volunteers_needed" 
                      type="number" 
                      value={form.volunteers_needed} 
                      onChange={handleChange} 
                      placeholder="Enter number of volunteers needed"
                    />
                  </div>
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
              <div className="form-actions">
                <button type="button" className="btn-prev" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-submit" style={{ background: '#A11C22' }} disabled={loading}>
                  {loading ? 'Creating...' : 'Create Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
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

function NotificationDropdown({ notification, onRemove }) {
  const [open, setOpen] = useState(false);
  const accepted = notification.recipients ? notification.recipients.filter(r => r.response === 'accept').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  const declined = notification.recipients ? notification.recipients.filter(r => r.response === 'decline').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  return (
    <div style={{ 
      border: '1px solid #e0e0e0', 
      marginBottom: 16, 
      borderRadius: 8, 
      background: '#fff', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      transition: 'all 0.2s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '16px 20px', 
        cursor: 'pointer',
        borderBottom: open ? '1px solid #e0e0e0' : 'none'
      }} onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ 
            fontWeight: '600', 
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: 4
          }}>{notification.title}</div>
          <div style={{ 
            fontSize: '13px',
            color: '#6c757d'
          }}>{dayjs(notification.created_at).format('MMM D, YYYY h:mm A')}</div>
        </div>
        <div style={{ 
          fontSize: '16px',
          color: '#6c757d',
          transition: 'transform 0.2s ease'
        }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ padding: '20px' }}>
          <div style={{ 
            color: '#495057', 
            marginBottom: 16,
            fontSize: '14px',
            lineHeight: '1.5'
          }}>{notification.description}</div>
          <ProgressBar recipients={notification.recipients} />
          <div style={{ 
            display: 'flex', 
            gap: 24, 
            margin: '16px 0' 
          }}>
            <div style={{ minWidth: 200 }}>
              <div style={{ 
                fontWeight: '600', 
                color: '#2ecc71', 
                marginBottom: 8,
                fontSize: '14px'
              }}>Accepted ({accepted.length})</div>
              <ul style={{ 
                margin: 0, 
                padding: '12px 16px', 
                background: '#f8f9fa', 
                borderRadius: 6, 
                border: '1px solid #e0e0e0', 
                listStyle: 'disc',
                fontSize: '13px',
                color: '#495057'
              }}>
                {accepted.length === 0 ? <li style={{ color: '#6c757d' }}>None</li> : accepted.map(name => <li key={name}>{name}</li>)}
              </ul>
            </div>
            <div style={{ minWidth: 200 }}>
              <div style={{ 
                fontWeight: '600', 
                color: '#e74c3c', 
                marginBottom: 8,
                fontSize: '14px'
              }}>Declined ({declined.length})</div>
              <ul style={{ 
                margin: 0, 
                padding: '12px 16px', 
                background: '#f8f9fa', 
                borderRadius: 6, 
                border: '1px solid #e0e0e0', 
                listStyle: 'disc',
                fontSize: '13px',
                color: '#495057'
              }}>
                {declined.length === 0 ? <li style={{ color: '#6c757d' }}>None</li> : declined.map(name => <li key={name}>{name}</li>)}
              </ul>
            </div>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            marginTop: 16 
          }}>
            <button 
              onClick={() => onRemove(notification.id)} 
              style={{ 
                background: '#e74c3c', 
                color: 'white', 
                border: 'none', 
                borderRadius: 6, 
                padding: '8px 20px', 
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(231, 76, 60, 0.2)'
              }}
            >REMOVE</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications; 