import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { FaEllipsisH, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
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
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="announcement-form-input" />
              </div>
              <div>
                <label className="announcement-form-label">DESCRIPTION</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="announcement-form-textarea" />
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
                  <small className="announcement-upload-note">Accepted formats: JPEG, PNG, JPG, GIF (max 2MB each)</small>
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
                {/* Show only first photo in card */}
                {a.photo_urls && a.photo_urls.length > 0 && (
                  <div className="announcement-photos-display">
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
                  </div>
                )}
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
      )}
    </AdminLayout>
  );
}

export default Announcement; 