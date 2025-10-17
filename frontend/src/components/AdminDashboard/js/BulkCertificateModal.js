import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import '../css/BulkCertificateModal.css';

const BulkCertificateModal = ({ show, onClose, associates, certificateData, onCertificateDataChange }) => {
  const [localData, setLocalData] = useState(certificateData);
  const [recipients, setRecipients] = useState([{ name: '', controlNumber: '' }]);
  const [downloading, setDownloading] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [debounceTimer, setDebounceTimer] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

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
    setLocalData(certificateData);
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
    const { name, value } = e.target;
    
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
    
    const updated = { ...localData, [name]: value };
    setLocalData(updated);
    
    // Use debounced update for parent component
    debouncedUpdate(updated);
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
    setRecipients([...recipients, { name: '', controlNumber: '' }]);
  };

  const removeRecipient = (index) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index, field, value) => {
    const updatedRecipients = [...recipients];
    
    // If updating control number, extract only numbers
    if (field === 'controlNumber') {
      value = value.replace(/[^0-9]/g, '');
    }
    
    updatedRecipients[index] = { ...updatedRecipients[index], [field]: value };
    setRecipients(updatedRecipients);
  };

  const parseBulkInput = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const parsedRecipients = lines.map(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        // Extract only numbers from control number
        const controlNumber = parts[1].trim().replace(/[^0-9]/g, '');
        return { name: parts[0].trim(), controlNumber: controlNumber };
      } else {
        const commaParts = line.split(',');
        if (commaParts.length >= 2) {
          // Extract only numbers from control number, ignoring any letters after comma
          const controlNumber = commaParts[1].trim().replace(/[^0-9]/g, '');
          return { name: commaParts[0].trim(), controlNumber: controlNumber };
        }
      }
      return { name: line.trim(), controlNumber: '' };
    }).filter(recipient => recipient.name);
    
    setRecipients(parsedRecipients.length > 0 ? parsedRecipients : [{ name: '', controlNumber: '' }]);
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
    for (const recipient of recipients) {
      if (!recipient.name || !recipient.controlNumber) return false;
    }
    return true;
  };

  const handleBulkDownload = async () => {
    if (!isFormValid()) {
      // Check specific validation errors
      if (!localData.message) {
        alert('Please enter an appreciation message.');
        return;
      }
      
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
      
      for (const recipient of recipients) {
        if (!recipient.name || !recipient.controlNumber) {
          alert('Please fill out all recipient names and control numbers.');
          return;
        }
      }
      
      alert('Please fill out all required fields: message, each signatory\'s name and title, and all recipient names and control numbers.');
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

      const response = await axios.post(
        `${backendBaseUrl}/api/certificates/bulk`,
        {
          recipients: recipients,
          signatories: localData.signatories || [{ name: '', title: '' }],
          message: localData.message,
          logoUrl: logoUrl,
          format: 'pdf',
          timestamp: Date.now(),
        },
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
    } catch (err) {
      console.error('Bulk certificate generation error:', err);
      alert('Failed to generate bulk certificates. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal
      isOpen={show}
      onRequestClose={onClose}
      className="bulk-certificate-modal-root"
      overlayClassName="bulk-certificate-modal-overlay"
      ariaHideApp={false}
    >
      <div className="bulk-certificate-modal-card">
        <div className="bulk-certificate-modal-header-red">
          <h2 style={{margin: 0, fontWeight: 700}}>Generate Bulk Certificates</h2>
          <button className="bulk-certificate-modal-close" onClick={onClose}>&times;</button>
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
        
        <div className="bulk-certificate-modal-content">
          <div className="bulk-modal-flex">
            <div className="bulk-form-section">
              <div className="bulk-input-section">
                <h3>Bulk Input</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                  Paste names and control numbers separated by tabs or commas (one per line).
                  Numbers only needed for CN (e.g., 123 → CN-00123):
                </p>
                <textarea
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                  placeholder="John Doe&#9;123&#10;Jane Smith&#9;456&#10;Mike Johnson&#9;789abc"
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
                <div className="recipients-table">
                  <div className="recipients-header">
                    <div className="recipient-name-header">Name</div>
                    <div className="recipient-cn-header">Control Number</div>
                    <div className="recipient-actions-header">Actions</div>
                  </div>
                  {recipients.map((recipient, index) => (
                    <div key={index} className="recipient-row">
                      <input
                        type="text"
                        placeholder="Enter name"
                        value={recipient.name}
                        onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                        className="recipient-name-input"
                      />
                      <input
                        type="text"
                        placeholder="Numbers only (e.g., 123)"
                        value={recipient.controlNumber}
                        onChange={(e) => updateRecipient(index, 'controlNumber', e.target.value)}
                        className="recipient-cn-input"
                      />
                      <div className="recipient-actions">
                        {recipients.length > 1 && (
                          <button
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
                <button
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

            <div className="bulk-settings-section">
              <div className="signatories-section">
                <h3>Signatories</h3>
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

              <div className="message-section">
                <h3>Appreciation Message</h3>
                <textarea
                  name="message"
                  value={localData.message}
                  onChange={handleChange}
                  placeholder="Enter the appreciation message that will appear on all certificates. You can use line breaks to format the text properly. Maximum 100 words."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '12px',
                    border: localData.message && (isWordCountExceeded(localData.message) || isCharacterCountExceeded(localData.message)) ? '2px solid #d32f2f' : '1px solid #ddd',
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
                      color: localData.message && isCharacterCountExceeded(localData.message) ? '#d32f2f' : '#666',
                      fontWeight: localData.message && isCharacterCountExceeded(localData.message) ? 'bold' : 'normal'
                    }}>
                      {localData.message ? localData.message.length : 0} / 1000 characters
                    </small>
                    <small style={{ 
                      color: localData.message && isWordCountExceeded(localData.message) ? '#d32f2f' : '#666',
                      fontWeight: localData.message && isWordCountExceeded(localData.message) ? 'bold' : 'normal'
                    }}>
                      {localData.message ? getWordCount(localData.message) : 0} / 100 words
                    </small>
                  </div>
                </div>
              </div>

              <div className="bulk-actions">
                <button
                  className="bulk-download-btn"
                  style={{
                    background: '#b71c1c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '12px 24px',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: downloading ? 'not-allowed' : 'pointer',
                    opacity: downloading ? 0.7 : 1,
                    boxShadow: '0 2px 8px rgba(183,28,28,0.10)',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    justifyContent: 'center',
                    pointerEvents: downloading ? 'none' : 'auto',
                  }}
                  onClick={handleBulkDownload}
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
                      Generate PDF ({recipients.length} certificate/s)
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

export default BulkCertificateModal; 