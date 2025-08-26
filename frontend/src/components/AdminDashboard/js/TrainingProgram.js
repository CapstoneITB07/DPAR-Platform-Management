import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FaEllipsisH, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import '../css/TrainingProgram.css';

// Notification component
function Notification({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="training-success-notification">
      {message}
    </div>
  );
}

function TrainingProgram() {
  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    date: '', 
    location: '', 
    description: '', 
    photos: [],
    previews: []
  });
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [showDescModal, setShowDescModal] = useState(false);
  const [descModalContent, setDescModalContent] = useState({ 
    title: '', 
    description: '', 
    photos: [], 
    date: '', 
    location: ''
  });
  const [notification, setNotification] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
        photos: [], // Keep empty for new uploads
        previews: prog.photos || [] // Show existing photos as previews
      });
      setEditIndex(index);
      setEditId(prog.id);
    } else {
      setForm({ 
        name: '', 
        date: '', 
        location: '', 
        description: '', 
        photos: [],
        previews: []
      });
      setEditIndex(null);
      setEditId(null);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm({ 
      name: '', 
      date: '', 
      location: '', 
      description: '', 
      photos: [],
      previews: []
    });
    setEditIndex(null);
    setEditId(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];

    files.forEach(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload valid image files (JPEG, PNG, JPG, or GIF)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('File size should not exceed 2MB');
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...validFiles],
      previews: [...prev.previews, ...newPreviews]
    }));
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
      previews: prev.previews.filter((_, i) => i !== index)
    }));
  };

  const removeExistingPhoto = (index) => {
    setForm(prev => ({
      ...prev,
      previews: prev.previews.filter((_, i) => i !== index)
    }));
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
    
    // Append multiple photos
    form.photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, photo);
    });

    // If editing, also send information about which existing photos to keep
    if (editId) {
      // Send the remaining previews (existing photos that weren't removed)
      formData.append('keep_existing_photos', JSON.stringify(form.previews));
    }

    try {
      if (editId) {
        await axios.post(`http://localhost:8000/api/training-programs/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNotification('Training program updated successfully!');
      } else {
        const response = await axios.post('http://localhost:8000/api/training-programs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNotification('Training program added successfully!');
      }
      closeModal();
      fetchPrograms();
      setTimeout(() => setNotification(''), 2000);
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
      setNotification('Training program deleted successfully!');
      setTimeout(() => setNotification(''), 2000);
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

  const openFullModal = (program) => {
    setDescModalContent({
      title: program.name,
      description: program.description,
      photos: program.photos || [],
      date: program.date || '',
      location: program.location || ''
    });
    setCurrentPhotoIndex(0);
    setShowDescModal(true);
  };

  const nextPhoto = () => {
    if (descModalContent.photos && descModalContent.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === descModalContent.photos.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (descModalContent.photos && descModalContent.photos.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? descModalContent.photos.length - 1 : prev - 1
      );
    }
  };

  // Function to truncate description to 3 lines
  const truncateDescription = (text, maxLines = 3) => {
    if (!text) return '';
    
    // Split by both newlines and spaces to handle long text better
    const words = text.split(' ');
    const maxWords = 25; // Limit to approximately 3 lines
    
    if (words.length <= maxWords) return text;
    
    // Join first 25 words and add ellipsis
    return words.slice(0, maxWords).join(' ') + '...';
  };

  // Function to check if description needs truncation
  const needsTruncation = (text, maxLines = 3) => {
    if (!text) return false;
    
    // Check both word count and character length for better detection
    const words = text.split(' ');
    const charCount = text.length;
    
    return words.length > 25 || charCount > 120; // More lenient limits
  };

  return (
    <AdminLayout>
      <Notification message={notification} onClose={() => setNotification('')} />
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
              
              {/* Multiple Photos Upload Section */}
              <div className="training-upload-section">
                <label className="training-form-label" style={{ marginBottom: 10, textAlign: 'center' }}>Upload Photos</label>
                <div className="training-upload-container">
                  {/* Photo Previews */}
                  <div className="training-photos-grid">
                    {form.previews.map((preview, index) => (
                      <div key={index} className="training-photo-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} className="training-upload-img" />
                        <button 
                          type="button" 
                          onClick={() => removeExistingPhoto(index)} 
                          className="training-upload-remove"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {/* Upload Button */}
                    <div className="training-upload-placeholder">
                      <input 
                        id="training-photos-upload" 
                        type="file" 
                        multiple
                        accept="image/jpeg,image/png,image/jpg,image/gif" 
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="training-photos-upload" className="training-upload-btn">
                        Choose Photos
                      </label>
                    </div>
                  </div>
                  {/* Remove All Photos Button (only show when editing and has existing photos) */}
                  {editId && form.previews.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setForm(prev => ({ ...prev, previews: [] }))}
                        className="training-remove-all-btn"
                        style={{
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Remove All Photos
                      </button>
                    </div>
                  )}
                  <small className="training-upload-note">Accepted formats: JPEG, PNG, JPG, GIF (max 2MB each)</small>
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
            return (
              <div key={program.id} className="training-card"
                onMouseOver={e => { e.currentTarget.classList.add('training-card-hover'); }}
                onMouseOut={e => { e.currentTarget.classList.remove('training-card-hover'); }}
              >
                {/* Header */}
                <div className="training-card-header">
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
                  
                  {/* Date and Location Section */}
                  <div className="training-card-meta">
                    {program.date && (
                      <div className="training-card-date-label">
                        <strong>Date:</strong> {program.date}
                      </div>
                    )}
                    {program.location && (
                      <div className="training-card-location-label">
                        <strong>Location:</strong> {program.location}
                      </div>
                    )}
                  </div>
                  
                  {description && (
                    <div className="training-card-desc">
                      <div className="training-text-content">
                        {truncateDescription(description)}
                      </div>
                      {needsTruncation(description) && (
                        <button
                          className="training-card-see-more"
                          onClick={() => openFullModal(program)}
                        >See More</button>
                      )}
                    </div>
                  )}
                  
                  {/* Show photos - exactly like announcements */}
                  {program.photos && program.photos.length > 0 && (
                    <div className="training-photos-display">
                      <img 
                        src={program.photos[0]} 
                        alt="Training Program" 
                        className="training-card-img" 
                      />
                      {program.photos.length > 1 && (
                        <div className="training-photos-indicator">
                          <span className="training-photos-count">+{program.photos.length - 1} more</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Full Description Modal with Photo Navigation */}
      {showDescModal && (
        <div className="training-desc-modal-overlay">
          <div className="training-desc-modal-card">
            <button onClick={() => setShowDescModal(false)} className="training-desc-modal-close">&times;</button>
            <h3 className="training-desc-modal-title">{descModalContent.title}</h3>
            
            {/* Date and Location in Modal */}
            <div className="training-desc-modal-meta">
              {descModalContent.date && (
                <div className="training-desc-modal-date">
                  <strong>Date:</strong> {descModalContent.date}
                </div>
              )}
              {descModalContent.location && (
                <div className="training-desc-modal-location">
                  <strong>Location:</strong> {descModalContent.location}
                </div>
              )}
            </div>
            
            <div className="training-desc-modal-desc">
              <strong>Description:</strong>
              <p>{descModalContent.description}</p>
            </div>
            
            {/* Photo Navigation (Instagram/Facebook style) */}
            {descModalContent.photos && descModalContent.photos.length > 0 && (
              <div className="training-photo-navigation">
                <div className="training-photo-container">
                  <img 
                    src={descModalContent.photos[currentPhotoIndex]} 
                    alt={`Photo ${currentPhotoIndex + 1}`} 
                    className="training-desc-modal-img" 
                  />
                  
                  {/* Navigation Arrows */}
                  {descModalContent.photos.length > 1 && (
                    <>
                      <button 
                        className="training-photo-nav-btn training-photo-nav-prev"
                        onClick={prevPhoto}
                      >
                        <FaChevronLeft />
                      </button>
                      <button 
                        className="training-photo-nav-btn training-photo-nav-next"
                        onClick={nextPhoto}
                      >
                        <FaChevronRight />
                      </button>
                    </>
                  )}
                  
                  {/* Photo Counter */}
                  {descModalContent.photos.length > 1 && (
                    <div className="training-photo-counter">
                      {currentPhotoIndex + 1} / {descModalContent.photos.length}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default TrainingProgram; 