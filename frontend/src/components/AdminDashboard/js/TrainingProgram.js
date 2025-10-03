import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FaEllipsisH, FaChevronLeft, FaChevronRight, FaGraduationCap, FaCloudUploadAlt } from 'react-icons/fa';
import axios from 'axios';
import '../css/TrainingProgram.css';
import { API_BASE } from '../../../utils/url';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchPrograms(true); // Initial load with loading state
  }, []);

  const fetchPrograms = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      const res = await axios.get(`${API_BASE}/api/training-programs`);
      setPrograms(res.data);
    } catch (err) {
      setError('Failed to load training programs');
    } finally {
      if (isInitialLoad) setInitialLoading(false);
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
    const { name, value } = e.target;
    
    // If it's the date field, validate it immediately
    if (name === 'date' && value) {
      const selectedDate = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        setError('Training program date cannot be in the past. Please select today\'s date or a future date.');
        return; // Don't update the form with invalid date
      } else {
        setError(''); // Clear any previous date errors
      }
    }
    
    setForm({ ...form, [name]: value });
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
        // Silently skip files that exceed 2MB without showing alert
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
    
    // Validate date - cannot be in the past
    const selectedDate = new Date(form.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    if (selectedDate < today) {
      setError('Training program date cannot be in the past. Please select today\'s date or a future date.');
      setLoading(false);
      return;
    }
    
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
        await axios.post(`${API_BASE}/api/training-programs/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setNotification('Training program updated successfully!');
      } else {
        const response = await axios.post(`${API_BASE}/api/training-programs`, formData, {
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

  const handleDelete = (index) => {
    const id = programs[index].id;
    setDeleteId(id);
    setShowDeleteModal(true);
    setMenuOpenIndex(null);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API_BASE}/api/training-programs/${deleteId}`);
      fetchPrograms();
      setNotification('Training program deleted successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      setError('Failed to delete training program');
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handleMenuToggle = (idx) => {
    setMenuOpenIndex(menuOpenIndex === idx ? null : idx);
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




  if (initialLoading) return (
    <AdminLayout>
      <div className="dashboard-loading-container">
        <div className="loading-content">
          <div className="simple-loader">
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
            <div className="loader-dot"></div>
          </div>
          <h3>Loading Training Programs</h3>
          <p>Fetching training program data and content...</p>
        </div>
      </div>
    </AdminLayout>
  );

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
                <input name="name" value={form.name} onChange={handleChange} placeholder="Enter training program name here..." required className="training-form-input" />
              </div>
              <div style={{ display: 'flex', gap: 40, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="training-form-label" style={{ marginBottom: 4 }}>Date</label>
                  <input 
                    type="date" 
                    name="date" 
                    value={form.date} 
                    onChange={handleChange} 
                    required 
                    min={new Date().toISOString().split('T')[0]}
                    className={`training-form-input ${error && error.includes('date') ? 'error' : ''}`}
                    title="Select today's date or a future date"
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                  <label className="training-form-label" style={{ marginBottom: 4 }}>Location</label>
                  <input name="location" value={form.location} onChange={handleChange} placeholder="Enter training location here..." required className="training-form-input" />
                </div>
              </div>
              <div>
                <label className="training-form-label">Program Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Enter detailed program description here. Include objectives, requirements, schedule, and other important details..." required className="training-form-textarea" />
              </div>
              
              {/* Multiple Photos Upload Section */}
              <div>
                <label className="training-upload-label">Upload Photos</label>
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
                      <label htmlFor="training-photos-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                        <FaCloudUploadAlt className="upload-icon" />
                        <span className="upload-text">Upload Photos</span>
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
                  <small className="training-upload-note">Accepted formats: JPEG, PNG, JPG, GIF</small>
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
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#6c757d', 
            fontSize: '18px', 
            fontWeight: '500',
            width: '100%',
            gridColumn: '1 / -1'
          }}>
            No training programs found. Click "ADD PROGRAM" to create your first training program.
          </div>
        ) : (
          programs.map((program, idx) => {
            const title = program.name || '';
            const description = program.description || '';
            return (
              <div key={program.id} className="training-card"
                onClick={() => openFullModal(program)}
                style={{ cursor: 'pointer' }}
                onMouseOver={e => { e.currentTarget.classList.add('training-card-hover'); }}
                onMouseOut={e => { e.currentTarget.classList.remove('training-card-hover'); }}
              >
                {/* Date/Time Row */}
                <div className="training-datetime-row">
                  <div>
                    <span className="training-date-badge">
                      {program.date ? new Date(program.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'No Date'}
                    </span>
                  </div>
                  <div>
                    <span className="training-time-badge">
                      {program.location || 'No Location'}
                    </span>
                  </div>
                  <div className="training-card-menu">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuToggle(idx);
                      }} 
                      className="training-card-menu-btn"
                    >
                      <FaEllipsisH size={20} />
                    </button>
                    {menuOpenIndex === idx && (
                      <div className="training-card-menu-dropdown">
                        <div className="training-card-menu-item" onClick={(e) => {
                          e.stopPropagation();
                          openModal(idx);
                        }}>Edit</div>
                        <div className="training-card-menu-item" style={{ color: '#e74c3c', borderBottom: 'none' }} onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(idx);
                        }}>Delete</div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Title/Content */}
                <div className="training-content">
                  {title && <div className="training-title">{title}</div>}
                  {description && (
                    <div className="training-desc">
                      {program.photos && program.photos.length > 0 
                        ? description.length > 150 ? description.substring(0, 150) + '...' : description
                        : description.length > 650 ? description.substring(0, 650) + '...' : description
                      }
                      {description.length > (program.photos && program.photos.length > 0 ? 150 : 650) && (
                        <button 
                          className="training-see-more-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            openFullModal(program);
                          }}
                        >
                          See more
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Show only first photo in card */}
                  {program.photos && program.photos.length > 0 && (
                    <div className="training-photos-wrapper">
                      <div className="training-img-wrapper" style={{ position: 'relative' }}>
                        <img
                          src={program.photos[0]}
                          alt="Training Program"
                          className="training-img"
                        />
                        {program.photos.length > 1 && (
                          <div className="training-photos-indicator">
                            <span className="training-photos-count">+{program.photos.length - 1} more</span>
                          </div>
                        )}
                      </div>
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
        <div className="announcements-modal" onClick={() => setShowDescModal(false)}>
          <div className="announcement-full-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-full-modal-header">
              <h2>{descModalContent.title}</h2>
              <div className="announcement-full-modal-timestamp">
                <span className="announcement-posted-text">
                  {descModalContent.date && `Date: ${descModalContent.date}`}
                  {descModalContent.location && ` | Location: ${descModalContent.location}`}
                </span>
              </div>
              <button
                className="announcement-full-modal-close"
                onClick={() => setShowDescModal(false)}
              >
                ×
              </button>
            </div>
            
            {/* Scrollable content container */}
            <div className="announcement-full-modal-content-scrollable">
              <div className="announcement-full-modal-content-container">
                <div className="announcement-description-label">Description</div>
                <div className="announcement-full-modal-description">
                  {descModalContent.description}
                </div>
              </div>
              
              {/* Photo Navigation (Instagram/Facebook style) */}
              {descModalContent.photos && descModalContent.photos.length > 0 && (
                <div className="announcement-photo-navigation">
                  <div className="announcement-photo-container">
                    <img
                      src={descModalContent.photos[currentPhotoIndex]}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="announcement-full-modal-img"
                    />
                    
                    {/* Navigation Arrows */}
                    {descModalContent.photos.length > 1 && (
                      <>
                        <button 
                          className="announcement-photo-nav-btn announcement-photo-nav-prev"
                          onClick={prevPhoto}
                        >
                          <FaChevronLeft />
                        </button>
                        <button 
                          className="announcement-photo-nav-btn announcement-photo-nav-next"
                          onClick={nextPhoto}
                        >
                          <FaChevronRight />
                        </button>
                      </>
                    )}
                    
                    {/* Photo Counter */}
                    {descModalContent.photos.length > 1 && (
                      <div className="announcement-photo-counter">
                        {currentPhotoIndex + 1} / {descModalContent.photos.length}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" style={{zIndex: 10000}}>
          <div className="confirm-modal">
            <button className="modal-close confirm-close" onClick={cancelDelete}>&times;</button>
            <div className="confirm-icon">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="30" cy="30" r="28" stroke="#e53935" strokeWidth="4" fill="#fff"/>
                <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#e53935">!</text>
              </svg>
            </div>
            <div className="confirm-message">Are you sure you want to delete this volunteer?</div>
            <div className="modal-actions confirm-actions">
              <button className="delete-btn" onClick={confirmDelete}>Yes, I'm sure</button>
              <button className="cancel-btn" onClick={cancelDelete}>No, cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default TrainingProgram; 