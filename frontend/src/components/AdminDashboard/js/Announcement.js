import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { FaEllipsisH, FaChevronLeft, FaChevronRight, FaBullhorn, FaNewspaper } from 'react-icons/fa';
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
  const [photos, setPhotos] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [showDescModal, setShowDescModal] = useState(false);
  const [descModalContent, setDescModalContent] = useState({ title: '', description: '', photo_urls: [] });
  const [notification, setNotification] = useState('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

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
      await axios.delete(`http://localhost:8000/api/announcements/${deleteId}`, {
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

    setPhotos(prev => [...prev, ...validFiles]);
    setPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = '';
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
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
  };

  const openFullModal = (announcement) => {
    setDescModalContent({
      title: announcement.title,
      description: announcement.description,
      photo_urls: announcement.photo_urls || []
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

  // Function to truncate description to 3 lines while preserving paragraph structure
  const truncateDescription = (text, maxLines = 3) => {
    if (!text) return '';
    
    // Split by paragraphs first and filter out empty ones
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    
    // If only one paragraph or short text, use word-based truncation
    if (paragraphs.length === 1) {
      const words = text.split(' ');
      const maxWords = 25;
      
      if (words.length <= maxWords) return text;
      return words.slice(0, maxWords).join(' ') + '...';
    }
    
    // For multiple paragraphs, show first paragraph + partial second if needed
    if (paragraphs.length === 2) {
      const firstPara = paragraphs[0];
      const secondPara = paragraphs[1];
      
      // If first paragraph is short, include some of second
      if (firstPara.length < 100) {
        const words = secondPara.split(' ');
        const maxWords = 15; // Limit second paragraph words
        
        if (words.length <= maxWords) {
          return `${firstPara}\n\n${secondPara}`;
        } else {
          return `${firstPara}\n\n${words.slice(0, maxWords).join(' ')}...`;
        }
      } else {
        // First paragraph is long enough, truncate it
        const words = firstPara.split(' ');
        const maxWords = 25;
        
        if (words.length <= maxWords) {
          return firstPara + '...';
        } else {
          return words.slice(0, maxWords).join(' ') + '...';
        }
      }
    }
    
    // For 3+ paragraphs, show first two paragraphs
    if (paragraphs.length >= 3) {
      const firstTwo = paragraphs.slice(0, 2).join('\n\n');
      return firstTwo + '...';
    }
    
    return text;
  };

  // Function to check if description needs truncation
  const needsTruncation = (text, maxLines = 3) => {
    if (!text) return false;
    
    // Check for multiple paragraphs (filter out empty ones)
    const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) return true;
    
    // Check word count and character length for single paragraph
    const words = text.split(' ');
    const charCount = text.length;
    
    return words.length > 25 || charCount > 120;
  };

  // Function to render default announcement icon
  const renderDefaultIcon = () => (
    <div className="announcement-default-icon">
      <FaBullhorn size={40} />
      <span className="announcement-default-text">No Image</span>
    </div>
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
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="announcement-form-input" required />
              </div>
              <div>
                <label className="announcement-form-label">DESCRIPTION</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="announcement-form-textarea"
                  placeholder="Enter your announcement description here. You can use multiple paragraphs by pressing Enter."
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
                      <label htmlFor="announcement-photos-upload" className="announcement-upload-btn">
                        Choose Photos
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
                  <small className="announcement-upload-note">Accepted formats: JPEG, PNG, JPG, GIF</small>
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
                {a.description && (
                  <div className="announcement-card-desc">
                    <div className="announcement-text-content">
                      {truncateDescription(a.description)}
                    </div>
                    {needsTruncation(a.description) && (
                      <button
                        className="announcement-card-see-more"
                        onClick={() => openFullModal(a)}
                      >See More</button>
                    )}
                  </div>
                )}
                {/* Show photo or default icon */}
                <div className="announcement-photos-display">
                  {a.photo_urls && a.photo_urls.length > 0 ? (
                    <>
                      <img 
                        src={a.photo_urls[0]} 
                        alt="Announcement" 
                        className="announcement-card-img" 
                      />
                      {a.photo_urls.length > 1 && (
                        <div className="announcement-photos-indicator">
                          <span className="announcement-photos-count">+{a.photo_urls.length - 1} more</span>
                        </div>
                      )}
                    </>
                  ) : (
                    renderDefaultIcon()
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Full Description Modal with Photo Navigation */}
      {showDescModal && (
        <div className="announcement-desc-modal-overlay">
          <div className="announcement-desc-modal-card">
            <button onClick={() => setShowDescModal(false)} className="announcement-desc-modal-close">&times;</button>
            <h3 className="announcement-desc-modal-title">{descModalContent.title}</h3>
            
            {/* Scrollable content container */}
            <div className="announcement-desc-modal-content">
              <div className="announcement-desc-modal-desc">{descModalContent.description}</div>
              
              {/* Photo Navigation (Instagram/Facebook style) */}
              {descModalContent.photo_urls && descModalContent.photo_urls.length > 0 && (
                <div className="announcement-photo-navigation">
                  <div className="announcement-photo-container">
                    <img 
                      src={descModalContent.photo_urls[currentPhotoIndex]} 
                      alt={`Photo ${currentPhotoIndex + 1}`} 
                      className="announcement-desc-modal-img" 
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