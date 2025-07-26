import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { FaEllipsisH } from 'react-icons/fa';
import '../css/announcement.css';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="announcement-success-notification">
      {message}
    </div>
  );
}

function Announcement() {
  const [announcements, setAnnouncements] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showDescModal, setShowDescModal] = useState(false);
  const [descModalContent, setDescModalContent] = useState({ title: '', description: '', photo_url: null });
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await axios.get('http://localhost:8000/api/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData();
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (photo) formData.append('photo', photo);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (editId) {
        // Edit mode
        await axios.post(`http://localhost:8000/api/announcements/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setNotification('Announcement updated successfully!');
      } else {
        // Create mode
        await axios.post('http://localhost:8000/api/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setNotification('Announcement created successfully!');
      }
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPhoto(null);
      setPreview(null);
      setEditId(null);
      fetchAnnouncements();
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      setError('Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuToggle = (id) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleEdit = (a) => {
    setEditId(a.id);
    setTitle(a.title || '');
    setDescription(a.description || '');
    setPhoto(null);
    setPreview(a.photo_url || null);
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.delete(`http://localhost:8000/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
      setNotification('Announcement deleted successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      setError('Failed to delete announcement');
    }
    setMenuOpenId(null);
  };

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
      <div className="announcement-header-row">
        <h2 className="main-header">ANNOUNCEMENT</h2>
        <button
          className="announcement-create-btn"
          onClick={() => setShowModal(true)}
        >
          Create Announcement
        </button>
      </div>
      {error && <div className="announcement-error">{error}</div>}
      {/* Modal */}
      {showModal && (
        <div className="announcement-modal-overlay">
          <div className="announcement-modal-card">
            <div className="announcement-modal-header">
              <h3 className="announcement-modal-title">{editId ? 'Edit Announcement' : 'Create Announcement'}</h3>
              <button onClick={() => { setShowModal(false); setTitle(''); setDescription(''); setPhoto(null); setPreview(null); setEditId(null); }} className="announcement-modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="announcement-modal-form">
              <div>
                <label className="announcement-form-label">TITLE</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="announcement-form-input" />
              </div>
              <div>
                <label className="announcement-form-label">DESCRIPTION</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="announcement-form-textarea" />
              </div>
              <div>
                <label className="announcement-upload-label">Upload a Photo</label>
                <div className="announcement-upload-row">
                  {preview ? (
                    <div className="announcement-upload-preview">
                      <img src={preview} alt="Preview" className="announcement-upload-img" />
                      <button type="button" onClick={() => { setPhoto(null); setPreview(null); }} className="announcement-upload-remove">Remove</button>
                    </div>
                  ) : (
                    <div className="announcement-upload-placeholder" style={{ width: 70, height: 70, borderRadius: '50%', border: '1.5px dashed #ccc', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 32 }}>
                      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="3" y="7" width="18" height="12" rx="2" fill="#eee"/>
                        <circle cx="12" cy="13" r="4" fill="#bbb"/>
                        <rect x="8" y="4" width="8" height="3" rx="1.5" fill="#bbb"/>
                        <circle cx="12" cy="13" r="2" fill="#fff"/>
                      </svg>
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input id="announcement-photo-upload" type="file" accept="image/jpeg,image/png,image/jpg,image/gif" onChange={e => {
                      const file = e.target.files[0];
                      if (file) {
                        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
                        if (!validTypes.includes(file.type)) {
                          alert('Please upload a valid image file (JPEG, PNG, JPG, or GIF)');
                          e.target.value = '';
                          return;
                        }
                        if (file.size > 2 * 1024 * 1024) {
                          alert('File size should not exceed 2MB');
                          e.target.value = '';
                          return;
                        }
                        setPhoto(file);
                        setPreview(URL.createObjectURL(file));
                      }
                    }} style={{ display: 'none' }} />
                    <label htmlFor="announcement-photo-upload" className="announcement-upload-btn">
                      {photo ? 'Change Photo' : 'Choose Photo'}
                    </label>
                    <small className="announcement-upload-note">Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)</small>
                  </div>
                </div>
              </div>
              <div className="announcement-modal-actions">
                <button type="button" onClick={() => { setShowModal(false); setTitle(''); setDescription(''); setPhoto(null); setPreview(null); setEditId(null); }} className="announcement-cancel-btn">Cancel</button>
                <button type="submit" disabled={loading} className="announcement-submit-btn">{loading ? (editId ? 'Saving...' : 'Posting...') : (editId ? 'Save' : 'Post')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Announcements List */}
      <div className="announcement-list">
        {announcements.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No announcements yet.</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="announcement-card"
              onMouseOver={e => { e.currentTarget.classList.add('announcement-card-hover'); }}
              onMouseOut={e => { e.currentTarget.classList.remove('announcement-card-hover'); }}
            >
              {/* Header */}
              <div className="announcement-card-header">
                <div className="announcement-card-date">{new Date(a.created_at).toLocaleString()}</div>
                <div className="announcement-card-menu">
                  <button onClick={() => handleMenuToggle(a.id)} className="announcement-card-menu-btn">
                    <FaEllipsisH size={20} />
                  </button>
                  {menuOpenId === a.id && (
                    <div className="announcement-card-menu-dropdown">
                      <div className="announcement-card-menu-item" onClick={() => handleEdit(a)}>Edit</div>
                      <div className="announcement-card-menu-item" style={{ color: '#e74c3c', borderBottom: 'none' }} onClick={() => handleDelete(a.id)}>Delete</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Content */}
              <div className="announcement-card-content">
                {a.title && <div className="announcement-card-title">{a.title}</div>}
                {a.description && (() => {
                  const words = a.description.split(' ');
                  const isLong = words.length > 15;
                  const shortDesc = isLong ? words.slice(0, 15).join(' ') + '...' : a.description;
                  return (
                    <>
                      <div className="announcement-card-desc">
                        {shortDesc}
                        {isLong && (
                          <button
                            className="announcement-card-see-more"
                            onClick={() => setDescModalContent({ title: a.title, description: a.description, photo_url: a.photo_url }) || setShowDescModal(true)}
                          >See More</button>
                        )}
                      </div>
                    </>
                  );
                })()}
                {a.photo_url && (
                  <img src={a.photo_url} alt="Announcement" className="announcement-card-img" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {showDescModal && (
        <div className="announcement-desc-modal-overlay">
          <div className="announcement-desc-modal-card">
            <button onClick={() => setShowDescModal(false)} className="announcement-desc-modal-close">&times;</button>
            <h3 className="announcement-desc-modal-title">{descModalContent.title}</h3>
            <div className="announcement-desc-modal-desc">{descModalContent.description}</div>
            {descModalContent.photo_url && (
              <img src={descModalContent.photo_url} alt="Announcement" className="announcement-desc-modal-img" />
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default Announcement; 