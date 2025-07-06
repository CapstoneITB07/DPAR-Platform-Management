import React, { useRef, useEffect, useState } from 'react';

const A4_WIDTH = 1123; // px (11.69in at 96dpi, landscape)
const A4_HEIGHT = 794; // px (8.27in at 96dpi, landscape)
const MAX_WIDTH = 1000; // px

const CertificatePreview = ({ data, logoUrl }) => {
  const { associate, date, signature, message } = data;
  // Use environment variable or fallback to localhost for development
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const logoSrc = logoUrl ? logoUrl : backendBaseUrl + '/Assets/disaster_logo.png';
  // Use PNG assets from the frontend's public/Assets folder for preview
  const swirlTop = "/Assets/swirl_top_left.png";
  const swirlBottom = "/Assets/swirl_bottom_right.png";
  const medal = "/Assets/star.png";

  // Responsive scaling logic for width only (full view mode)
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        // Use 100% of the modal width, up to MAX_WIDTH
        const containerWidth = Math.min(containerRef.current.offsetWidth, MAX_WIDTH);
        const newScale = Math.min(1, containerWidth / A4_WIDTH);
        setScale(newScale);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'none',
        overflow: 'visible',
        padding: 0,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        id="certificate-preview"
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          background: '#fff',
          borderRadius: 18,
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          padding: '48px 48px 32px 48px',
          margin: '0 auto',
          fontFamily: 'Montserrat, Playfair Display, serif',
          position: 'relative',
          border: 'none',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s',
        }}
      >
        {/* Swirls */}
        <img src={swirlTop} className="swirl" alt="Swirl" style={{ position: 'absolute', left: 0, top: 0, width: 120, opacity: 0.18 }} />
        <img src={swirlBottom} className="swirl-bottom" alt="Swirl" style={{ position: 'absolute', right: 0, bottom: 0, width: 120, opacity: 0.18, transform: 'scaleX(-1)' }} />
      {/* Logo */}
        <img src={logoSrc} className="logo" alt="Logo" style={{ position: 'absolute', top: 32, right: 36, width: 80, height: 'auto' }} />
        {/* Certificate Title Block */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            fontFamily: 'Playfair Display, serif', 
            fontSize: '2.2rem', 
            fontWeight: 'bold', 
            letterSpacing: '2px', 
            marginBottom: '0.5rem',
            color: '#3a3a3a'
          }}>
            CERTIFICATE
          </div>
          <div style={{ 
            fontSize: '1.3rem', 
            color: '#bfa22a', 
            fontWeight: 'bold',
            letterSpacing: '1px'
          }}>
            OF APPRECIATION
          </div>
        </div>

        {/* Associate Section */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ 
            fontSize: '1.1rem', 
            color: '#3a3a3a', 
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}>
            THE FOLLOWING AWARD IS GIVEN TO
          </div>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold',
            color: '#3a3a3a'
          }}>
            {associate || 'Associate Name'}
          </div>
        </div>

        {/* Divider */}
        <hr style={{ 
          border: 'none', 
          borderTop: '3px solid #bfa22a', 
          margin: '1.5rem 0',
          width: '80%'
        }} />

        {/* Message */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '1rem', 
          color: '#444',
          margin: '0 auto 1.5rem auto',
          maxWidth: '80%'
        }}>
          {message || 'Your appreciation message will appear here.'}
        </div>

        {/* Divider */}
        <hr style={{ 
          border: 'none', 
          borderTop: '3px solid #bfa22a', 
          margin: '1.5rem 0',
          width: '80%'
        }} />

        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          marginTop: '2rem',
          padding: '0 40px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', color: '#3a3a3a' }}>
              {date || 'Date'}
            </div>
            <div style={{ 
              color: '#bfa22a', 
              fontWeight: 'bold', 
              marginTop: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Date
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <img src={medal} alt="Medal" style={{ width: '40px', height: '40px' }} />
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1rem', color: '#3a3a3a' }}>
              {signature || 'Signature'}
            </div>
            <div style={{ 
              color: '#bfa22a', 
              fontWeight: 'bold', 
              marginTop: '0.5rem',
              fontSize: '0.9rem'
            }}>
              Signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview; 