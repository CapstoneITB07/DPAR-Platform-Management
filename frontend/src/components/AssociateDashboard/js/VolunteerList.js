import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faEdit, 
  faTrash, 
  faTimes, 
  faPlus, 
  faFilter, 
  faDownload, 
  faEye,
  faCheck,
  faTimes as faXmark,
  faUserPlus,
  faSort,
  faSortUp,
  faSortDown,
  faVenusMars,
  faPhone,
  faMapMarkerAlt,
  faMapMarkedAlt
} from '@fortawesome/free-solid-svg-icons';
import AssociateLayout from './AssociateLayout';
import '../css/VolunteerList.css';

// Add Toast component
function Toast({ message, type, onClose }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);
  if (!message) return null;
  return (
    <div className={`custom-toast ${type}`}>{message}</div>
  );
}

// Add ConfirmModal component
function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" style={{zIndex: 10000}}>
      <div className="confirm-modal">
        <button className="modal-close confirm-close" onClick={onCancel}>&times;</button>
        <div className="confirm-icon">
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="30" cy="30" r="28" stroke="#e53935" strokeWidth="4" fill="#fff"/>
            <text x="50%" y="50%" textAnchor="middle" dy=".35em" fontSize="32" fill="#e53935">!</text>
          </svg>
        </div>
        <div className="confirm-message">{message}</div>
        <div className="modal-actions confirm-actions">
          <button className="delete-btn" onClick={onConfirm}>Yes, I'm sure</button>
          <button className="cancel-btn" onClick={onCancel}>No, cancel</button>
        </div>
      </div>
    </div>
  );
}

function VolunteerList() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedVolunteers, setSelectedVolunteers] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    expertise: '',
    gender: ''
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    address: '',
    contact_info: '',
    expertise: '',
    location: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [toast, setToast] = useState({ message: '', type: '' });
  // Add state for confirmation modal
  const [confirm, setConfirm] = useState({ open: false, onConfirm: null, message: '' });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsVolunteer, setDetailsVolunteer] = useState(null);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/volunteers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVolunteers(response.data);
    } catch (err) {
      // setError('Failed to fetch volunteers');
      setToast({ message: 'Failed to fetch volunteers', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.gender) errors.gender = 'Gender is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.contact_info || formData.contact_info.length !== 11) {
      errors.contact_info = 'Contact number must be 11 digits';
    }
    if (!formData.location.trim()) errors.location = 'Location is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const dataToSubmit = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        contact_info: formData.contact_info.replace(/\D/g, '').slice(0, 11)
      };
      if (selectedVolunteer) {
        await axios.put(`http://localhost:8000/api/volunteers/${selectedVolunteer.id}`, dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // setSuccess('Volunteer updated successfully!');
        setToast({ message: 'Volunteer updated successfully!', type: 'success' });
      } else {
        await axios.post('http://localhost:8000/api/volunteers', dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // setSuccess('Volunteer added successfully!');
        setToast({ message: 'Volunteer added successfully!', type: 'success' });
      }
      setShowModal(false);
      setSelectedVolunteer(null);
      resetForm();
      fetchVolunteers();
    } catch (err) {
      // setError('Failed to save volunteer');
      setToast({ message: 'Failed to save volunteer', type: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      address: '',
      contact_info: '',
      expertise: '',
      location: ''
    });
    setFormErrors({});
  };

  const handleEdit = (volunteer) => {
    const [firstName = '', lastName = ''] = volunteer.name.split(' ');
    setSelectedVolunteer(volunteer);
    setFormData({
      firstName,
      lastName,
      gender: volunteer.gender,
      address: volunteer.address,
      contact_info: volunteer.contact_info,
      expertise: volunteer.expertise,
      location: volunteer.location
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirm({
      open: true,
      message: 'Are you sure you want to delete this volunteer?',
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          await axios.delete(`http://localhost:8000/api/volunteers/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setToast({ message: 'Volunteer deleted successfully!', type: 'success' });
          fetchVolunteers();
        } catch (err) {
          setToast({ message: 'Failed to delete volunteer', type: 'error' });
        }
      }
    });
  };

  const handleBulkDelete = () => {
    setConfirm({
      open: true,
      message: `Are you sure you want to delete ${selectedVolunteers.length} volunteer(s)?`,
      onConfirm: async () => {
        setConfirm({ ...confirm, open: false });
        try {
          const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
          await Promise.all(
            selectedVolunteers.map(id =>
              axios.delete(`http://localhost:8000/api/volunteers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
            )
          );
          setToast({ message: `${selectedVolunteers.length} volunteer(s) deleted successfully!`, type: 'success' });
          setSelectedVolunteers([]);
          fetchVolunteers();
        } catch (err) {
          setToast({ message: 'Failed to delete some volunteers', type: 'error' });
        }
      }
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVolunteers(filteredVolunteers.map(v => v.id));
    } else {
      setSelectedVolunteers([]);
    }
  };

  const handleSelectVolunteer = (id) => {
    setSelectedVolunteers(prev => 
      prev.includes(id) 
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return faSort;
    return sortConfig.direction === 'asc' ? faSortUp : faSortDown;
  };

  // Get unique values for filters
  const getUniqueValues = (field) => {
    return [...new Set(volunteers.map(v => v[field]).filter(Boolean))];
  };

  const filteredVolunteers = volunteers
    .filter(volunteer => {
      const matchesSearch = volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          volunteer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          volunteer.contact_info.includes(searchTerm);
      const matchesLocation = !filters.location || volunteer.location === filters.location;
      const matchesExpertise = !filters.expertise || volunteer.expertise === filters.expertise;
      const matchesGender = !filters.gender || volunteer.gender === filters.gender;
      return matchesSearch && matchesLocation && matchesExpertise && matchesGender;
    })
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      
      const aValue = a[sortConfig.key] || '';
      const bValue = b[sortConfig.key] || '';
      
      if (sortConfig.direction === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleContactChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, contact_info: value });
    if (formErrors.contact_info) {
      setFormErrors({ ...formErrors, contact_info: '' });
    }
  };

  // Mobile-friendly touch handlers
  const handleTouchStart = (e) => {
    // Add touch feedback for mobile
    e.currentTarget.style.transform = 'scale(0.98)';
  };

  const handleTouchEnd = (e) => {
    // Remove touch feedback
    e.currentTarget.style.transform = 'scale(1)';
  };

  // Responsive table row click handler
  const handleRowClick = (volunteer, e) => {
    // Prevent modal on action buttons or checkbox
    if (
      e.target.closest('.action-btn') ||
      e.target.closest('input[type="checkbox"]')
    ) return;
    
    // On mobile, show details modal instead of edit
    if (window.innerWidth <= 768) {
      setDetailsVolunteer(volunteer);
      setShowDetailsModal(true);
    } else {
      // On desktop, allow both click and action buttons
      setDetailsVolunteer(volunteer);
      setShowDetailsModal(true);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Gender', 'Contact Info', 'Address', 'Expertise', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredVolunteers.map(v => [
        v.name,
        v.gender,
        v.contact_info,
        v.address,
        v.expertise,
        v.location
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'volunteers.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <AssociateLayout>
      <div className="volunteer-list-container">
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: '' })} />
        <ConfirmModal
          open={confirm.open}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm({ ...confirm, open: false })}
        />
        {/* Header Row: Title and Count */}
        <div className="header-row">
          <div className="header-left">
            <h2>VOLUNTEER LIST</h2>
            <span className="volunteer-count">{filteredVolunteers.length} volunteer(s)</span>
          </div>
        </div>
        {/* Controls Row: Search, Filter, Actions */}
        <div className="controls-row">
          <div className="search-container">
            <div className="search-bar">
              <FontAwesomeIcon icon={faSearch} />
              <input
                type="text"
                placeholder="Search volunteers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filters
            </button>
          </div>
          <div className="action-buttons">
            {selectedVolunteers.length > 0 && (
              <button 
                className="bulk-delete-btn" 
                onClick={handleBulkDelete}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete ({selectedVolunteers.length})
              </button>
            )}
            <button 
              className="export-btn" 
              onClick={exportToCSV}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <FontAwesomeIcon icon={faDownload} />
              Export
            </button>
            <button 
              className="add-member-btn" 
              onClick={() => setShowModal(true)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <FontAwesomeIcon icon={faUserPlus} />
              Add <span className="add-volunteer-text"> Volunteer</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filters-grid">
              <select
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <option value="">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              >
                <option value="">All Locations</option>
                {getUniqueValues('location').map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
              
              <select
                value={filters.expertise}
                onChange={(e) => setFilters({ ...filters, expertise: e.target.value })}
              >
                <option value="">All Expertise</option>
                {getUniqueValues('expertise').map(expertise => (
                  <option key={expertise} value={expertise}>{expertise}</option>
                ))}
              </select>
              
              <button 
                className="clear-filters-btn"
                onClick={() => setFilters({ type: '', location: '', expertise: '', gender: '' })}
              >
                Clear Filter
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            {/* <div className="loading-spinner"></div> */}
            <p>Loading volunteers...</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="volunteer-table">
                <thead>
                  <tr>
                    <th className="checkbox-column">
                      <input
                        type="checkbox"
                        checked={selectedVolunteers.length === filteredVolunteers.length && filteredVolunteers.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th onClick={() => handleSort('name')} className="sortable">
                      <div className="th-content">
                        Name
                        <FontAwesomeIcon icon={getSortIcon('name')} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('gender')} className="sortable">
                      <div className="th-content">
                        Gender
                        <FontAwesomeIcon icon={getSortIcon('gender')} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('contact_info')} className="sortable">
                      <div className="th-content">
                        Contact Info
                        <FontAwesomeIcon icon={getSortIcon('contact_info')} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('address')} className="sortable">
                      <div className="th-content">
                        Address
                        <FontAwesomeIcon icon={getSortIcon('address')} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('expertise')} className="sortable">
                      <div className="th-content">
                        Expertise
                        <FontAwesomeIcon icon={getSortIcon('expertise')} />
                      </div>
                    </th>
                    <th onClick={() => handleSort('location')} className="sortable">
                      <div className="th-content">
                        Location
                        <FontAwesomeIcon icon={getSortIcon('location')} />
                      </div>
                    </th>
                    <th style={{textAlign: 'left'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVolunteers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
                        <div className="no-data-content">
                          <FontAwesomeIcon icon={faUserPlus} />
                          <p>No volunteers found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVolunteers.map(volunteer => (
                      <tr
                        key={volunteer.id}
                        className={selectedVolunteers.includes(volunteer.id) ? 'selected' : ''}
                        onClick={(e) => handleRowClick(volunteer, e)}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        style={{ cursor: 'pointer' }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedVolunteers.includes(volunteer.id)}
                            onChange={() => handleSelectVolunteer(volunteer.id)}
                            onClick={e => e.stopPropagation()}
                          />
                        </td>
                        <td className="name-cell">
                          <div className="volunteer-name">
                            <span className="name-text">{volunteer.name}</span>
                          </div>
                        </td>
                        <td>{volunteer.gender}</td>
                        <td className="contact-cell">{volunteer.contact_info}</td>
                        <td className="address-cell">{volunteer.address}</td>
                        <td>{volunteer.expertise}</td>
                        <td>{volunteer.location}</td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            <button
                              className="action-btn edit-btn"
                              onClick={e => { e.stopPropagation(); handleEdit(volunteer); }}
                              onTouchStart={handleTouchStart}
                              onTouchEnd={handleTouchEnd}
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className="action-btn delete-btn"
                              onClick={e => { e.stopPropagation(); handleDelete(volunteer.id); }}
                              onTouchStart={handleTouchStart}
                              onTouchEnd={handleTouchEnd}
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Mobile volunteer count */}
            <div className="volunteer-count-mobile">
              {filteredVolunteers.length} volunteer(s)
            </div>
          </>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="volunteer-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="volunteer-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="volunteer-modal-header">
                <span>{selectedVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}</span>
                <button className="volunteer-modal-close" onClick={() => {
                  setShowModal(false);
                  setSelectedVolunteer(null);
                  resetForm();
                }}>
                  &times;
                </button>
              </div>
              <div className="volunteer-modal-body">
                <form onSubmit={handleSubmit} className="volunteer-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => {
                          setFormData({ ...formData, firstName: e.target.value });
                          if (formErrors.firstName) setFormErrors({ ...formErrors, firstName: '' });
                        }}
                        className={formErrors.firstName ? 'error' : ''}
                        placeholder="Enter first name"
                      />
                      {formErrors.firstName && <span className="error-text">{formErrors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => {
                          setFormData({ ...formData, lastName: e.target.value });
                          if (formErrors.lastName) setFormErrors({ ...formErrors, lastName: '' });
                        }}
                        className={formErrors.lastName ? 'error' : ''}
                        placeholder="Enter last name"
                      />
                      {formErrors.lastName && <span className="error-text">{formErrors.lastName}</span>}
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Gender *</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => {
                          setFormData({ ...formData, gender: e.target.value });
                          if (formErrors.gender) setFormErrors({ ...formErrors, gender: '' });
                        }}
                        className={formErrors.gender ? 'error' : ''}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                      {formErrors.gender && <span className="error-text">{formErrors.gender}</span>}
                    </div>
                    <div className="form-group">
                      <label>Contact Number *</label>
                      <input
                        type="tel"
                        value={formData.contact_info}
                        onChange={handleContactChange}
                        className={formErrors.contact_info ? 'error' : ''}
                        placeholder="11-digit number (ex. 09876543212)"
                        maxLength="11"
                      />
                      {formErrors.contact_info && <span className="error-text">{formErrors.contact_info}</span>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => {
                        setFormData({ ...formData, address: e.target.value });
                        if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                      }}
                      className={formErrors.address ? 'error' : ''}
                      placeholder="Enter complete address"
                    />
                    {formErrors.address && <span className="error-text">{formErrors.address}</span>}
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Location *</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => {
                          setFormData({ ...formData, location: e.target.value });
                          if (formErrors.location) setFormErrors({ ...formErrors, location: '' });
                        }}
                        className={formErrors.location ? 'error' : ''}
                        placeholder="Enter location"
                      />
                      {formErrors.location && <span className="error-text">{formErrors.location}</span>}
                    </div>
                    <div className="form-group">
                      <label>Expertise</label>
                      <input
                        type="text"
                        value={formData.expertise}
                        onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
                        placeholder="Enter expertise (optional)"
                      />
                    </div>
                  </div>
                  <div className="volunteer-modal-actions">
                    <button
                      type="button"
                      className="modal-close-btn-mobile"
                      onClick={() => {
                        setShowModal(false);
                        setSelectedVolunteer(null);
                        resetForm();
                      }}
                    >
                      Close
                    </button>
                    <button type="submit" className="volunteer-save-btn">
                      {selectedVolunteer ? 'Update Volunteer' : 'Add Volunteer'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showDetailsModal && detailsVolunteer && (
          <div className="volunteer-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="view-modal" onClick={e => e.stopPropagation()}>
              <div className="volunteer-modal-header">
                <span>Member Details</span>
                <button className="volunteer-modal-close" style={{position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)'}} onClick={() => setShowDetailsModal(false)}>&times;</button>
              </div>
              <div className="volunteer-details-card">
                <div className="profile-name">{detailsVolunteer.name}</div>
                <div className="profile-info-list">
                  <div className="profile-info-row">
                    <FontAwesomeIcon icon={faVenusMars} className="profile-info-icon" />
                    <span className="profile-info-label">Gender:</span>
                    <span className="profile-info-value">{detailsVolunteer.gender}</span>
                  </div>
                  <div className="profile-info-row">
                    <FontAwesomeIcon icon={faPhone} className="profile-info-icon" />
                    <span className="profile-info-label">Contact:</span>
                    <span className="profile-info-value">{detailsVolunteer.contact_info}</span>
                  </div>
                  <div className="profile-info-row">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="profile-info-icon" />
                    <span className="profile-info-label">Address:</span>
                    <span className="profile-info-value">{detailsVolunteer.address}</span>
                  </div>
                  <div className="profile-info-row">
                    <FontAwesomeIcon icon={faUserPlus} className="profile-info-icon" />
                    <span className="profile-info-label">Expertise:</span>
                    <span className="profile-info-value">{detailsVolunteer.expertise || 'N/A'}</span>
                  </div>
                  <div className="profile-info-row">
                    <FontAwesomeIcon icon={faMapMarkedAlt} className="profile-info-icon" />
                    <span className="profile-info-label">Location:</span>
                    <span className="profile-info-value">{detailsVolunteer.location || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AssociateLayout>
  );
}

export default VolunteerList; 