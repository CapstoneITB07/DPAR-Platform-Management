import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { FaEllipsisH } from 'react-icons/fa';

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

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get('http://localhost:8000/api/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    setPhoto(file);
    if (file) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
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
      const token = localStorage.getItem('authToken');
      if (editId) {
        // Edit mode
        await axios.post(`http://localhost:8000/api/announcements/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
      } else {
        // Create mode
        await axios.post('http://localhost:8000/api/announcements', formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
      }
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPhoto(null);
      setPreview(null);
      setEditId(null);
      fetchAnnouncements();
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
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:8000/api/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to delete announcement');
    }
    setMenuOpenId(null);
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2>Announcement</h2>
        <button style={{ background: 'green', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 5, cursor: 'pointer' }} onClick={() => { setShowModal(true); setEditId(null); setTitle(''); setDescription(''); setPhoto(null); setPreview(null); }}>
          Create Announcement
        </button>
      </div>
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 24, borderRadius: 8, minWidth: 350, position: 'relative' }}>
            <h3>{editId ? 'Edit Announcement' : 'Create Announcement'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>TITLE</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>DESCRIPTION</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: 6, marginTop: 4, minHeight: 60 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Upload a Photo</label>
                <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'block', marginTop: 4 }} />
                {preview && (
                  <div style={{ marginTop: 8 }}>
                    <img src={preview} alt="Preview" style={{ maxWidth: 200, maxHeight: 120, borderRadius: 4, display: 'block' }} />
                    <button type="button" onClick={() => { setPhoto(null); setPreview(null); }} style={{ marginTop: 6, background: '#eee', color: '#333', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Remove Photo</button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={() => { setShowModal(false); setTitle(''); setDescription(''); setPhoto(null); setPreview(null); setEditId(null); }} style={{ background: 'red', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 5 }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ background: 'blue', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 5 }}>{loading ? (editId ? 'Saving...' : 'Posting...') : (editId ? 'Save' : 'Post')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Announcements List */}
      <div style={{
        marginTop: 32,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 28,
        maxWidth: 900,
        marginLeft: 'auto',
        marginRight: 'auto',
      }}>
        {announcements.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888', fontStyle: 'italic' }}>No announcements yet.</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
              position: 'relative',
              overflow: 'hidden',
              border: '1px solid #e4e6eb',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 220,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '18px 20px 10px 20px', borderBottom: '1px solid #f0f2f5', background: '#f7f8fa' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#888' }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => handleMenuToggle(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: '50%' }}>
                    <FaEllipsisH size={20} />
                  </button>
                  {menuOpenId === a.id && (
                    <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 10, minWidth: 120 }}>
                      <div style={{ padding: '10px 16px', cursor: 'pointer', color: '#333', borderBottom: '1px solid #f0f2f5' }} onClick={() => handleEdit(a)}>Edit</div>
                      <div style={{ padding: '10px 16px', cursor: 'pointer', color: '#e74c3c' }} onClick={() => handleDelete(a.id)}>Delete</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Content */}
              <div style={{ padding: '18px 20px 10px 20px', flex: 1 }}>
                {a.title && <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, color: '#222' }}>{a.title}</div>}
                {a.description && <div style={{ fontSize: 16, color: '#444', marginBottom: a.photo_url ? 12 : 0 }}>{a.description}</div>}
                {a.photo_url && (
                  <img src={a.photo_url} alt="Announcement" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 10, marginTop: 10, marginBottom: 10 }} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}

export default Announcement; 