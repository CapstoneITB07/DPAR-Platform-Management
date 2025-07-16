import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import dayjs from 'dayjs';
import '../css/Notifications.css';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="notifications-success-notification">
      {message}
    </div>
  );
}

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
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const [notification, setNotification] = useState('');

  // Fetch notifications
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    fetch('http://localhost:8000/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
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
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    fetch('http://localhost:8000/api/members', { headers: { Authorization: `Bearer ${token}` } })
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
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await fetch('http://localhost:8000/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create notification');
      setShowModal(false);
      setNotification('Notification created successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async id => {
    if (!window.confirm('Are you sure you want to remove this notification?')) return;
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    await fetch(`http://localhost:8000/api/notifications/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    setNotifications(notifications.filter(n => n.id !== id));
    setNotification('Notification removed successfully!');
    setTimeout(() => setNotification(''), 2000);
  };

  // Helper to filter notifications
  const filterNotifications = (notifications) => {
    let filtered = notifications;
    if (filterType === 'date' && filterValue) {
      filtered = filtered.filter(n => {
        if (!n.created_at) return false;
        const created = dayjs(n.created_at);
        return created.format('YYYY-MM-DD') === filterValue;
      });
    } else if (filterType === 'month' && filterValue) {
      filtered = filtered.filter(n => {
        if (!n.created_at) return false;
        const created = dayjs(n.created_at);
        return created.format('YYYY-MM') === filterValue;
      });
    }
    // Sort
    filtered = filtered.slice().sort((a, b) => {
      if (sortOrder === 'asc') {
        return new Date(a.created_at) - new Date(b.created_at);
      } else {
        return new Date(b.created_at) - new Date(a.created_at);
      }
    });
    return filtered;
  };

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
      <h2 className="main-header" style={{ textAlign: 'left', marginLeft: 24 }}>NOTIFICATIONS</h2>
      {/* Filter Bar */}
      <div className="notification-filter-bar">
        <span className="notification-filter-label">Filters:</span>
        <select 
          value={filterType} 
          onChange={e => { setFilterType(e.target.value); setFilterValue(''); }} 
          className="notification-filter-select"
        >
          <option value="date">Date Only</option>
          <option value="month">Month</option>
        </select>
        {filterType === 'date' && (
          <input 
            type="date" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            className="notification-filter-input"
          />
        )}
        {filterType === 'month' && (
          <input 
            type="month" 
            value={filterValue} 
            onChange={e => setFilterValue(e.target.value)}
            className="notification-filter-input"
          />
        )}
        <select 
          value={sortOrder} 
          onChange={e => setSortOrder(e.target.value)} 
          className="notification-filter-select"
          style={{ marginLeft: 12 }}
        >
          <option value="desc">Created Last</option>
          <option value="asc">Created First</option>
        </select>
        {(filterValue) && (
          <button 
            onClick={() => { setFilterValue(''); }} 
            className="notification-filter-clear"
          >Clear</button>
        )}
        <button 
          className="notification-add-btn"
          onClick={openModal}
        >
          Add Notification
        </button>
      </div>
      {notifications.length === 0 && (
        <div className="notification-empty">No notifications yet.</div>
      )}
      {filterNotifications(notifications).map(n => (
        <NotificationDropdown key={n.id} notification={n} onRemove={handleRemove} />
      ))}
      {showModal && (
        <div className="notification-modal-overlay">
          <div className="notification-modal-card enhanced-notification-modal">
            {/* Enhanced Header */}
            <div className="notification-modal-header enhanced-notification-header">
              <div className="enhanced-header-left">
                <span className="enhanced-header-icon">
                  <svg width="38" height="38" fill="#fff" viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7v3.586l.707.707A1 1 0 0 1 19.293 16H4.707a1 1 0 0 1-.707-1.707L4.707 12.586V9a7 7 0 0 1 7-7zm0 20a3 3 0 0 1-3-3h6a3 3 0 0 1-3 3z"/></svg>
                </span>
                <span className="enhanced-header-title">Add Notification</span>
              </div>
              <button className="notification-close-icon enhanced-close-icon" onClick={closeModal} aria-label="Close">&times;</button>
            </div>
            <form className="add-edit-form notification-modal-content enhanced-notification-content" onSubmit={handleSubmit}>
              <div className="enhanced-section-label">Notification Details</div>
              <div className="notification-form-grid enhanced-form-grid">
                <div className="notification-form-group full-width">
                  <label>Title *</label>
                  <input 
                    name="title" 
                    value={form.title} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter notification title"
                    className="enhanced-input"
                  />
                </div>
                <div className="notification-form-group full-width">
                  <label>Description *</label>
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    required
                    placeholder="Enter notification description"
                    rows="3"
                    className="enhanced-input"
                  />
                </div>
                <div className="notification-form-group full-width">
                  <label>Select Associate/s to Notify</label>
                  <div className="notification-associate-list enhanced-associate-list">
                    <div className="select-all associate-checkbox-row enhanced-checkbox-row">
                      <input 
                        type="checkbox" 
                        checked={selectAll} 
                        onChange={handleSelectAll} 
                        id="selectAll"
                        style={{ marginRight: '8px' }}
                      />
                      <label htmlFor="selectAll">Select All</label>
                    </div>
                    {[...associates]
                      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                      .map(a => (
                        <div key={a.id} className="associate-checkbox-row enhanced-checkbox-row">
                          <input
                            type="checkbox"
                            checked={form.associate_ids.includes(a.id)}
                            onChange={() => handleAssociateChange(a.id)}
                            id={`associate_${a.id}`}
                            className="enhanced-checkbox"
                            style={{ marginRight: '8px' }}
                          />
                          <label htmlFor={`associate_${a.id}`} className="associate-checkbox-label enhanced-checkbox-label">{a.name}</label>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="notification-form-group half-width">
                  <label>Number of Volunteers Needed</label>
                  <input 
                    name="volunteers_needed" 
                    type="number" 
                    value={form.volunteers_needed} 
                    onChange={handleChange} 
                    placeholder="Enter number of volunteers needed"
                    required
                    className="enhanced-input"
                    min={1}
                    max={2000}
                  />
                </div>
              </div>
              {error && <div className="notification-error-message enhanced-error-message">{error}</div>}
              <div className="notification-form-actions enhanced-form-actions">
                <button type="button" className="cancel-btn enhanced-cancel-btn" onClick={closeModal}>
                  <span className="enhanced-btn-icon">&#10005;</span> Cancel
                </button>
                <button type="submit" className="notification-btn-submit enhanced-btn-submit" disabled={loading}>
                  <span className="enhanced-btn-icon">&#128276;</span> {loading ? 'Creating...' : 'Create Notification'}
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
      <div className="notification-progress-labels">
        <span className="notification-progress-accepted">CONFIRMED {accepted} ASSOCIATES</span>
        <span className="notification-progress-declined">DECLINED {declined} ASSOCIATES</span>
      </div>
      <div className="notification-progress-bar-bg">
        <div className="notification-progress-bar-fill" style={{ width: percent + '%' }} />
        <span className="notification-progress-bar-text">{percent}% RESPONDED</span>
      </div>
    </>
  );
}

function NotificationDropdown({ notification, onRemove }) {
  const [open, setOpen] = useState(false);
  const accepted = notification.recipients ? notification.recipients.filter(r => r.response === 'accept').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  const declined = notification.recipients ? notification.recipients.filter(r => r.response === 'decline').map(r => r.user && r.user.name ? r.user.name : `User ${r.user_id}`) : [];
  return (
    <div className={`notification-dropdown${open ? ' open' : ''}`}>
      <div className="notification-dropdown-header" onClick={() => setOpen(o => !o)} style={{ textAlign: 'left' }}>
        <div style={{ textAlign: 'left' }}>
          <div className="notification-dropdown-title" style={{ textAlign: 'left' }}>{notification.title}</div>
          <div className="notification-dropdown-date" style={{ textAlign: 'left' }}>{dayjs(notification.created_at).format('MMM D, YYYY h:mm A')}</div>
        </div>
        <div className="notification-dropdown-arrow">{open ? '▲' : '▼'}</div>
      </div>
      {open && (
        <div className="notification-dropdown-body">
          <div className="notification-dropdown-description">{notification.description}</div>
          <ProgressBar recipients={notification.recipients} />
          <div className="notification-dropdown-lists">
            <div className="notification-dropdown-list accepted">
              <div className="notification-dropdown-list-title accepted">Accepted ({accepted.length})</div>
              <ul>
                {accepted.length === 0 ? <li className="notification-dropdown-list-empty">None</li> : accepted.map(name => <li key={name}>{name}</li>)}
              </ul>
            </div>
            <div className="notification-dropdown-list declined">
              <div className="notification-dropdown-list-title declined">Declined ({declined.length})</div>
              <ul>
                {declined.length === 0 ? <li className="notification-dropdown-list-empty">None</li> : declined.map(name => <li key={name}>{name}</li>)}
              </ul>
            </div>
          </div>
          <div className="notification-dropdown-actions">
            <button 
              onClick={() => onRemove(notification.id)} 
              className="notification-dropdown-remove"
            >REMOVE</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications; 