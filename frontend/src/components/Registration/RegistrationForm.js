import React, { useState, useEffect, useCallback } from 'react';
import './RegistrationForm.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuilding, faUser, faEnvelope, faPhone, faImage, faCheck, faEye, faEyeSlash, faUpload, faTimes, faFileImage } from '@fortawesome/free-solid-svg-icons';

import { API_BASE } from '../../utils/url';

function RegistrationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: '',
    other_organization_type: '',
    director_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    description: '',
    logo: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: '' });
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [nameAvailability, setNameAvailability] = useState(null);
  const [nameCheckTimeout, setNameCheckTimeout] = useState(null);
  const [isCheckingDirectorName, setIsCheckingDirectorName] = useState(false);
  const [directorNameAvailability, setDirectorNameAvailability] = useState(null);
  const [directorNameCheckTimeout, setDirectorNameCheckTimeout] = useState(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailability, setEmailAvailability] = useState(null);
  const [emailCheckTimeout, setEmailCheckTimeout] = useState(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailability, setUsernameAvailability] = useState(null);
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState(null);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const calculatePasswordStrength = (password) => {
    let score = 0;
    let criteria = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // Calculate score based on criteria
    Object.values(criteria).forEach(met => {
      if (met) score++;
    });

    // Determine strength level
    let label, color;
    if (score <= 2) {
      label = 'Weak';
      color = '#dc3545';
    } else if (score <= 3) {
      label = 'Medium';
      color = '#ffc107';
    } else {
      label = 'Strong';
      color = '#28a745';
    }

    return { score, label, color, criteria };
  };

  const checkOrganizationNameAvailability = useCallback(async (organizationName) => {
    if (!organizationName || organizationName.trim().length < 1) {
      setNameAvailability(null);
      return;
    }

    setIsCheckingName(true);
    try {
      const response = await fetch(`${API_BASE}/api/check-organization-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organization_name: organizationName })
      });

      const data = await response.json();
      
      // Organization name check response logged for debugging (remove in production)
      
      if (response.ok) {
        setNameAvailability({
          available: data.available,
          message: data.message
        });
      } else {
        // Don't show error message for API errors, just reset availability
        setNameAvailability(null);
      }
    } catch (error) {
      console.error('Error checking organization name:', error);
      // Don't show error message for network errors, just reset availability
      setNameAvailability(null);
    } finally {
      setIsCheckingName(false);
    }
  }, []);

  const checkDirectorNameAvailability = useCallback(async (directorName) => {
    if (!directorName || directorName.trim().length < 1) {
      setDirectorNameAvailability(null);
      return;
    }

    setIsCheckingDirectorName(true);
    try {
      const response = await fetch(`${API_BASE}/api/check-director-name`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ director_name: directorName })
      });

      const data = await response.json();
      
      // Director name check response logged for debugging (remove in production)
      
      if (response.ok) {
        setDirectorNameAvailability({
          available: data.available,
          message: data.message
        });
      } else {
        // Don't show error message for API errors, just reset availability
        setDirectorNameAvailability(null);
      }
    } catch (error) {
      console.error('Error checking director name:', error);
      // Don't show error message for network errors, just reset availability
      setDirectorNameAvailability(null);
    } finally {
      setIsCheckingDirectorName(false);
    }
  }, []);

  const checkEmailAvailability = useCallback(async (email) => {
    if (!email || email.trim().length < 1 || !email.includes('@')) {
      setEmailAvailability(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await fetch(`${API_BASE}/api/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email })
      });

      const data = await response.json();
      
      // Email check response logged for debugging (remove in production)
      
      if (response.ok) {
        setEmailAvailability({
          available: data.available,
          message: data.message
        });
      } else {
        // Don't show error message for API errors, just reset availability
        setEmailAvailability(null);
      }
    } catch (error) {
      console.error('Error checking email:', error);
      // Don't show error message for network errors, just reset availability
      setEmailAvailability(null);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  const debouncedCheckName = useCallback((organizationName) => {
    // Clear existing timeout
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      checkOrganizationNameAvailability(organizationName);
    }, 500); // 500ms delay

    setNameCheckTimeout(timeout);
  }, [nameCheckTimeout, checkOrganizationNameAvailability]);

  const debouncedCheckDirectorName = useCallback((directorName) => {
    // Clear existing timeout
    if (directorNameCheckTimeout) {
      clearTimeout(directorNameCheckTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      checkDirectorNameAvailability(directorName);
    }, 500); // 500ms delay

    setDirectorNameCheckTimeout(timeout);
  }, [directorNameCheckTimeout, checkDirectorNameAvailability]);

  const debouncedCheckEmail = useCallback((email) => {
    // Clear existing timeout
    if (emailCheckTimeout) {
      clearTimeout(emailCheckTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      checkEmailAvailability(email);
    }, 500); // 500ms delay

    setEmailCheckTimeout(timeout);
  }, [emailCheckTimeout, checkEmailAvailability]);

  const checkUsernameAvailability = useCallback(async (username) => {
    if (!username || username.trim().length < 3) {
      setUsernameAvailability(null);
      return;
    }

    setIsCheckingUsername(true);
    try {
      const response = await fetch(`${API_BASE}/api/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (response.ok) {
        setUsernameAvailability({
          available: data.available,
          message: data.message
        });
      } else {
        setUsernameAvailability(null);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameAvailability(null);
    } finally {
      setIsCheckingUsername(false);
    }
  }, []);

  const debouncedCheckUsername = useCallback((username) => {
    if (usernameCheckTimeout) {
      clearTimeout(usernameCheckTimeout);
    }

    const timeout = setTimeout(() => {
      checkUsernameAvailability(username);
    }, 500);

    setUsernameCheckTimeout(timeout);
  }, [usernameCheckTimeout, checkUsernameAvailability]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (nameCheckTimeout) {
        clearTimeout(nameCheckTimeout);
      }
      if (directorNameCheckTimeout) {
        clearTimeout(directorNameCheckTimeout);
      }
      if (emailCheckTimeout) {
        clearTimeout(emailCheckTimeout);
      }
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout);
      }
    };
  }, [nameCheckTimeout, directorNameCheckTimeout, emailCheckTimeout, usernameCheckTimeout]);

  // Trigger validation when availability status changes
  useEffect(() => {
    if (nameAvailability !== null) {
      // Clear any existing organization name errors and re-validate
      setErrors(prev => {
        const newErrors = { ...prev };
        if (nameAvailability && !nameAvailability.available) {
          newErrors.organization_name = 'This organization name is already registered.';
        } else if (prev.organization_name === 'This organization name is already registered.') {
          delete newErrors.organization_name;
        }
        return newErrors;
      });
    }
  }, [nameAvailability]);

  useEffect(() => {
    if (directorNameAvailability !== null) {
      // Clear any existing director name errors and re-validate
      setErrors(prev => {
        const newErrors = { ...prev };
        if (directorNameAvailability && !directorNameAvailability.available) {
          newErrors.director_name = 'This director name is already registered.';
        } else if (prev.director_name === 'This director name is already registered.') {
          delete newErrors.director_name;
        }
        return newErrors;
      });
    }
  }, [directorNameAvailability]);

  useEffect(() => {
    if (emailAvailability !== null) {
      // Clear any existing email errors and re-validate
      setErrors(prev => {
        const newErrors = { ...prev };
        if (emailAvailability && !emailAvailability.available) {
          newErrors.email = 'This email is already registered.';
        } else if (prev.email === 'This email is already registered.') {
          delete newErrors.email;
        }
        return newErrors;
      });
    }
  }, [emailAvailability]);

  useEffect(() => {
    if (usernameAvailability !== null) {
      // Clear any existing username errors and re-validate
      setErrors(prev => {
        const newErrors = { ...prev };
        if (usernameAvailability && !usernameAvailability.available) {
          newErrors.username = 'This username is already taken.';
        } else if (prev.username === 'This username is already taken.') {
          delete newErrors.username;
        }
        return newErrors;
      });
    }
  }, [usernameAvailability]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for phone number - only allow numbers
    if (name === 'phone') {
      // Remove any non-numeric characters
      const numericValue = value.replace(/\D/g, '');
      // Allow if empty, starts with 0, or starts with 09
      if (numericValue === '' || numericValue.startsWith('0')) {
        setFormData(prev => ({
          ...prev,
          [name]: numericValue
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Calculate password strength when password changes
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Check organization name availability when organization name changes
    if (name === 'organization_name') {
      debouncedCheckName(value);
    }

    // Check director name availability when director name changes
    if (name === 'director_name') {
      debouncedCheckDirectorName(value);
    }

    // Check email availability when email changes
    if (name === 'email') {
      debouncedCheckEmail(value);
    }
    if (name === 'username') {
      debouncedCheckUsername(value);
    }
    
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
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        logo: 'Please upload a valid image file (JPEG, PNG, JPG, GIF)'
      }));
      return;
    }

    // Validate file size (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        logo: 'File size must be less than 2MB'
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      logo: ''
    }));

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
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  };

  const removeFile = () => {
    setFormData(prev => ({
      ...prev,
      logo: null
    }));
    setLogoPreview(null);
    setErrors(prev => ({
      ...prev,
      logo: ''
    }));
  };

  // Helper function to scroll to the first field with an error
  const scrollToFirstError = (errorFields) => {
    // Define the order of fields as they appear in the form
    const fieldOrder = [
      'organization_name',
      'organization_type',
      'other_organization_type',
      'director_name',
      'username',
      'description',
      'email',
      'phone',
      'password',
      'password_confirmation',
      'logo'
    ];
    
    // Find the first field with an error based on the form order
    const firstErrorField = fieldOrder.find(field => errorFields[field]);
    
    if (firstErrorField) {
      // Try to find the input element by ID first
      let element = document.getElementById(firstErrorField);
      
      // If not found by ID, try to find by name attribute
      if (!element) {
        element = document.querySelector(`[name="${firstErrorField}"]`);
      }
      
      // If still not found, try to find the form group container
      if (!element) {
        element = document.querySelector(`.form-group:has([name="${firstErrorField}"])`);
      }
      
      if (element) {
        // Scroll to the element with smooth behavior
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        });
        
        // Focus the input field if it's an input element
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
          setTimeout(() => {
            element.focus();
          }, 500); // Small delay to allow scroll to complete
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.organization_name.trim()) {
      newErrors.organization_name = 'Organization name is required';
    } else if (nameAvailability && !nameAvailability.available) {
      newErrors.organization_name = 'This organization name is already registered.';
    } else if (isCheckingName) {
      newErrors.organization_name = 'Checking name availability...';
    }
    
    if (!formData.organization_type.trim()) {
      newErrors.organization_type = 'Organization type is required';
    } else if (formData.organization_type === 'Others' && !formData.other_organization_type.trim()) {
      newErrors.other_organization_type = 'Please specify the organization type';
    }
    
    if (!formData.director_name.trim()) {
      newErrors.director_name = 'Director name is required';
    } else if (directorNameAvailability && !directorNameAvailability.available) {
      newErrors.director_name = 'This director name is already registered.';
    } else if (isCheckingDirectorName) {
      newErrors.director_name = 'Checking name availability...';
    }
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[A-Za-z0-9_-]{3,30}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters and contain only letters, numbers, underscore, or hyphen';
    } else {
      // Check for TLD patterns (case-insensitive)
      const tlds = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'co', 'io', 'ai', 'tv', 'me', 'info', 'biz', 'name', 'pro', 'xyz', 'online', 'site', 'website', 'tech', 'app', 'dev', 'cloud', 'store', 'shop'];
      const lowerUsername = formData.username.toLowerCase();
      const hasTld = tlds.some(tld => {
        return lowerUsername.endsWith('.' + tld) || new RegExp('\\.' + tld + '[^a-z0-9]', 'i').test(lowerUsername);
      });
      
      if (hasTld) {
        newErrors.username = 'Username cannot contain domain extensions like .com, .net, etc.';
      } else {
        // Check for reserved words (case-insensitive)
        const reservedWords = ['admin', 'administrator', 'root', 'system', 'superadmin', 'super', 'api', 'www', 'mail', 'email', 'support', 'help', 'info', 'contact', 'test', 'testing', 'null', 'undefined', 'true', 'false', 'delete', 'remove', 'update', 'create', 'edit', 'modify', 'user', 'users', 'account', 'accounts', 'login', 'logout', 'register', 'signup', 'password', 'reset', 'recover', 'verify', 'confirm', 'activate', 'deactivate', 'suspend', 'ban', 'block', 'unblock'];
        
        if (reservedWords.includes(lowerUsername)) {
          newErrors.username = 'This username is reserved and cannot be used.';
        } else if (usernameAvailability && !usernameAvailability.available) {
          newErrors.username = 'This username is already taken.';
        } else if (isCheckingUsername) {
          newErrors.username = 'Checking username availability...';
        }
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Email must contain @ symbol';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailAvailability && !emailAvailability.available) {
      newErrors.email = 'This email is already registered.';
    } else if (isCheckingEmail) {
      newErrors.email = 'Checking email availability...';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^09[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must start with 09 and be 11 digits';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push('one lowercase letter');
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push('one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
        passwordErrors.push('one special character');
      }
      
      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }
    
    if (!formData.password_confirmation) {
      newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Passwords do not match';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Organization description is required';
    } else if (formData.description.trim().length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.logo) {
      newErrors.logo = 'Organization logo is required';
    }
    
    setErrors(newErrors);
    
    // If there are errors, scroll to the first one
    if (Object.keys(newErrors).length > 0) {
      setTimeout(() => {
        scrollToFirstError(newErrors);
      }, 100); // Small delay to ensure errors are rendered
    }
    
    return Object.keys(newErrors).length === 0;
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
      // If "Others" is selected, use the custom value, otherwise use the selected type
      const finalOrganizationType = formData.organization_type === 'Others' 
        ? formData.other_organization_type 
        : formData.organization_type;
      formDataToSend.append('organization_type', finalOrganizationType);
      formDataToSend.append('director_name', formData.director_name);
      formDataToSend.append('username', formData.username);
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
          // Scroll to first error when server returns validation errors
          setTimeout(() => {
            scrollToFirstError(data.errors);
          }, 100);
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
              className={`${errors.organization_name ? 'error' : ''} ${nameAvailability && nameAvailability.available ? 'success' : ''}`}
              placeholder="Enter your organization name"
            />
            {errors.organization_name && <span className="error-text">{errors.organization_name}</span>}
            {nameAvailability && !errors.organization_name && (
              <span className={`availability-text ${nameAvailability.available ? 'available' : 'unavailable'}`}>
                {nameAvailability.message}
              </span>
            )}
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
              onChange={(e) => {
                handleInputChange(e);
                // Clear other_organization_type when switching away from "Others"
                if (e.target.value !== 'Others') {
                  setFormData(prev => ({ ...prev, other_organization_type: '' }));
                }
              }}
              className={errors.organization_type ? 'error' : ''}
            >
              <option value="">Select organization type</option>
              <option value="Educational Institution">Educational Institution</option>
              <option value="Private Company">Private Company</option>
              <option value="Religious Organization">Religious Organization</option>
              <option value="Community Group">Community Group</option>
              <option value="Government Agency">Government Agency</option>
              <option value="NGO">NGO</option>
              <option value="Others">Others</option>
            </select>
            {errors.organization_type && <span className="error-text">{errors.organization_type}</span>}
            {formData.organization_type === 'Others' && (
              <input
                type="text"
                name="other_organization_type"
                value={formData.other_organization_type}
                onChange={handleInputChange}
                placeholder="Please specify the organization type"
                className={errors.other_organization_type ? 'error' : ''}
                style={{ marginTop: '8px' }}
              />
            )}
            {errors.other_organization_type && <span className="error-text">{errors.other_organization_type}</span>}
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
              className={`${errors.director_name ? 'error' : ''} ${directorNameAvailability && directorNameAvailability.available ? 'success' : ''}`}
              placeholder="Enter director's full name"
            />
            {errors.director_name && <span className="error-text">{errors.director_name}</span>}
            {directorNameAvailability && !errors.director_name && (
              <span className={`availability-text ${directorNameAvailability.available ? 'available' : 'unavailable'}`}>
                {directorNameAvailability.message}
              </span>
            )}
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
              placeholder="Describe your organization's mission, activities, and how it contributes to disaster preparedness and response"
              rows="4"
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
            <small className="form-help">Minimum 20 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="username">
              <FontAwesomeIcon icon={faUser} className="form-icon" />
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`${errors.username ? 'error' : ''} ${usernameAvailability && usernameAvailability.available ? 'success' : ''}`}
              placeholder="Choose a unique username"
            />
            {errors.username && <span className="error-text">{errors.username}</span>}
            {usernameAvailability && !errors.username && (
              <span className={`availability-text ${usernameAvailability.available ? 'available' : 'unavailable'}`}>
                {usernameAvailability.message}
              </span>
            )}
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
              className={`${errors.email ? 'error' : ''} ${emailAvailability && emailAvailability.available ? 'success' : ''}`}
              placeholder="Enter your email address"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
            {emailAvailability && !errors.email && (
              <span className={`availability-text ${emailAvailability.available ? 'available' : 'unavailable'}`}>
                {emailAvailability.message}
              </span>
            )}
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
              onChange={handleInputChange}
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
              <span
                onClick={togglePasswordVisibility}
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
                role="button"
              >
                {showPassword ? (
                  <FontAwesomeIcon icon={faEye} />
                ) : (
                  <FontAwesomeIcon icon={faEyeSlash} />
                )}
              </span>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="password-strength-indicator">
                <div className="strength-bar">
                  <div 
                    className="strength-fill" 
                    style={{ 
                      width: `${(passwordStrength.score / 5) * 100}%`,
                      backgroundColor: passwordStrength.color 
                    }}
                  ></div>
                </div>
                <div className="strength-info">
                  <span 
                    className="strength-label" 
                    style={{ color: passwordStrength.color }}
                  >
                    Password Strength: {passwordStrength.label}
                  </span>
                  <span className="strength-score">
                    {passwordStrength.score}/5 criteria met
                  </span>
                </div>
                <div className="strength-criteria">
                  <div className={`criteria-item ${passwordStrength.criteria.length ? 'met' : 'unmet'}`}>
                    <span className="criteria-icon">{passwordStrength.criteria.length ? '✓' : '○'}</span>
                    At least 8 characters
                  </div>
                  <div className={`criteria-item ${passwordStrength.criteria.uppercase ? 'met' : 'unmet'}`}>
                    <span className="criteria-icon">{passwordStrength.criteria.uppercase ? '✓' : '○'}</span>
                    Uppercase letter
                  </div>
                  <div className={`criteria-item ${passwordStrength.criteria.lowercase ? 'met' : 'unmet'}`}>
                    <span className="criteria-icon">{passwordStrength.criteria.lowercase ? '✓' : '○'}</span>
                    Lowercase letter
                  </div>
                  <div className={`criteria-item ${passwordStrength.criteria.number ? 'met' : 'unmet'}`}>
                    <span className="criteria-icon">{passwordStrength.criteria.number ? '✓' : '○'}</span>
                    Number
                  </div>
                  <div className={`criteria-item ${passwordStrength.criteria.special ? 'met' : 'unmet'}`}>
                    <span className="criteria-icon">{passwordStrength.criteria.special ? '✓' : '○'}</span>
                    Special character
                  </div>
                </div>
              </div>
            )}
            
            <small className="form-help">Must contain: 8+ characters, uppercase, lowercase, number, and special character</small>
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
              <span
                onClick={toggleConfirmPasswordVisibility}
                className="password-toggle"
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={0}
                role="button"
              >
                {showConfirmPassword ? (
                  <FontAwesomeIcon icon={faEye} />
                ) : (
                  <FontAwesomeIcon icon={faEyeSlash} />
                )}
              </span>
            </div>
            {errors.password_confirmation && <span className="error-text">{errors.password_confirmation}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="logo">
              <FontAwesomeIcon icon={faImage} className="form-icon" />
              Organization Logo *
            </label>
            
            {!logoPreview ? (
              <div 
                className={`file-upload-area ${isDragOver ? 'drag-over' : ''} ${errors.logo ? 'error' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('logo').click()}
              >
                <div className="file-upload-content">
                  <FontAwesomeIcon icon={faUpload} className="upload-icon" />
                  <h3>Upload Organization Logo</h3>
                  <p>Drag and drop your logo here, or <span className="browse-link">browse files</span></p>
                  <div className="file-requirements">
                    <small>Supported formats: JPEG, PNG, JPG, GIF</small>
                    <small>Maximum size: 2MB</small>
                  </div>
                </div>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="file-preview-container">
                <div className="file-preview">
                  <img src={logoPreview} alt="Logo preview" className="preview-image" />
                  <div className="file-info">
                    <div className="file-name">
                      <FontAwesomeIcon icon={faFileImage} className="file-icon" />
                      <span>{formData.logo?.name}</span>
                    </div>
                    <div className="file-size">
                      {(formData.logo?.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={removeFile} 
                    className="remove-file-btn"
                    aria-label="Remove file"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            )}
            
            {errors.logo && <span className="error-text">{errors.logo}</span>}
            <small className="form-help">Upload your organization logo (JPEG, PNG, JPG, GIF - Max 2MB)</small>
          </div>
          
          {message && (
            <div className={`registration-message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}
          
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
