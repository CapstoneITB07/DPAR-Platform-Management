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
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100vw', 
          height: '100vh', 
          background: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <form 
            style={{ 
              background: 'white', 
              padding: '32px', 
              borderRadius: '12px', 
              minWidth: '400px', 
              maxWidth: '500px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              animation: 'modalFadeIn 0.3s ease'
            }} 
            onSubmit={handleSubmit}
          >
            <h3 style={{ 
              textAlign: 'center', 
              fontWeight: '600',
              fontSize: '20px',
              color: '#1a1a1a',
              marginBottom: '24px'
            }}>Create Notification</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2c3e50',
                fontSize: '14px'
              }}>Title</label>
              <input 
                name="title" 
                value={form.title} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  color: '#2c3e50',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter notification title"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2c3e50',
                fontSize: '14px'
              }}>Description</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  color: '#2c3e50',
                  minHeight: '100px',
                  resize: 'vertical',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter notification description"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2c3e50',
                fontSize: '14px'
              }}>Select Associate/s to Notify</label>
              <div style={{ 
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                padding: '12px',
                maxHeight: '150px',
                overflowY: 'auto',
                background: '#f8f9fa'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={selectAll} 
                    onChange={handleSelectAll} 
                    id="selectAll"
                    style={{ marginRight: '8px' }}
                  />
                  <label 
                    htmlFor="selectAll" 
                    style={{ 
                      fontWeight: '600',
                      color: '#2c3e50',
                      fontSize: '14px',
                      cursor: 'pointer'
                    }}
                  >Select All</label>
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
                    <label 
                      htmlFor={`associate_${a.id}`} 
                      style={{ 
                        color: '#495057',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >{a.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#2c3e50',
                fontSize: '14px'
              }}>Number of Volunteers Needed</label>
              <input 
                name="volunteers_needed" 
                type="number" 
                value={form.volunteers_needed} 
                onChange={handleChange} 
                style={{ 
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  color: '#2c3e50',
                  transition: 'border-color 0.2s ease',
                  outline: 'none'
                }}
                placeholder="Enter number of volunteers needed"
              />
            </div>

            {error && (
              <div style={{ 
                color: '#e74c3c',
                fontSize: '14px',
                marginBottom: '16px',
                padding: '8px 12px',
                background: '#fdf3f2',
                borderRadius: '4px',
                border: '1px solid #fadbd8'
              }}>{error}</div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px'
            }}>
              <button 
                type="button" 
                onClick={closeModal} 
                style={{ 
                  background: '#f1f3f5',
                  color: '#495057',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >Cancel</button>
              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px 20px',
                  fontWeight: '600',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(25, 118, 210, 0.2)'
                }}
              >
                {loading ? 'Creating...' : 'Create Notification'}
              </button>
            </div>
          </form>
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