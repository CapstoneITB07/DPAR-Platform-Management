import React, { useState, useEffect } from 'react';
import CertificatePreview from './CertificatePreview';
import Modal from 'react-modal';
import axios from 'axios';
import '../css/CertificateModal.css';

const CertificateModal = ({ show, onClose, associates, certificateData, onCertificateDataChange }) => {
  const [localData, setLocalData] = useState(certificateData);
  const [downloading, setDownloading] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [recipients, setRecipients] = useState([{ name: '', controlNumber: '' }]);
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    setLocalData(certificateData);
  }, [certificateData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...localData, [name]: value };
    setLocalData(updated);
    onCertificateDataChange(updated);
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
    updatedRecipients[index] = { ...updatedRecipients[index], [field]: value };
    setRecipients(updatedRecipients);
  };

  const parseBulkInput = () => {
    const lines = bulkInput.split('\n').filter(line => line.trim());
    const parsedRecipients = lines.map(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        return { name: parts[0].trim(), controlNumber: parts[1].trim() };
      } else {
        const commaParts = line.split(',');
        if (commaParts.length >= 2) {
          return { name: commaParts[0].trim(), controlNumber: commaParts[1].trim() };
        }
      }
      return { name: line.trim(), controlNumber: '' };
    }).filter(recipient => recipient.name);
    
    setRecipients(parsedRecipients.length > 0 ? parsedRecipients : [{ name: '', controlNumber: '' }]);
  };

  const isFormValid = () => {
    if (!localData.message) return false;
    const signatories = localData.signatories || [];
    for (const signatory of signatories) {
      if (!signatory.name || !signatory.title) return false;
    }
    
    if (isBulkMode) {
      for (const recipient of recipients) {
        if (!recipient.name || !recipient.controlNumber) return false;
      }
    } else {
      if (!localData.name) return false;
    }
    return true;
  };

  const handleDownload = async () => {
    if (!isFormValid()) {
      const message = isBulkMode 
        ? 'Please fill out all required fields: message, each signatory\'s name and title, and all recipient names and control numbers.'
        : 'Please fill out all required fields: recipient name, message, and each signatory\'s name and title.';
      alert(message);
      return;
    }

    setDownloading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      const assetBaseUrl = 'http://127.0.0.1:8000/Assets';

      const selectedAssociateObj = associates.find(a => a.name === localData.associate);
      const logoUrl = selectedAssociateObj
        ? `${assetBaseUrl}/${selectedAssociateObj.logo.replace('/Assets/', '')}`
        : `${assetBaseUrl}/disaster_logo.png`;

      const swirlTopUrl = `${assetBaseUrl}/swirl_top_left.png`;
      const swirlBottomUrl = `${assetBaseUrl}/swirl_bottom_right.png`;
      const medalUrl = `${assetBaseUrl}/star.png`;

      if (isBulkMode) {
        // Bulk generation
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
      } else {
        // Single generation
        const response = await axios.post(
          `${backendBaseUrl}/api/certificates`,
          {
            name: localData.name,
            date: localData.date,
            signatories: localData.signatories || [{ name: '', title: '' }],
            message: localData.message,
            logoUrl: logoUrl,
            swirlTopUrl: swirlTopUrl,
            swirlBottomUrl: swirlBottomUrl,
            medalUrl: medalUrl,
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

  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
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
                ) : (
                  <div className="bulk-section">
                    <div className="bulk-input-section">
                      <h3>Bulk Input</h3>
                      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '10px' }}>
                        Paste names and control numbers from Excel (tab-separated or comma-separated):
                      </p>
                      <textarea
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        placeholder="John Doe&#9;CN001&#10;Jane Smith&#9;CN002&#10;Mike Johnson&#9;CN003"
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
                        Parse Input
                      </button>
                    </div>

                    <div className="recipients-table-section">
                      <h3>Recipients ({recipients.length})</h3>
                      <div className="recipients-table-container">
                        <div className="recipients-table">
                          <div className="recipients-header">
                            <div className="recipient-name-header">Name</div>
                            <div className="recipient-cn-header">Control Number</div>
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
                                <input
                                  type="text"
                                  placeholder="Enter control number"
                                  value={recipient.controlNumber}
                                  onChange={(e) => updateRecipient(index, 'controlNumber', e.target.value)}
                                  className="recipient-cn-input"
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
                  />
                </div>
              </form>
            </div>

            <div className="enhanced-preview-col">
              <h3 className="preview-certificate-header" style={{ textAlign: 'left', fontWeight: 700, fontSize: '1.15rem', margin: '0 0 12px 4px', letterSpacing: '0.5px' }}>
                Certificate Preview
              </h3>
              <div className="certificate-preview-section enhanced-preview-section" style={{ marginBottom: 8 }}>
                <CertificatePreview data={localData} logoUrl={logoUrl} />
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
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(183,28,28,0.10)',
                    display: 'flex',
                    alignItems: 'center',
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
                      {isBulkMode ? `Generate Bulk PDF (${recipients.length} certificates)` : 'Download PDF'}
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
