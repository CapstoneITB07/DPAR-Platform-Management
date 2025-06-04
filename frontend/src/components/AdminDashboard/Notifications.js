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
      <h2 style={{ fontWeight: 'bold', marginBottom: 8 }}>NOTIFICATIONS</h2>
      <div style={{ marginBottom: 16 }}>
        <button style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: 20, width: 32, height: 32, fontSize: 24 }} onClick={openModal}>+</button>
      </div>
      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', color: '#888', marginTop: 32 }}>No notifications yet.</div>
      )}
      {/* Filter Bar */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontWeight: 'bold' }}>Filters:</span>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterValue(''); }} style={{ padding: '4px 8px', borderRadius: 4 }}>
          <option value="none">None</option>
          <option value="date">Date Only</option>
          <option value="time">Time Only</option>
          <option value="datetime">Date & Time</option>
          <option value="month">Month</option>
        </select>
        {filterType === 'date' && (
          <input type="date" value={filterValue} onChange={e => setFilterValue(e.target.value)} />
        )}
        {filterType === 'time' && (
          <input type="time" value={filterValue} onChange={e => setFilterValue(e.target.value)} />
        )}
        {filterType === 'datetime' && (
          <input type="datetime-local" value={filterValue} onChange={e => setFilterValue(e.target.value)} />
        )}
        {filterType === 'month' && (
          <input type="month" value={filterValue} onChange={e => setFilterValue(e.target.value)} />
        )}
        {(filterType !== 'none' && filterValue) && (
          <button onClick={() => { setFilterType('none'); setFilterValue(''); }} style={{ marginLeft: 8, background: '#eee', border: 'none', borderRadius: 4, padding: '4px 8px', cursor: 'pointer' }}>Clear</button>
        )}
      </div>
      {filterNotifications(notifications).map(n => (
        <NotificationDropdown key={n.id} notification={n} onRemove={handleRemove} />
      ))}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 350, maxWidth: 400 }} onSubmit={handleSubmit}>
            <h3 style={{ textAlign: 'center', fontWeight: 'bold' }}>Create Notification</h3>
            <div>
              <label>Title</label>
              <input name="title" value={form.title} onChange={handleChange} required style={{ width: '100%' }} />
            </div>
            <div>
              <label>Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            <div style={{ margin: '8px 0' }}>
              <label>Select Associate/s to Notify</label>
              <div style={{ border: '1px solid #ccc', borderRadius: 4, padding: 8, maxHeight: 120, overflowY: 'auto', background: '#fafafa' }}>
                <div>
                  <input type="checkbox" checked={selectAll} onChange={handleSelectAll} id="selectAll" />
                  <label htmlFor="selectAll" style={{ marginLeft: 4, fontWeight: 'bold' }}>Select All</label>
                </div>
                {associates.map(a => (
                  <div key={a.id}>
                    <input
                      type="checkbox"
                      checked={form.associate_ids.includes(a.id)}
                      onChange={() => handleAssociateChange(a.id)}
                      id={`associate_${a.id}`}
                    />
                    <label htmlFor={`associate_${a.id}`} style={{ marginLeft: 4 }}>{a.name}</label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label>Number of Volunteers Needed</label>
              <input name="volunteers_needed" type="number" value={form.volunteers_needed} onChange={handleChange} style={{ width: '100%' }} />
            </div>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={closeModal} style={{ background: 'red', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ background: 'blue', color: 'white', border: 'none', borderRadius: 4, padding: '8px 16px' }}>Create</button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
        <span style={{ color: '#222' }}>CONFIRMED {accepted} ASSOCIATES</span>
        <span style={{ color: '#888' }}>DECLINED {declined} ASSOCIATES</span>
      </div>
      <div style={{ width: '100%', background: '#eee', borderRadius: 8, height: 18, position: 'relative', marginBottom: 4 }}>
        <div style={{ width: percent + '%', background: 'green', height: '100%', borderRadius: 8 }} />
        <span style={{ position: 'absolute', left: 8, top: 0, fontSize: 12, color: 'black' }}>{percent}% RESPONDED</span>
      </div>
    </>
  );
}

function NotificationDropdown({ notification, onRemove }) {
  const [open, setOpen] = useState(false);
  const accepted = notification.recipients ? notification.recipients.filter(r => r.response === 'accept').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  const declined = notification.recipients ? notification.recipients.filter(r => r.response === 'decline').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  return (
    <div style={{ border: '1px solid #ccc', marginBottom: 12, borderRadius: 6, background: '#fff', boxShadow: '0 2px 6px #0001' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{notification.title}</div>
        </div>
        <div style={{ fontSize: 20 }}>{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px 16px' }}>
          <div style={{ color: '#444', marginBottom: 8 }}>{notification.description}</div>
          <ProgressBar recipients={notification.recipients} />
          <div style={{ display: 'flex', gap: 12, margin: '8px 0' }}>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontWeight: 'bold', color: '#1976d2', marginBottom: 2 }}>Accepted ({accepted.length})</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', background: '#fafafa', borderRadius: 4, border: '1px solid #eee', listStyle: 'disc' }}>
                {accepted.length === 0 ? <li style={{ color: '#888' }}>None</li> : accepted.map(name => <li key={name}>{name}</li>)}
              </ul>
            </div>
            <div style={{ minWidth: 120 }}>
              <div style={{ fontWeight: 'bold', color: '#c0392b', marginBottom: 2 }}>Declined ({declined.length})</div>
              <ul style={{ margin: 0, padding: '0 0 0 16px', background: '#fafafa', borderRadius: 4, border: '1px solid #eee', listStyle: 'disc' }}>
                {declined.length === 0 ? <li style={{ color: '#888' }}>None</li> : declined.map(name => <li key={name}>{name}</li>)}
              </ul>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button onClick={() => onRemove(notification.id)} style={{ background: '#c0392b', color: 'white', border: 'none', borderRadius: 4, padding: '4px 16px', fontWeight: 'bold' }}>REMOVE</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications; 