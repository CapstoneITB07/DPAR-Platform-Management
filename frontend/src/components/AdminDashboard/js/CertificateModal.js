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
          associate: localData.associate,
          date: localData.date,
          signature: localData.signature,
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
          <h2 style={{margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center'}}>
            <span role="img" aria-label="award" style={{marginRight: 10, fontSize: 28}}>🏆</span>
            Generate Certificate
          </h2>
          <button className="certificate-modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="certificate-modal-content enhanced-modal-content">
          <div className="enhanced-modal-flex">
            {/* Form Section */}
            <div className="enhanced-form-card">
              <h3 className="enhanced-form-title">Certificate Details</h3>
              <form className="certificate-form">
                <div className="certificate-form-group">
                  <label htmlFor="associate">Select Associate:</label>
                  <select id="associate" name="associate" value={localData.associate} onChange={handleChange}>
                    <option value="">Select...</option>
                    {associates.map(a => (
                      <option key={a.id} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="certificate-form-group">
                  <label htmlFor="date">Date:</label>
                  <input type="date" id="date" name="date" value={localData.date} onChange={handleChange} />
                </div>
                <div className="certificate-form-group">
                  <label htmlFor="signature">Signature:</label>
                  <input type="text" id="signature" name="signature" placeholder="e.g. Dr. Jane Smith" value={localData.signature} onChange={handleChange} />
                  <small>Type your name as it should appear on the certificate.</small>
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
              <div className="certificate-preview-section enhanced-preview-section">
                <CertificatePreview data={localData} logoUrl={logoUrl} />
                {downloading && (
                  <div className="enhanced-spinner-overlay">
                    <div className="enhanced-spinner" />
                  </div>
                )}
              </div>
              {/* Main Action Button */}
              <div className="certificate-modal-actions enhanced-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
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