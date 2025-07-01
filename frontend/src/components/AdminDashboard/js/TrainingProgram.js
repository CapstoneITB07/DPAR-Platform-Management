import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FaEllipsisH } from 'react-icons/fa';
import axios from 'axios';
import '../css/TrainingProgram.css';

function TrainingProgram() {
  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', location: '', description: '', image: null, imagePreview: null });
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [showDescModal, setShowDescModal] = useState(false);
  const [descModalContent, setDescModalContent] = useState({ title: '', description: '' });

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/training-programs');
      setPrograms(res.data);
    } catch (err) {
      setError('Failed to load training programs');
    }
  };

  const openModal = (index = null) => {
    if (index !== null) {
      const prog = programs[index];
      setForm({
        name: prog.name || '',
        date: prog.date || '',
        location: prog.location || '',
        description: prog.description || '',
        image: null,
        imagePreview: prog.image_url || null,
      });
      setEditIndex(index);
      setEditId(prog.id);
    } else {
      setForm({ name: '', date: '', location: '', description: '', image: null, imagePreview: null });
      setEditIndex(null);
      setEditId(null);
    }
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setForm({ name: '', date: '', location: '', description: '', image: null, imagePreview: null });
    setEditIndex(null);
    setEditId(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file, imagePreview: URL.createObjectURL(file) });
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, image: null, imagePreview: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('date', form.date);
    formData.append('location', form.location);
    formData.append('description', form.description);
    if (form.image) formData.append('image', form.image);
    try {
      if (editId) {
        await axios.post(`http://localhost:8000/api/training-programs/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('http://localhost:8000/api/training-programs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      closeModal();
      fetchPrograms();
    } catch (err) {
      setError('Failed to save training program');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this training program?')) return;
    try {
      const id = programs[index].id;
      await axios.delete(`http://localhost:8000/api/training-programs/${id}`);
      fetchPrograms();
    } catch (err) {
      setError('Failed to delete training program');
    }
    setMenuOpenIndex(null);
  };

  const handleMenuToggle = (idx) => {
    setMenuOpenIndex(menuOpenIndex === idx ? null : idx);
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DESCRIPTION_LIMIT = 120;

  return (
    <AdminLayout>
      <div className="training-header-row">
        <h2 className="main-header">TRAINING PROGRAMS</h2>
        <button className="training-add-btn" onClick={() => openModal()}>
          ADD PROGRAM
        </button>
      </div>
      {error && <div className="training-error">{error}</div>}
      {/* Add/Edit Modal Popup */}
      {modalOpen && (
        <div className="training-modal-overlay">
          <div className="training-modal-card">
            <div className="training-modal-header">
              <h3 className="training-modal-title">{editId ? 'Edit Training Program' : 'Add Training Program'}</h3>
              <button className="training-modal-close" onClick={closeModal}>&times;</button>
            </div>
            <form className="training-modal-form" onSubmit={handleSubmit}>
              <div>
                <label className="training-form-label">Program Name</label>
                <input name="name" value={form.name} onChange={handleChange} required className="training-form-input" />
              </div>
              <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="training-form-label" style={{ marginBottom: 4 }}>Date</label>
                  <input type="date" name="date" value={form.date} onChange={handleChange} required className="training-form-input" />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="training-form-label" style={{ marginBottom: 4 }}>Location</label>
                  <input name="location" value={form.location} onChange={handleChange} required className="training-form-input" />
                </div>
              </div>
              <div>
                <label className="training-form-label">Program Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} required className="training-form-textarea" />
              </div>
              <div className="training-upload-section">
                <label className="training-form-label" style={{ marginBottom: 10, textAlign: 'center' }}>Upload a Photo</label>
                <div className="training-upload-row">
                  {/* Left: Image or Placeholder + Remove */}
                  <div className="training-upload-preview">
                    {form.imagePreview ? (
                      <>
                        <img src={form.imagePreview} alt="Preview" className="training-upload-img" />
                        <button type="button" onClick={handleRemoveImage} className="training-upload-remove">Remove</button>
                      </>
                    ) : (
                      <div className="training-upload-placeholder">
                        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="3" y="7" width="18" height="12" rx="2" fill="#eee"/>
                          <circle cx="12" cy="13" r="4" fill="#bbb"/>
                          <rect x="8" y="4" width="8" height="3" rx="1.5" fill="#bbb"/>
                          <circle cx="12" cy="13" r="2" fill="#fff"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Right: Choose Photo + Note */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 220 }}>
                    <input id="training-photo-upload" type="file" accept="image/jpeg,image/png,image/jpg,image/gif" onChange={handleImageChange} style={{ display: 'none' }} />
                    <label htmlFor="training-photo-upload" className="training-upload-btn">Choose Photo</label>
                    <small className="training-upload-note">Accepted formats: JPEG, PNG, JPG, GIF (max 2MB)</small>
                  </div>
                </div>
              </div>
              <div className="training-modal-actions">
                <button type="button" onClick={closeModal} className="training-cancel-btn">Cancel</button>
                <button type="submit" disabled={loading} className="training-submit-btn">{loading ? (editId ? 'Saving...' : 'Adding...') : (editId ? 'Save' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Card Grid */}
      <div className="training-card-grid">
        {programs.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>No training programs yet.</p>
        ) : (
          programs.map((program, idx) => {
            const title = program.name || '';
            const description = program.description || '';
            const words = description.split(' ');
            const isLong = words.length >= 9;
            const shortDesc = isLong ? words.slice(0, 9).join(' ') + '...' : description;
            return (
              <div key={program.id} className="training-card"
                onMouseOver={e => { e.currentTarget.classList.add('training-card-hover'); }}
                onMouseOut={e => { e.currentTarget.classList.remove('training-card-hover'); }}
              >
                {/* Header */}
                <div className="training-card-header">
                  <div className="training-card-date">{program.date} {program.location && <span className="training-card-location">| {program.location}</span>}</div>
                  <div className="training-card-menu">
                    <button onClick={() => handleMenuToggle(idx)} className="training-card-menu-btn">
                      <FaEllipsisH size={20} />
                    </button>
                    {menuOpenIndex === idx && (
                      <div className="training-card-menu-dropdown">
                        <div className="training-card-menu-item" onClick={() => openModal(idx)}>Edit</div>
                        <div className="training-card-menu-item" style={{ color: '#e74c3c', borderBottom: 'none' }} onClick={() => handleDelete(idx)}>Delete</div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Content */}
                <div className="training-card-content">
                  {title && <div className="training-card-title">{title}</div>}
                  {description && (() => {
                    const words = description.split(' ');
                    const isLong = words.length > 15;
                    const shortDesc = isLong ? words.slice(0, 15).join(' ') + '...' : description;
                    return (
                      <>
                        <div className="training-card-desc">
                          {shortDesc}
                          {isLong && (
                            <button
                              className="training-card-see-more"
                              onClick={() => setDescModalContent({ title, description }) || setShowDescModal(true)}
                            >See More</button>
                          )}
                        </div>
                      </>
                    );
                  })()}
                  {program.image_url && (
                    <img src={program.image_url} alt={title} className="training-card-img" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {showDescModal && (
        <div className="training-desc-modal-overlay">
          <div className="training-desc-modal-card">
            <button className="training-desc-modal-close" onClick={() => setShowDescModal(false)}>&times;</button>
            <h3 className="training-desc-modal-title">{descModalContent.title}</h3>
            <div className="training-desc-modal-desc">{descModalContent.description}</div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default TrainingProgram; 