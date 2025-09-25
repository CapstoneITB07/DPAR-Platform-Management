import React, { useState } from 'react';
import './RegistrationForm.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faBuilding, faUser, faEnvelope, faPhone, faImage, faCheck } from '@fortawesome/free-solid-svg-icons';

const API_BASE = 'http://localhost:8000';

function RegistrationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '',
    director_name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    description: '',
    logo: null
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required';
    }
    
    if (!formData.organization_type.trim()) {
      newErrors.organization_type = 'Organization type is required';
    }
    
    if (!formData.director_name.trim()) {
      newErrors.director_name = 'Director name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^09[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must start with 09 and be 11 digits (numbers only)';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordStrength = checkPasswordStrength(formData.password);
      if (passwordStrength.score < 3) {
        newErrors.password = 'Password must be strong: include uppercase, lowercase, numbers, and special characters';
      }
    }
    
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Organization description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }
    
    if (!formData.logo) {
      newErrors.logo = 'Organization logo is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = [];
    
    if (password.length >= 8) score++;
    else feedback.push('at least 8 characters');
    
    if (/[a-z]/.test(password)) score++;
    else feedback.push('lowercase letters');
    
    if (/[A-Z]/.test(password)) score++;
    else feedback.push('uppercase letters');
    
    if (/[0-9]/.test(password)) score++;
    else feedback.push('numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score++;
    else feedback.push('special characters');
    
    return { score, feedback };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('organization_name', formData.organization_name);
      formDataToSend.append('organization_type', formData.organization_type);
      formDataToSend.append('director_name', formData.director_name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('password_confirmation', formData.password_confirmation);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('logo', formData.logo);
      
      const response = await fetch(`${API_BASE}/api/register`, {
        method: 'POST',
        body: formDataToSend
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Application submitted successfully! Your application has been sent to the admin for review. The OTP will be sent to your email once the admin approves your application.');
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 3000);
      } else {
        if (data.errors) {
          setErrors(data.errors);
        } else {
          setMessage(data.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="registration-form-container">
      <div className="registration-form-card">
        <div className="registration-form-header">
          <h2>Register Your Organization</h2>
          <p>Join the Disaster Preparedness and Response Volunteer Coalition</p>
        </div>
        
        <form onSubmit={handleSubmit} className="registration-form">
          {message && (
            <div className={`registration-message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="organization_name">
              <FontAwesomeIcon icon={faBuilding} className="form-icon" />
              Organization Name *
            </label>
            <input
              type="text"
              id="organization_name"
              name="organization_name"
              value={formData.organization_name}
              onChange={handleInputChange}
              className={errors.organization_name ? 'error' : ''}
              placeholder="Enter your organization name"
            />
            {errors.organization_name && <span className="error-text">{errors.organization_name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="organization_type">
              <FontAwesomeIcon icon={faBuilding} className="form-icon" />
              Organization Type *
            </label>
            <select
              id="organization_type"
              name="organization_type"
              value={formData.organization_type}
              onChange={handleInputChange}
              className={errors.organization_type ? 'error' : ''}
            >
              <option value="">Select organization type</option>
              <option value="Educational Institution">Educational Institution</option>
              <option value="Private Company">Private Company</option>
              <option value="Religious Organization">Religious Organization</option>
              <option value="Community Group">Community Group</option>
              <option value="Government Agency">Government Agency</option>
            </select>
            {errors.organization_type && <span className="error-text">{errors.organization_type}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="director_name">
              <FontAwesomeIcon icon={faUser} className="form-icon" />
              Director Name *
            </label>
            <input
              type="text"
              id="director_name"
              name="director_name"
              value={formData.director_name}
              onChange={handleInputChange}
              className={errors.director_name ? 'error' : ''}
              placeholder="Enter director's full name"
            />
            {errors.director_name && <span className="error-text">{errors.director_name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <FontAwesomeIcon icon={faEnvelope} className="form-icon" />
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email address"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">
              <FontAwesomeIcon icon={faPhone} className="form-icon" />
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/[^0-9]/g, '');
                if (value.length <= 11) {
                  setFormData(prev => ({
                    ...prev,
                    phone: value
                  }));
                }
              }}
              className={errors.phone ? 'error' : ''}
              placeholder="09XXXXXXXXX"
              maxLength="11"
            />
            {errors.phone && <span className="error-text">{errors.phone}</span>}
            <small className="form-help">Must start with 09 and be 11 digits</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <FontAwesomeIcon icon={faCheck} className="form-icon" />
              Password *
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={errors.password ? 'error' : ''}
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
            <small className="form-help">Must include uppercase, lowercase, numbers, and special characters</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="password_confirmation">
              <FontAwesomeIcon icon={faCheck} className="form-icon" />
              Confirm Password *
            </label>
            <div className="password-input-container">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="password_confirmation"
                name="password_confirmation"
                value={formData.password_confirmation}
                onChange={handleInputChange}
                className={errors.password_confirmation ? 'error' : ''}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
              </button>
            </div>
            {errors.password_confirmation && <span className="error-text">{errors.password_confirmation}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">
              <FontAwesomeIcon icon={faBuilding} className="form-icon" />
              Organization Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={errors.description ? 'error' : ''}
              placeholder="Describe your organization's mission, activities, and goals"
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
            <small className="form-help">Minimum 10 characters</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="logo">
              <FontAwesomeIcon icon={faImage} className="form-icon" />
              Organization Logo *
            </label>
            <input
              type="file"
              id="logo"
              name="logo"
              accept="image/*"
              onChange={handleFileChange}
              className={errors.logo ? 'error' : ''}
            />
            {errors.logo && <span className="error-text">{errors.logo}</span>}
            {logoPreview && (
              <div className="logo-preview">
                <img src={logoPreview} alt="Logo preview" />
              </div>
            )}
            <small className="form-help">Upload your organization logo (JPEG, PNG, JPG, GIF - Max 2MB)</small>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrationForm;
