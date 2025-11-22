import React, { useState, useEffect, useCallback } from 'react';
import CertificatePreview from './CertificatePreview';
import Modal from 'react-modal';
import axiosInstance from '../../../utils/axiosConfig';
import '../css/CertificateModal.css';

const CertificateModal = ({ show, onClose, associates, certificateData, onCertificateDataChange }) => {
  const [localData, setLocalData] = useState({
    ...certificateData,
    // Customization defaults
    backgroundColor: certificateData?.backgroundColor || '#014A9B',
    accentColor: certificateData?.accentColor || '#F7B737',
    lightAccentColor: certificateData?.lightAccentColor || '#4AC2E0',
    borderColor: certificateData?.borderColor || '#2563b6',
    showTransparentBox: certificateData?.showTransparentBox !== undefined ? certificateData.showTransparentBox : true,
    // Per-part font settings
    titleFontFamily: certificateData?.titleFontFamily || 'Playfair Display',
    titleFontSize: certificateData?.titleFontSize || 'medium',
    nameFontFamily: certificateData?.nameFontFamily || 'Playfair Display',
    nameFontSize: certificateData?.nameFontSize || 'medium',
    messageFontFamily: certificateData?.messageFontFamily || 'Montserrat',
    messageFontSize: certificateData?.messageFontSize || 'medium',
    signatoryFontFamily: certificateData?.signatoryFontFamily || 'Montserrat',
    signatoryFontSize: certificateData?.signatoryFontSize || 'medium',
  });
  const [downloading, setDownloading] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [recipients, setRecipients] = useState([{ name: '' }]);
  const [bulkInput, setBulkInput] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [backgroundImagePreview, setBackgroundImagePreview] = useState(null);
  const [designImage, setDesignImage] = useState(null);
  const [designImagePreview, setDesignImagePreview] = useState(null);

  // Helper function to calculate word count
  const getWordCount = (text) => {
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  };

  // Helper function to check if word count exceeds limit
  const isWordCountExceeded = (text) => {
    return getWordCount(text) > 100;
  };

  // Helper function to check if character count exceeds limit
  const isCharacterCountExceeded = (text) => {
    return text && text.length > 1000;
  };

  // Debounced function to update parent component
  const debouncedUpdate = useCallback((updatedData) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    
    const timer = setTimeout(() => {
      onCertificateDataChange(updatedData);
    }, 300); // 300ms delay
    
    setDebounceTimer(timer);
  }, [debounceTimer, onCertificateDataChange]);

  // Show warning message
  const showWarningMessage = (message) => {
    setWarningMessage(message);
    setShowWarning(true);
    setTimeout(() => setShowWarning(false), 3000); // Auto-hide after 3 seconds
  };

  useEffect(() => {
    setLocalData({
      ...certificateData,
      backgroundColor: certificateData?.backgroundColor || '#014A9B',
      accentColor: certificateData?.accentColor || '#F7B737',
      lightAccentColor: certificateData?.lightAccentColor || '#4AC2E0',
      borderColor: certificateData?.borderColor || '#2563b6',
      showTransparentBox: certificateData?.showTransparentBox !== undefined ? certificateData.showTransparentBox : true,
      // Per-part font settings
      titleFontFamily: certificateData?.titleFontFamily || 'Playfair Display',
      titleFontSize: certificateData?.titleFontSize || 'medium',
      nameFontFamily: certificateData?.nameFontFamily || 'Playfair Display',
      nameFontSize: certificateData?.nameFontSize || 'medium',
      messageFontFamily: certificateData?.messageFontFamily || 'Montserrat',
      messageFontSize: certificateData?.messageFontSize || 'medium',
      signatoryFontFamily: certificateData?.signatoryFontFamily || 'Montserrat',
      signatoryFontSize: certificateData?.signatoryFontSize || 'medium',
    });
  }, [certificateData]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for message field to prevent spam
    if (name === 'message') {
      // Check character limit first
      if (value.length > 1000) {
        showWarningMessage('Character limit exceeded! Maximum 1000 characters allowed.');
        return;
      }
      
      // Check for repeated characters (spam detection)
      if (value.length > 50) {
        const repeatedPattern = /(.)\1{10,}/; // Detect 11+ repeated characters
        if (repeatedPattern.test(value)) {
          showWarningMessage('Too many repeated characters detected. Please enter a meaningful message.');
          return;
        }
      }
    }
    
    const updated = { 
      ...localData, 
      [name]: type === 'checkbox' ? checked : value 
    };
    setLocalData(updated);
    
    // Use debounced update for parent component
    debouncedUpdate(updated);
  };

  const handleBackgroundImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - check specific MIME types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showWarningMessage('Image format not allowed. Please upload JPEG, PNG, GIF, or WebP format.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file extension
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const extension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        showWarningMessage('File type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showWarningMessage('Image size must be less than 5MB.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setBackgroundImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDesignImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type - check specific MIME types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showWarningMessage('Image format not allowed. Please upload JPEG, PNG, GIF, or WebP format.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file extension
      const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      const extension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        showWarningMessage('File type not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showWarningMessage('Image size must be less than 5MB.');
        e.target.value = ''; // Clear the input
        return;
      }
      
      setDesignImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesignImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackgroundImage = (e) => {
    setBackgroundImage(null);
    setBackgroundImagePreview(null);
    const fileInput = document.getElementById('backgroundImage');
    if (fileInput) fileInput.value = '';
  };

  const removeDesignImage = (e) => {
    setDesignImage(null);
    setDesignImagePreview(null);
    const fileInput = document.getElementById('designImage');
    if (fileInput) fileInput.value = '';
  };

  const handleSignatoryChange = (index, field, value) => {
    const updatedSignatories = [...(localData.signatories || [{ name: '', title: '' }])];
    updatedSignatories[index] = { ...updatedSignatories[index], [field]: value };
    const updated = { ...localData, signatories: updatedSignatories };
    setLocalData(updated);
    onCertificateDataChange(updated);
  };

  const addSignatory = () => {
    const currentSignatories = localData.signatories || [{ name: '', title: '' }];
    if (currentSignatories.length < 5) {
      const updatedSignatories = [...currentSignatories, { name: '', title: '' }];
      const updated = { ...localData, signatories: updatedSignatories };
      setLocalData(updated);
      onCertificateDataChange(updated);
    }
  };

  const removeSignatory = (index) => {
    const currentSignatories = localData.signatories || [{ name: '', title: '' }];
    if (currentSignatories.length > 1) {
      const updatedSignatories = currentSignatories.filter((_, i) => i !== index);
      const updated = { ...localData, signatories: updatedSignatories };
      setLocalData(updated);
      onCertificateDataChange(updated);
    }
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: '' }]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index, field, value) => {
    const updatedRecipients = [...recipients];
    updatedRecipients[index] = { ...updatedRecipients[index], [field]: value };
    setRecipients(updatedRecipients);
  };


  const parseBulkInput = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const parsedRecipients = lines.map(line => {
      // Just take the first part (name) from tab or comma separated input
      const parts = line.split('\t');
      if (parts.length >= 1) {
        return { name: parts[0].trim() };
      } else {
        const commaParts = line.split(',');
        if (commaParts.length >= 1) {
          return { name: commaParts[0].trim() };
        }
      }
      return { name: line.trim() };
    }).filter(recipient => recipient.name);
    
    setRecipients(parsedRecipients.length > 0 ? parsedRecipients : [{ name: '' }]);
  };

  const isFormValid = () => {
    if (!localData.message) return false;
    
    // Check word count limit
    if (isWordCountExceeded(localData.message)) {
      return false;
    }
    
    const signatories = localData.signatories || [];
    for (const signatory of signatories) {
      if (!signatory.name || !signatory.title) return false;
    }
    
    if (isBulkMode) {
      for (const recipient of recipients) {
        if (!recipient.name) return false;
      }
    } else {
      if (!localData.name) return false;
    }
    return true;
  };

  const handleDownload = async () => {
    if (!isFormValid()) {
      // Check specific validation errors
      if (!localData.message) {
        alert('Please enter an appreciation message.');
        return;
      }
      
      const wordCount = getWordCount(localData.message);
      if (isWordCountExceeded(localData.message)) {
        const wordCount = getWordCount(localData.message);
        alert(`Appreciation message exceeds 100 words. Current: ${wordCount} words. Please shorten your message.`);
        return;
      }
      
      const signatories = localData.signatories || [];
      for (const signatory of signatories) {
        if (!signatory.name || !signatory.title) {
          alert('Please fill out all signatory names and titles.');
          return;
        }
      }
      
      if (isBulkMode) {
        for (const recipient of recipients) {
          if (!recipient.name) {
            alert('Please fill out all recipient names.');
            return;
          }
        }
      } else {
        if (!localData.name) {
          alert('Please enter a recipient name.');
          return;
        }
      }
      
      const message = isBulkMode 
        ? 'Please fill out all required fields: message, each signatory\'s name and title, and all recipient names.'
        : 'Please fill out all required fields: recipient name, message, and each signatory\'s name and title.';
      alert(message);
      return;
    }

    setDownloading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://dparvc.com');
      const assetBaseUrl = `${process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://dparvc.com')}/Assets`;

      const selectedAssociateObj = associates.find(a => a.name === localData.associate);
      const logoUrl = selectedAssociateObj
        ? `${assetBaseUrl}/${selectedAssociateObj.logo.replace('/Assets/', '')}`
        : `${assetBaseUrl}/disaster_logo.png`;

      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add required design image
      if (designImage) {
        formData.append('designImage', designImage);
      }
      
      // Add optional background image
      if (backgroundImage) {
        formData.append('backgroundImage', backgroundImage);
      }
      
      // Add certificate data
      const certificatePayload = {
        name: localData.name,
        date: localData.date,
        signatories: localData.signatories || [{ name: '', title: '' }],
        message: localData.message,
        logoUrl: logoUrl,
        format: 'pdf',
        timestamp: Date.now(),
        // Customization options
        backgroundColor: localData.backgroundColor || '#014A9B',
        accentColor: localData.accentColor || '#F7B737',
        lightAccentColor: localData.lightAccentColor || '#4AC2E0',
        borderColor: localData.borderColor || '#2563b6',
        showTransparentBox: localData.showTransparentBox !== undefined ? localData.showTransparentBox : true,
        // Per-part font settings
        titleFontFamily: localData.titleFontFamily || 'Playfair Display',
        titleFontSize: localData.titleFontSize || 'medium',
        nameFontFamily: localData.nameFontFamily || 'Playfair Display',
        nameFontSize: localData.nameFontSize || 'medium',
        messageFontFamily: localData.messageFontFamily || 'Montserrat',
        messageFontSize: localData.messageFontSize || 'medium',
        signatoryFontFamily: localData.signatoryFontFamily || 'Montserrat',
        signatoryFontSize: localData.signatoryFontSize || 'medium',
      };
      
      formData.append('certificateData', JSON.stringify(certificatePayload));

      if (isBulkMode) {
        // Add bulk recipients
        formData.append('recipients', JSON.stringify(recipients));
        
        // Bulk generation
        const response = await axiosInstance.post(
          `${backendBaseUrl}/api/certificates/bulk`,
          formData,
          {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          }
        );

        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bulk_certificates_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Single generation
        const response = await axiosInstance.post(
          `${backendBaseUrl}/api/certificates`,
          formData,
          {
            responseType: 'blob',
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: 'application/pdf',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          }
        );

        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Certificate generation error:', err);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://dparvc.com');
  const selectedAssociateObj = associates.find(a => a.name === localData.associate);
  const logoUrl = selectedAssociateObj
    ? `${backendBaseUrl}${selectedAssociateObj.logo}`
    : `${backendBaseUrl}/Assets/disaster_logo.png`;

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      className="certificate-modal-root"
      overlayClassName="certificate-modal-overlay"
      ariaHideApp={false}
    >
      <div className="certificate-modal-card">
        <div className="certificate-modal-header-red">
          <h2 style={{margin: 0, fontWeight: 700}}>Generate Certificate</h2>
          <button className="certificate-modal-close" onClick={onClose}>&times;</button>
        </div>
        
        {/* Warning Message Display */}
        {showWarning && (
          <div style={{
            background: '#ff9800',
            color: 'white',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
            borderBottom: '1px solid #f57c00'
          }}>
            ⚠️ {warningMessage}
          </div>
        )}
        
        <div className="certificate-modal-content enhanced-modal-content">
          <div className="enhanced-modal-flex">
            <div className="enhanced-form-card">
              <div className="certificate-mode-toggle">
                <button
                  className={`mode-btn ${!isBulkMode ? 'active' : ''}`}
                  onClick={() => setIsBulkMode(false)}
                >
                  Single Certificate
                </button>
                <button
                  className={`mode-btn ${isBulkMode ? 'active' : ''}`}
                  onClick={() => setIsBulkMode(true)}
                >
                  Bulk Certificates
                </button>
              </div>

              <form className="certificate-form">
                {!isBulkMode ? (
                  <>
                  <div className="certificate-form-group">
                    <label htmlFor="name">Recipient Name:</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      placeholder="Enter recipient name"
                      value={localData.name || ''}
                      onChange={handleChange}
                    />
                  </div>
                </>
                ) : (
                  <div className="bulk-section">
                    <div className="bulk-input-section">
                      <h3>Bulk Input</h3>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                        Paste names from Excel (one per line):
                      </p>
                      <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="John Doe&#10;Jane Smith&#10;Mike Johnson"
                        style={{
                          width: '100%',
                          height: '120px',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '0.9rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={parseBulkInput}
                        style={{
                          background: '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          marginTop: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Add to Table
                      </button>
                    </div>

                    <div className="recipients-table-section">
                      <h3>Recipients ({recipients.length})</h3>
                      <div className="recipients-table-container">
                        <div className="recipients-table">
                          <div className="recipients-header">
                            <div className="recipient-name-header">Name</div>
                            <div className="recipient-actions-header">Actions</div>
                          </div>
                          <div className="recipients-body">
                            {recipients.map((recipient, index) => (
                              <div key={index} className="recipient-row">
                                <input
                                  type="text"
                                  placeholder="Enter name"
                                  value={recipient.name}
                                  onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                  className="recipient-name-input"
                                />
                                <div className="recipient-actions">
                                  {recipients.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeRecipient(index)}
                                      className="remove-recipient-btn"
                                    >
                                      ×
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={addRecipient}
                        style={{
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '8px 16px',
                          marginTop: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        Add Recipient
                      </button>
                    </div>
                  </div>
                )}

                <div className="certificate-form-group">
                  <label>Signatories:</label>
                  <small style={{ color: '#666', display: 'block', marginBottom: 8 }}>
                    Maximum 5 signatories
                  </small>
                  {(localData.signatories || [{ name: '', title: '' }]).map((signatory, index, arr) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            placeholder="Enter signatory name"
                            value={signatory.name || ''}
                            onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)}
                            style={{ width: '100%', padding: '5px', marginTop: '2px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <input
                            type="text"
                            placeholder="e.g. Founder, CEO, etc."
                            value={signatory.title || ''}
                            onChange={(e) => handleSignatoryChange(index, 'title', e.target.value)}
                            style={{ width: '100%', padding: '5px', marginTop: '2px' }}
                          />
                        </div>
                      </div>
                      {index === arr.length - 1 && arr.length < 5 && (
                        <button
                          type="button"
                          onClick={addSignatory}
                          style={{
                            background: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          +
                        </button>
                      )}
                      {arr.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSignatory(index)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="certificate-form-group">
                  <label htmlFor="message">Appreciation Message:</label>
                  <textarea
                    id="message"
                    name="message"
                    value={localData.message}
                    onChange={handleChange}
                    placeholder="Enter your appreciation message here. You can use line breaks to format the text properly. Maximum 100 words."
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      border: isWordCountExceeded(localData.message) || isCharacterCountExceeded(localData.message) ? '2px solid #d32f2f' : '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    maxLength={1000}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <small style={{ color: '#666' }}>
                      Tip: Press Enter to create line breaks for better formatting
                    </small>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <small style={{ 
                        color: isCharacterCountExceeded(localData.message) ? '#d32f2f' : '#666',
                        fontWeight: isCharacterCountExceeded(localData.message) ? 'bold' : 'normal'
                      }}>
                        {localData.message ? localData.message.length : 0} / 1000 characters
                      </small>
                      <small style={{ 
                        color: isWordCountExceeded(localData.message) ? '#d32f2f' : '#666',
                        fontWeight: isWordCountExceeded(localData.message) ? 'bold' : 'normal'
                      }}>
                        {getWordCount(localData.message)} / 100 words
                      </small>
                    </div>
                  </div>
                </div>

                {/* Certificate Customization Section */}
                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '2px solid #e0e0e0' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', color: '#333' }}>
                    Certificate Customization
                  </h3>

                  {/* Image Uploads */}
                  <div className="certificate-form-group">
                    <label htmlFor="backgroundImage" style={{ display: 'block', marginBottom: '8px' }}>
                      Background Image (Optional):
                      <small style={{ color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                        Recommended: 1123x794px (A4 Landscape)
                      </small>
                    </label>
                    <input
                      type="file"
                      id="backgroundImage"
                      accept="image/*"
                      onChange={handleBackgroundImageChange}
                      style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                    />
                    {backgroundImagePreview && (
                      <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px' }}>
                        <img 
                          src={backgroundImagePreview} 
                          alt="Background preview" 
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <button
                          type="button"
                          onClick={removeBackgroundImage}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="certificate-form-group">
                    <label htmlFor="designImage" style={{ display: 'block', marginBottom: '8px' }}>
                      Design Overlay Image (Optional):
                      <small style={{ color: '#666', marginLeft: '8px', fontWeight: 'normal' }}>
                        If not provided, default geometric pattern will be used
                      </small>
                    </label>
                    <input
                      type="file"
                      id="designImage"
                      accept="image/*"
                      onChange={handleDesignImageChange}
                      style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
                    />
                    {designImagePreview && (
                      <div style={{ position: 'relative', display: 'inline-block', marginTop: '8px' }}>
                        <img 
                          src={designImagePreview} 
                          alt="Design preview" 
                          style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '4px', border: '1px solid #ddd' }}
                        />
                        <button
                          type="button"
                          onClick={removeDesignImage}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Color Customization */}
                  <div style={{ marginTop: '16px' }}>
                    {designImagePreview && (
                      <div style={{ 
                        padding: '8px 12px', 
                        marginBottom: '12px', 
                        backgroundColor: '#fff3cd', 
                        border: '1px solid #ffc107', 
                        borderRadius: '4px',
                        color: '#856404',
                        fontSize: '0.9rem'
                      }}>
                        <strong>Note:</strong> Color customization is disabled because a design overlay image is active. Remove the design overlay to enable color customization.
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="certificate-form-group">
                        <label htmlFor="backgroundColor" style={{ opacity: designImagePreview ? 0.6 : 1 }}>
                          Primary Color (Background):
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            id="backgroundColor"
                            name="backgroundColor"
                            value={localData.backgroundColor || '#014A9B'}
                            onChange={handleChange}
                            disabled={!!designImagePreview}
                            style={{ 
                              width: '60px', 
                              height: '40px', 
                              cursor: designImagePreview ? 'not-allowed' : 'pointer', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1
                            }}
                          />
                          <input
                            type="text"
                            value={localData.backgroundColor || '#014A9B'}
                            onChange={(e) => handleChange({ target: { name: 'backgroundColor', value: e.target.value } })}
                            disabled={!!designImagePreview}
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1,
                              cursor: designImagePreview ? 'not-allowed' : 'text',
                              backgroundColor: designImagePreview ? '#f5f5f5' : 'white'
                            }}
                            placeholder="#014A9B"
                          />
                        </div>
                      </div>

                      <div className="certificate-form-group">
                        <label htmlFor="accentColor" style={{ opacity: designImagePreview ? 0.6 : 1 }}>
                          Accent Color (Yellow):
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            id="accentColor"
                            name="accentColor"
                            value={localData.accentColor || '#F7B737'}
                            onChange={handleChange}
                            disabled={!!designImagePreview}
                            style={{ 
                              width: '60px', 
                              height: '40px', 
                              cursor: designImagePreview ? 'not-allowed' : 'pointer', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1
                            }}
                          />
                          <input
                            type="text"
                            value={localData.accentColor || '#F7B737'}
                            onChange={(e) => handleChange({ target: { name: 'accentColor', value: e.target.value } })}
                            disabled={!!designImagePreview}
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1,
                              cursor: designImagePreview ? 'not-allowed' : 'text',
                              backgroundColor: designImagePreview ? '#f5f5f5' : 'white'
                            }}
                            placeholder="#F7B737"
                          />
                        </div>
                      </div>

                      <div className="certificate-form-group">
                        <label htmlFor="lightAccentColor" style={{ opacity: designImagePreview ? 0.6 : 1 }}>
                          Light Accent Color (Light Blue):
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            id="lightAccentColor"
                            name="lightAccentColor"
                            value={localData.lightAccentColor || '#4AC2E0'}
                            onChange={handleChange}
                            disabled={!!designImagePreview}
                            style={{ 
                              width: '60px', 
                              height: '40px', 
                              cursor: designImagePreview ? 'not-allowed' : 'pointer', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1
                            }}
                          />
                          <input
                            type="text"
                            value={localData.lightAccentColor || '#4AC2E0'}
                            onChange={(e) => handleChange({ target: { name: 'lightAccentColor', value: e.target.value } })}
                            disabled={!!designImagePreview}
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1,
                              cursor: designImagePreview ? 'not-allowed' : 'text',
                              backgroundColor: designImagePreview ? '#f5f5f5' : 'white'
                            }}
                            placeholder="#4AC2E0"
                          />
                        </div>
                      </div>

                      <div className="certificate-form-group">
                        <label htmlFor="borderColor" style={{ opacity: designImagePreview ? 0.6 : 1 }}>
                          Border Color (Center Box):
                        </label>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="color"
                            id="borderColor"
                            name="borderColor"
                            value={localData.borderColor || '#2563b6'}
                            onChange={handleChange}
                            disabled={!!designImagePreview}
                            style={{ 
                              width: '60px', 
                              height: '40px', 
                              cursor: designImagePreview ? 'not-allowed' : 'pointer', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1
                            }}
                          />
                          <input
                            type="text"
                            value={localData.borderColor || '#2563b6'}
                            onChange={(e) => handleChange({ target: { name: 'borderColor', value: e.target.value } })}
                            disabled={!!designImagePreview}
                            style={{ 
                              flex: 1, 
                              padding: '8px', 
                              border: '1px solid #ddd', 
                              borderRadius: '4px',
                              opacity: designImagePreview ? 0.5 : 1,
                              cursor: designImagePreview ? 'not-allowed' : 'text',
                              backgroundColor: designImagePreview ? '#f5f5f5' : 'white'
                            }}
                            placeholder="#2563b6"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Transparent Box Toggle */}
                  <div className="certificate-form-group" style={{ marginTop: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        name="showTransparentBox"
                        checked={localData.showTransparentBox !== undefined ? localData.showTransparentBox : true}
                        onChange={handleChange}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span>Show Transparent White Box (Center Panel)</span>
                    </label>
                  </div>

                  {/* Font Customization - Per Part */}
                  <div style={{ marginTop: '16px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#333' }}>
                      Font Customization (Per Part)
                    </h4>
                    
                    {/* Title Font */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div className="certificate-form-group">
                        <label htmlFor="titleFontFamily">Title Font Family:</label>
                        <select
                          id="titleFontFamily"
                          name="titleFontFamily"
                          value={localData.titleFontFamily || 'Playfair Display'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="Playfair Display">Playfair Display (Elegant)</option>
                          <option value="Montserrat">Montserrat (Modern)</option>
                          <option value="Roboto">Roboto (Clean)</option>
                          <option value="Open Sans">Open Sans (Professional)</option>
                          <option value="Lato">Lato (Classic)</option>
                        </select>
                      </div>
                      <div className="certificate-form-group">
                        <label htmlFor="titleFontSize">Title Font Size:</label>
                        <select
                          id="titleFontSize"
                          name="titleFontSize"
                          value={localData.titleFontSize || 'medium'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>

                    {/* Name Font */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div className="certificate-form-group">
                        <label htmlFor="nameFontFamily">Name Font Family:</label>
                        <select
                          id="nameFontFamily"
                          name="nameFontFamily"
                          value={localData.nameFontFamily || 'Playfair Display'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="Playfair Display">Playfair Display (Elegant)</option>
                          <option value="Montserrat">Montserrat (Modern)</option>
                          <option value="Roboto">Roboto (Clean)</option>
                          <option value="Open Sans">Open Sans (Professional)</option>
                          <option value="Lato">Lato (Classic)</option>
                        </select>
                      </div>
                      <div className="certificate-form-group">
                        <label htmlFor="nameFontSize">Name Font Size:</label>
                        <select
                          id="nameFontSize"
                          name="nameFontSize"
                          value={localData.nameFontSize || 'medium'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>

                    {/* Message Font */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div className="certificate-form-group">
                        <label htmlFor="messageFontFamily">Message Font Family:</label>
                        <select
                          id="messageFontFamily"
                          name="messageFontFamily"
                          value={localData.messageFontFamily || 'Montserrat'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="Montserrat">Montserrat (Default)</option>
                          <option value="Playfair Display">Playfair Display (Elegant)</option>
                          <option value="Roboto">Roboto (Modern)</option>
                          <option value="Open Sans">Open Sans (Clean)</option>
                          <option value="Lato">Lato (Professional)</option>
                        </select>
                      </div>
                      <div className="certificate-form-group">
                        <label htmlFor="messageFontSize">Message Font Size:</label>
                        <select
                          id="messageFontSize"
                          name="messageFontSize"
                          value={localData.messageFontSize || 'medium'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>

                    {/* Signatory Font */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="certificate-form-group">
                        <label htmlFor="signatoryFontFamily">Signatory Font Family:</label>
                        <select
                          id="signatoryFontFamily"
                          name="signatoryFontFamily"
                          value={localData.signatoryFontFamily || 'Montserrat'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="Montserrat">Montserrat (Default)</option>
                          <option value="Playfair Display">Playfair Display (Elegant)</option>
                          <option value="Roboto">Roboto (Modern)</option>
                          <option value="Open Sans">Open Sans (Clean)</option>
                          <option value="Lato">Lato (Professional)</option>
                        </select>
                      </div>
                      <div className="certificate-form-group">
                        <label htmlFor="signatoryFontSize">Signatory Font Size:</label>
                        <select
                          id="signatoryFontSize"
                          name="signatoryFontSize"
                          value={localData.signatoryFontSize || 'medium'}
                          onChange={handleChange}
                          style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                        >
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="enhanced-preview-col">
              <h3 className="preview-certificate-header" style={{ textAlign: 'left', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 12px 4px', letterSpacing: '0.5px' }}>
                Certificate Preview
              </h3>
              <div className="certificate-preview-section enhanced-preview-section" style={{ marginBottom: 8 }}>
                <CertificatePreview 
                  data={localData} 
                  logoUrl={logoUrl}
                  backgroundImagePreview={backgroundImagePreview}
                  designImagePreview={designImagePreview}
                />
                {downloading && (
                  <div className="enhanced-spinner-overlay">
                    <div className="enhanced-spinner" />
                  </div>
                )}
              </div>
              <div className="certificate-modal-actions enhanced-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  className="download-btn enhanced-download-btn"
                  style={{
                    background: '#b71c1c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 22px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    opacity: downloading ? 0.7 : 1,
                    boxShadow: '0 2px 8px rgba(183,28,28,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: downloading ? 'none' : 'auto',
                  }}
                  onClick={handleDownload}
                  disabled={downloading}
                  type="button"
                >
                  {downloading ? (
                    <>
                      <div className="spinner" style={{ marginRight: 8 }}></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <i className="fa fa-file-pdf-o" style={{ marginRight: 8, fontSize: 16 }} />
                      {isBulkMode ? `Generate PDF (${recipients.length} certificate/s)` : 'Generate PDF'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CertificateModal;
