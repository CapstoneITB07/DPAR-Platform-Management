import React, { useState, useEffect } from 'react';
import CertificatePreview from './CertificatePreview';
import Modal from 'react-modal';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import axios from 'axios';
import '../css/CertificateModal.css';

const CertificateModal = ({ show, onClose, associates, certificateData, onCertificateDataChange }) => {
  const [localData, setLocalData] = useState(certificateData);
  const [downloading, setDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('print'); // 'print' or 'pdf'

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

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      // Use environment variable or fallback to 127.0.0.1 for development
      const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
      // Always use 127.0.0.1 for asset URLs to ensure Puppeteer compatibility
      const assetBaseUrl = 'http://127.0.0.1:8000/Assets';
      // Find the selected associate object
      const selectedAssociateObj = associates.find(a => a.name === localData.associate);
      const logoUrl = selectedAssociateObj
        ? `${assetBaseUrl}/${selectedAssociateObj.logo.replace('/Assets/', '')}`
        : `${assetBaseUrl}/disaster_logo.png`;
      const swirlTopUrl = `${assetBaseUrl}/swirl_top_left.png`;
      const swirlBottomUrl = `${assetBaseUrl}/swirl_bottom_right.png`;
      const medalUrl = `${assetBaseUrl}/star.png`;
      const response = await axios.post(
        `${backendBaseUrl}/api/certificates`,
        {
          name: localData.name,
          date: localData.date,
          signatories: localData.signatories || [{ name: '', title: '' }],
          message: localData.message,
          logoUrl: logoUrl, // Always full URL
          swirlTopUrl: swirlTopUrl,
          swirlBottomUrl: swirlBottomUrl,
          medalUrl: medalUrl,
          format: 'pdf',
          timestamp: Date.now(), // Add timestamp to prevent caching
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
      a.download = `certificate_${Date.now()}.pdf`; // Add timestamp to filename
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Certificate generation error:', err);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Use environment variable or fallback to 127.0.0.1 for development
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://127.0.0.1:8000";
  // Find the selected associate object
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
          <h2 style={{margin: 0, fontWeight: 700}}>
            Generate Certificate
          </h2>
          <button className="certificate-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="certificate-modal-content enhanced-modal-content">
          <div className="enhanced-modal-flex">
            {/* Form Section */}
            <div className="enhanced-form-card">
              <form className="certificate-form">
                <div className="certificate-form-group">
                  <label htmlFor="name">Recipient Name:</label>
                  <input type="text" id="name" name="name" placeholder="Enter recipient name" value={localData.name || ''} onChange={handleChange} />
                </div>
                <div className="certificate-form-group">
                  <label htmlFor="date">Date:</label>
                  <input type="date" id="date" name="date" value={localData.date} onChange={handleChange} />
                </div>
                
                {/* Signatories Section */}
                <div className="certificate-form-group">
                  <label>Signatories:</label>
                  <small style={{ color: '#666', display: 'block', marginBottom: 8 }}>
                    Maximum 5 signatories
                  </small>
                  {(localData.signatories || [{ name: '', title: '' }]).map((signatory, index, arr) => (
                    <div key={index} style={{ 
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                    }}>
                      <div style={{ flex: 1, display: 'flex', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'none' }}>Name:</label>
                          <input 
                            type="text" 
                            placeholder="Enter signatory name" 
                            value={signatory.name || ''} 
                            onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)}
                            style={{ width: '100%', padding: '5px', marginTop: '2px' }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: 'none' }}>Title:</label>
                          <input 
                            type="text" 
                            placeholder="e.g. Founder, CEO, etc." 
                            value={signatory.title || ''} 
                            onChange={(e) => handleSignatoryChange(index, 'title', e.target.value)}
                            style={{ width: '100%', padding: '5px', marginTop: '2px' }}
                          />
                        </div>
                      </div>
                      {/* Add button only on last row and if less than 5 signatories */}
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
                      {/* Remove button always shown if more than 1 signatory */}
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
                  <textarea id="message" name="message" value={localData.message} onChange={handleChange} />
                </div>
              </form>
            </div>
            {/* Preview Section */}
            <div className="enhanced-preview-col">
              {/* Download Format Section removed */}
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
              {/* Main Action Button */}
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
                  <i className="fa fa-file-pdf-o" style={{ marginRight: 8, fontSize: 16 }} /> Download PDF
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