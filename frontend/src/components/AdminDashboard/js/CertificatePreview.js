import React, { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';

const A4_WIDTH = 1123; // px (A4 landscape)
const A4_HEIGHT = 794; // px (A4 landscape, matches your image more closely)
const MAX_WIDTH = 1000; // px
const GOLD = '#bfa22a';

const CertificatePreview = ({ data, logoUrl }) => {
  const { associate, date, signature, message } = data;
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const logoSrc = logoUrl ? logoUrl : backendBaseUrl + '/Assets/disaster_logo.png';
  const swirlTop = "/Assets/swirl_top_left.png";
  const swirlBottom = "/Assets/swirl_bottom_right.png";
  const medal = "/Assets/star.png";

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function handleResize() {
      if (containerRef.current) {
        const containerWidth = Math.min(containerRef.current.offsetWidth, MAX_WIDTH);
        const newScale = Math.min(1, containerWidth / A4_WIDTH);
        setScale(newScale);
      }
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let formattedDate = 'Date';
  if (date) {
    try {
      formattedDate = format(new Date(date), 'MMMM dd, yyyy');
    } catch {
      formattedDate = date;
    }
  }

  const displayMessage = message ||
    `This certificate is proudly presented to ${associate || '[Associate Name]'} in recognition of their exemplary performance and unwavering dedication to volunteer disaster response activities.`;

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
          padding: '48px 60px 0 60px',
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
        <img src={swirlTop} alt="Swirl" style={{ position: 'absolute', left: 0, top: 0, width: 140, opacity: 0.18 }} />
        <img src={swirlBottom} alt="Swirl" style={{ position: 'absolute', right: 0, bottom: 0, width: 140, opacity: 0.18, transform: 'scaleX(-1)' }} />
        {/* Logo */}
        <img src={logoSrc} alt="Logo" style={{ position: 'absolute', top: 32, right: 60, width: 70, height: 'auto' }} />
        {/* Certificate Title Block */}
        <div style={{ textAlign: 'center', marginBottom: '0.5rem', marginTop: '1.2rem' }}>
          <div style={{ 
            fontFamily: 'Playfair Display, serif', 
            fontSize: '2.7rem', 
            fontWeight: 700, 
            letterSpacing: '4px', 
            color: '#2d3142',
            marginBottom: '0.2rem',
          }}>
            CERTIFICATE
          </div>
          <div style={{ 
            fontSize: '1.35rem', 
            color: GOLD, 
            fontWeight: 700,
            letterSpacing: '2px',
            marginBottom: '0.7rem',
            textTransform: 'uppercase',
          }}>
            OF APPRECIATION
          </div>
          <div style={{ 
            fontSize: '1.13rem', 
            color: '#444', 
            fontWeight: 700,
            letterSpacing: '1px',
            marginBottom: '1.2rem',
            textTransform: 'uppercase',
          }}>
            THE FOLLOWING AWARD IS GIVEN TO
          </div>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 700,
            color: '#2d3142',
            marginBottom: '0.5rem',
          }}>
            {associate || 'Associate Name'}
          </div>
        </div>
        {/* Divider */}
        <div style={{ width: '97%', borderBottom: `2.5px solid ${GOLD}`, margin: '0.5rem 0 1.2rem 0' }} />
        {/* Message */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '1.08rem', 
          color: '#444',
          margin: '0 auto 1.2rem auto',
          maxWidth: '80%',
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          {displayMessage.split('\n').map((line, idx) => (
            <span key={idx}>
              {line}
              {idx !== displayMessage.split('\n').length - 1 && <br />}
            </span>
          ))}
        </div>
        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          marginTop: '2.2rem',
          padding: '0 40px',
          width: '100%',
          boxSizing: 'border-box',
        }}>
          <div style={{ textAlign: 'center', minWidth: 180 }}>
            <div style={{ fontSize: '1.15rem', color: '#2d3142', fontWeight: 500, marginBottom: 2 }}>
              {formattedDate}
            </div>
            <div style={{ borderBottom: `2.5px solid ${GOLD}`, width: 120, margin: '0 auto 6px auto' }} />
            <div style={{ 
              color: GOLD, 
              fontWeight: 700, 
              marginTop: '0.5rem',
              fontSize: '1.08rem',
              letterSpacing: '1px',
              textTransform: 'capitalize',
            }}>
              Date
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: 100 }}>
            <img src={medal} alt="Medal" style={{ width: '54px', height: '54px' }} />
          </div>
          <div style={{ textAlign: 'center', minWidth: 180 }}>
            <div style={{ fontSize: '1.15rem', color: '#2d3142', fontWeight: 500, marginBottom: 2 }}>
              {signature || 'Signature'}
            </div>
            <div style={{ borderBottom: `2.5px solid ${GOLD}`, width: 120, margin: '0 auto 6px auto' }} />
            <div style={{ 
              color: GOLD, 
              fontWeight: 700, 
              marginTop: '0.5rem',
              fontSize: '1.08rem',
              letterSpacing: '1px',
              textTransform: 'capitalize',
            }}>
              Signature
            </div>
          </div>
        </div>
        {/* Bottom-right swirl for extra accent */}
        <img src={swirlBottom} alt="Swirl" style={{ position: 'absolute', right: 18, bottom: 18, width: 120, opacity: 0.18, transform: 'scaleX(-1)' }} />
      </div>
    </div>
  );
};

export default CertificatePreview; 