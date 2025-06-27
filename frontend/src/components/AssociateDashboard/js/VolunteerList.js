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
  faSortDown
} from '@fortawesome/free-solid-svg-icons';
import AssociateLayout from './AssociateLayout';
import '../css/VolunteerList.css';

function VolunteerList() {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState(null);
  const [viewingVolunteer, setViewingVolunteer] = useState(null);
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

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get('http://localhost:8000/api/volunteers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVolunteers(response.data);
    } catch (err) {
      setError('Failed to fetch volunteers');
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
      const token = localStorage.getItem('authToken');
      const dataToSubmit = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        contact_info: formData.contact_info.replace(/\D/g, '').slice(0, 11)
      };

      if (selectedVolunteer) {
        await axios.put(`http://localhost:8000/api/volunteers/${selectedVolunteer.id}`, dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Volunteer updated successfully!');
      } else {
        await axios.post('http://localhost:8000/api/volunteers', dataToSubmit, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Volunteer added successfully!');
      }
      
      setShowModal(false);
      setSelectedVolunteer(null);
      resetForm();
      fetchVolunteers();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save volunteer');
      setTimeout(() => setError(''), 5000);
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

  const handleView = (volunteer) => {
    setViewingVolunteer(volunteer);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this volunteer?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`http://localhost:8000/api/volunteers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Volunteer deleted successfully!');
      fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete volunteer');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedVolunteers.length} volunteer(s)?`)) return;
    
    try {
      const token = localStorage.getItem('authToken');
      await Promise.all(
        selectedVolunteers.map(id =>
          axios.delete(`http://localhost:8000/api/volunteers/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
      setSuccess(`${selectedVolunteers.length} volunteer(s) deleted successfully!`);
      setSelectedVolunteers([]);
      fetchVolunteers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete some volunteers');
      setTimeout(() => setError(''), 5000);
    }
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

  const exportToCSV = () => {
    const headers = ['Name', 'Gender', 'Address', 'Contact Info', 'Expertise', 'Location'];
    const csvContent = [
      headers.join(','),
      ...filteredVolunteers.map(v => [
        v.name,
        v.gender,
        v.address,
        v.contact_info,
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
        <div className="header-section">
          <div className="header-left">
            <h2>VOLUNTEER LIST</h2>
            <span className="volunteer-count">{filteredVolunteers.length} volunteer(s)</span>
          </div>
          
          <div className="header-actions">
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
              >
                <FontAwesomeIcon icon={faFilter} />
                Filters
              </button>
            </div>

            <div className="action-buttons">
              {selectedVolunteers.length > 0 && (
                <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                  <FontAwesomeIcon icon={faTrash} />
                  Delete ({selectedVolunteers.length})
                </button>
              )}
              
              <button className="export-btn" onClick={exportToCSV}>
                <FontAwesomeIcon icon={faDownload} />
                Export
              </button>
              
              <button className="add-member-btn" onClick={() => setShowModal(true)}>
                <FontAwesomeIcon icon={faUserPlus} />
                Add Volunteer
              </button>
            </div>
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
                Clear Filters
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="alert-message error">
            <FontAwesomeIcon icon={faXmark} />
            {error}
          </div>
        )}

        {success && (
          <div className="alert-message success">
            <FontAwesomeIcon icon={faCheck} />
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading volunteers...</p>
          </div>
        ) : (
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
                  <th onClick={() => handleSort('address')} className="sortable">
                    <div className="th-content">
                      Address
                      <FontAwesomeIcon icon={getSortIcon('address')} />
                    </div>
                  </th>
                  <th onClick={() => handleSort('contact_info')} className="sortable">
                    <div className="th-content">
                      Contact Info
                      <FontAwesomeIcon icon={getSortIcon('contact_info')} />
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      <div className="no-data-content">
                        <FontAwesomeIcon icon={faUserPlus} />
                        <p>No volunteers found</p>
                        <button onClick={() => setShowModal(true)} className="add-first-btn">
                          Add your first volunteer
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVolunteers.map(volunteer => (
                    <tr key={volunteer.id} className={selectedVolunteers.includes(volunteer.id) ? 'selected' : ''}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedVolunteers.includes(volunteer.id)}
                          onChange={() => handleSelectVolunteer(volunteer.id)}
                        />
                      </td>
                      <td className="name-cell">
                        <div className="volunteer-name">
                          <span className="name-text">{volunteer.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`gender-badge ${volunteer.gender?.toLowerCase()}`}>
                          {volunteer.gender}
                        </span>
                      </td>
                      <td className="address-cell">{volunteer.address}</td>
                      <td className="contact-cell">{volunteer.contact_info}</td>
                      <td>
                        {volunteer.expertise && (
                          <span className="expertise-badge">{volunteer.expertise}</span>
                        )}
                      </td>
                      <td>{volunteer.location}</td>
                      <td className="actions-cell">
                        <div className="action-buttons">
                          <button 
                            className="action-btn view-btn" 
                            onClick={() => handleView(volunteer)}
                            title="View Details"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => handleEdit(volunteer)}
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => handleDelete(volunteer.id)}
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
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <FontAwesomeIcon icon={selectedVolunteer ? faEdit : faUserPlus} />
                  {selectedVolunteer ? 'Edit Volunteer' : 'Add New Volunteer'}
                </h3>
                <button className="modal-close" onClick={() => {
                  setShowModal(false);
                  setSelectedVolunteer(null);
                  resetForm();
                }}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
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
                      placeholder="09XXXXXXXXX"
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

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => {
                    setShowModal(false);
                    setSelectedVolunteer(null);
                    resetForm();
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="save-btn">
                    <FontAwesomeIcon icon={selectedVolunteer ? faEdit : faPlus} />
                    {selectedVolunteer ? 'Update Volunteer' : 'Add Volunteer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal && viewingVolunteer && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal-content view-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>
                  <FontAwesomeIcon icon={faEye} />
                  Volunteer Details
                </h3>
                <button className="modal-close" onClick={() => setShowViewModal(false)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
              
              <div className="volunteer-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Full Name:</label>
                    <span>{viewingVolunteer.name}</span>
                  </div>
                  <div className="detail-item">
                    <label>Gender:</label>
                    <span className={`gender-badge ${viewingVolunteer.gender?.toLowerCase()}`}>
                      {viewingVolunteer.gender}
                    </span>
                  </div>
                </div>
                
                <div className="detail-row">
                  <div className="detail-item">
                    <label>Contact Number:</label>
                    <span>{viewingVolunteer.contact_info}</span>
                  </div>
                  <div className="detail-item">
                    <label>Location:</label>
                    <span>{viewingVolunteer.location}</span>
                  </div>
                </div>
                
                <div className="detail-item full-width">
                  <label>Address:</label>
                  <span>{viewingVolunteer.address}</span>
                </div>
                
                {viewingVolunteer.expertise && (
                  <div className="detail-item full-width">
                    <label>Expertise:</label>
                    <span className="expertise-badge">{viewingVolunteer.expertise}</span>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="edit-btn" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingVolunteer);
                  }}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Edit Volunteer
                </button>
                <button 
                  className="delete-btn" 
                  onClick={() => {
                    setShowViewModal(false);
                    handleDelete(viewingVolunteer.id);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  Delete Volunteer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AssociateLayout>
  );
}

export default VolunteerList; 