import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { FaEllipsisH, FaChevronLeft, FaChevronRight, FaCloudUploadAlt } from 'react-icons/fa';
import '../css/announcement.css';
import { API_BASE } from '../../../utils/url';

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
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showDescModal, setShowDescModal] = useState(false);
  const [descModalContent, setDescModalContent] = useState({ title: '', description: '', photo_urls: [] });
  const [notification, setNotification] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [fileSizeError, setFileSizeError] = useState('');

  useEffect(() => {
    fetchAnnouncements(true); // Initial load with loading state
  }, []);

  const fetchAnnouncements = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setInitialLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const res = await axios.get(`${API_BASE}/api/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      if (isInitialLoad) setInitialLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    
    const formData = new FormData();
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    
    // Append multiple photos
    photos.forEach((photo, index) => {
      formData.append(`photos[${index}]`, photo);
    });

    // If editing, also send information about which existing photos to keep
    if (editId) {
      formData.append('keep_existing_photos', JSON.stringify(previews));
    }
    
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (editId) {
        // Edit mode
        await axios.post(`${API_BASE}/api/announcements/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setNotification('Announcement updated successfully!');
      } else {
        // Create mode
        await axios.post(`${API_BASE}/api/announcements`, formData, {
          headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` },
        });
        setNotification('Announcement created successfully!');
      }
      setShowModal(false);
      setTitle('');
      setDescription('');
      setPhotos([]);
      setPreviews([]);
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
    setPhotos([]);
    setPreviews(a.photo_urls || []);
    setShowModal(true);
    setMenuOpenId(null);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
    setMenuOpenId(null);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      await axios.delete(`${API_BASE}/api/announcements/${deleteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAnnouncements();
      setNotification('Announcement deleted successfully!');
      setTimeout(() => setNotification(''), 2000);
    } catch (err) {
      setError('Failed to delete announcement');
    }
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];
    const oversizedFiles = [];

    files.forEach(file => {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload valid image files (JPEG, PNG, JPG, or GIF)');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        oversizedFiles.push(file.name);
        return;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    // Show error message for oversized files
    if (oversizedFiles.length > 0) {
      setFileSizeError(`The following files exceed the 2MB limit and were not uploaded: ${oversizedFiles.join(', ')}`);
      setTimeout(() => setFileSizeError(''), 5000); // Clear error after 5 seconds
    } else {
      setFileSizeError(''); // Clear any previous errors
    }

    setPhotos(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };


  const removeExistingPhoto = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearForm = () => {
    setShowModal(false);
    setTitle('');
    setDescription('');
    setPhotos([]);
    setPreviews([]);
    setEditId(null);
    setFileSizeError('');
  };

  const openFullModal = (announcement) => {
    setDescModalContent({
      title: announcement.title,
      description: announcement.description,
      photo_urls: announcement.photo_urls || [],
      created_at: announcement.created_at
    });
    setCurrentPhotoIndex(0);
    setShowDescModal(true);
  };

  const nextPhoto = () => {
    if (descModalContent.photo_urls && descModalContent.photo_urls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === descModalContent.photo_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevPhoto = () => {
    if (descModalContent.photo_urls && descModalContent.photo_urls.length > 0) {
      setCurrentPhotoIndex((prev) => 
        prev === 0 ? descModalContent.photo_urls.length - 1 : prev - 1
      );
    }
  };


  // Function to truncate text by character count for better control
  const truncateTextByLength = (text, maxLength = 150) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Function to check if description needs truncation
  const needsTruncation = (text, hasImages = false) => {
    if (!text) return false;
    // Different thresholds for cards with and without images
    const threshold = hasImages ? 150 : 650;
    return text.length > threshold;
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
          <h3>Loading Announcements</h3>
          <p>Fetching announcement data and content...</p>
        </div>
      </div>
    </AdminLayout>
  );

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
              <button onClick={clearForm} className="announcement-modal-close">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="announcement-modal-form">
              <div>
                <label className="announcement-form-label">TITLE</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="announcement-form-input" placeholder="Enter announcement title here..." required />
              </div>
              <div>
                <label className="announcement-form-label">DESCRIPTION</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="announcement-form-textarea"
                  placeholder="Enter detailed announcement description here. Include all relevant information, dates, and instructions..."
                  required
                />
              </div>
              <div>
                <label className="announcement-upload-label">Upload Photos</label>
                <div className="announcement-upload-container">
                  {/* Photo Previews */}
                  <div className="announcement-photos-grid">
                    {previews.map((preview, index) => (
                      <div key={index} className="announcement-photo-preview">
                        <img src={preview} alt={`Preview ${index + 1}`} className="announcement-upload-img" />
                        <button 
                          type="button" 
                          onClick={() => removeExistingPhoto(index)} 
                          className="announcement-upload-remove"
                        >
                          {/* icon removed */}
                          Remove
                        </button>
                      </div>
                    ))}
                    {/* Upload Button */}
                    <div className="announcement-upload-placeholder">
                      <input 
                        id="announcement-photos-upload" 
                        type="file" 
                        multiple
                        accept="image/jpeg,image/png,image/jpg,image/gif" 
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }} 
                      />
                      <label htmlFor="announcement-photos-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                        <FaCloudUploadAlt className="upload-icon" />
                        <span className="upload-text">Upload Photos</span>
                      </label>
                    </div>
                  </div>
                  {/* Remove All Photos Button (only show when editing and has existing photos) */}
                  {editId && previews.length > 0 && (
                    <div style={{ textAlign: 'center', marginTop: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setPreviews([])}
                        className="announcement-remove-all-btn"
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
                  <small className="announcement-upload-note">Accepted formats: JPEG, PNG, JPG, GIF (Max size: 2MB per file)</small>
                  {fileSizeError && (
                    <div className="announcement-file-error" style={{
                      color: '#e74c3c',
                      fontSize: '14px',
                      marginTop: '8px',
                      padding: '8px',
                      backgroundColor: '#fdf2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '4px'
                    }}>
                      {fileSizeError}
                    </div>
                  )}
                </div>
              </div>
              <div className="announcement-modal-actions">
                <button type="button" onClick={clearForm} className="announcement-cancel-btn">Cancel</button>
                <button type="submit" disabled={loading} className="announcement-submit-btn">{loading ? (editId ? 'Saving...' : 'Posting...') : (editId ? 'Save' : 'Post')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Announcements List */}
      <div className="announcement-list">
        {announcements.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#6c757d', 
            fontSize: '18px', 
            fontWeight: '500',
            width: '100%',
            gridColumn: '1 / -1'
          }}>
            No announcements found. Click "Create Announcement" to create your first announcement.
          </div>
        ) : (
          announcements.map(a => (
            <div key={a.id} className="announcement-card"
              onClick={() => openFullModal(a)}
              style={{ cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.classList.add('announcement-card-hover'); }}
              onMouseOut={e => { e.currentTarget.classList.remove('announcement-card-hover'); }}
            >
              {/* Date/Time Row */}
              <div className="announcement-datetime-row">
                <div>
                  <span className="announcement-date-badge">
                    {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="announcement-time-badge">
                    {new Date(a.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="announcement-card-menu">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuToggle(a.id);
                    }} 
                    className="announcement-card-menu-btn"
                  >
                    <FaEllipsisH size={20} />
                  </button>
                  {menuOpenId === a.id && (
                    <div className="announcement-card-menu-dropdown">
                      <div className="announcement-card-menu-item" onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(a);
                      }}>Edit</div>
                      <div className="announcement-card-menu-item" style={{ color: '#e74c3c', borderBottom: 'none' }} onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(a.id);
                      }}>Delete</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Title/Content */}
              <div className="announcement-content">
                {a.title && <div className="announcement-title">{a.title}</div>}
                {a.description && (
                  <div className="announcement-desc">
                    {a.photo_urls && a.photo_urls.length > 0 
                      ? truncateTextByLength(a.description, 150)
                      : truncateTextByLength(a.description, 650)
                    }
                    {needsTruncation(a.description, a.photo_urls && a.photo_urls.length > 0) && (
                      <button 
                        className="announcement-see-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openFullModal(a);
                        }}
                      >
                        See more
                      </button>
                    )}
                  </div>
                )}
                
                {/* Show only first photo in card */}
                {a.photo_urls && a.photo_urls.length > 0 && (
                  <div className="announcement-photos-wrapper">
                    <div className="announcement-img-wrapper" style={{ position: 'relative' }}>
                      <img
                        src={a.photo_urls[0]}
                        alt="Announcement"
                        className="announcement-img"
                      />
                      {a.photo_urls.length > 1 && (
                        <div className="announcement-photos-indicator">
                          <span className="announcement-photos-count">+{a.photo_urls.length - 1} more</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Full Announcement Modal */}
      {showDescModal && (
        <div className="announcements-modal" onClick={() => setShowDescModal(false)}>
          <div className="announcement-full-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="announcement-full-modal-header">
              <h2>{descModalContent.title}</h2>
              <div className="announcement-full-modal-timestamp">
                <span className="announcement-posted-text">
                  Posted on {new Date(descModalContent.created_at || new Date()).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} at {new Date(descModalContent.created_at || new Date()).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
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
              {descModalContent.photo_urls && descModalContent.photo_urls.length > 0 && (
                <div className="announcement-photo-navigation">
                  <div className="announcement-photo-container">
                    <img
                      src={descModalContent.photo_urls[currentPhotoIndex]}
                      alt={`Photo ${currentPhotoIndex + 1}`}
                      className="announcement-full-modal-img"
                    />
                    
                    {/* Navigation Arrows */}
                    {descModalContent.photo_urls.length > 1 && (
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
                    {descModalContent.photo_urls.length > 1 && (
                      <div className="announcement-photo-counter">
                        {currentPhotoIndex + 1} / {descModalContent.photo_urls.length}
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

export default Announcement; 