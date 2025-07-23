import React, { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';

const A4_WIDTH = 1123; // px (A4 landscape)
const A4_HEIGHT = 794; // px (A4 landscape, matches your image more closely)
const MAX_WIDTH = 1000; // px
const GOLD = '#bfa22a';

const CertificatePreview = ({ data, logoUrl }) => {
  const { name, associate, date, signatories, message } = data;
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  // Always use disaster_logo.png as the main logo
  const logoSrc = backendBaseUrl + '/Assets/disaster_logo.png';

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

  // Use name if available, otherwise fall back to associate, then default
  const recipientName = name || associate || 'Certificate Recipient';

  const displayMessage = message ||
    `This certificate is proudly presented to ${recipientName} in recognition of their exemplary performance and unwavering dedication to volunteer disaster response activities.`;

  // Get signatories with fallback
  const signatoriesList = signatories || [{ name: 'MICHAEL G. CAPARAS', title: 'Founder' }];
  const signatoryCount = signatoriesList.length;

  // Generate signature layout based on count
  const getSignatureLayout = () => {
    const baseStyle = {
      textAlign: 'center',
      fontSize: '1.1rem',
      color: '#222',
      fontWeight: 500,
      flex: 1,
      maxWidth: '200px',
    };

    const lineStyle = {
      width: '100%',
      borderBottom: '1px solid #000',
      margin: '0 auto 0.3rem auto',
    };

    const titleStyle = {
      textAlign: 'center',
      fontSize: '1rem',
      color: '#222',
      fontWeight: 400,
      marginTop: '0.5rem',
    };

    return signatoriesList.map((signatory, index) => {
      let itemStyle = { ...baseStyle };
      
      // Special positioning for 4th and 5th signatories
      if (signatoryCount === 4 && index === 3) {
        // 4th signatory: below leftmost
        itemStyle = {
          ...baseStyle,
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '2rem',
          width: '200px',
        };
      } else if (signatoryCount === 5 && index === 3) {
        // 4th signatory: below leftmost
        itemStyle = {
          ...baseStyle,
          position: 'absolute',
          top: '100%',
          left: 0,
          marginTop: '2rem',
          width: '200px',
        };
      } else if (signatoryCount === 5 && index === 4) {
        // 5th signatory: below rightmost
        itemStyle = {
          ...baseStyle,
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '2rem',
          width: '200px',
        };
      }

      return (
        <div key={index} style={itemStyle}>
          <div style={lineStyle} />
          {signatory.name || 'MICHAEL G. CAPARAS'}
          <div style={titleStyle}>{signatory.title || 'Founder'}</div>
        </div>
      );
    });
  };

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
          padding: '48px 32px 0 32px',
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
        {/* Border with gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: '8px solid #4a90e2',
          borderRadius: 18,
          background: 'linear-gradient(135deg, #4a90e2 0%, #f39c12 50%, #e74c3c 100%)',
          zIndex: -2,
        }}></div>
        
        {/* Background watermark images */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          opacity: 0.1,
        }}>
          <div style={{
            position: 'absolute',
            width: 150,
            height: 100,
            opacity: 0.3,
            top: 50,
            left: 50,
            transform: 'rotate(-15deg)',
          }}></div>
          <div style={{
            position: 'absolute',
            width: 150,
            height: 100,
            opacity: 0.3,
            top: 100,
            right: 80,
            transform: 'rotate(10deg)',
          }}></div>
          <div style={{
            position: 'absolute',
            width: 150,
            height: 100,
            opacity: 0.3,
            bottom: 120,
            left: 60,
            transform: 'rotate(-5deg)',
          }}></div>
          <div style={{
            position: 'absolute',
            width: 150,
            height: 100,
            opacity: 0.3,
            bottom: 80,
            right: 100,
            transform: 'rotate(20deg)',
          }}></div>
        </div>
        
        {/* Main logo at top center */}
        <img 
          src={logoSrc} 
          alt="Main Logo" 
          style={{
            position: 'absolute',
            top: 40,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 120,
            height: 'auto',
            zIndex: 10,
          }}
        />
        
        {/* Main content */}
        <div style={{
          width: '100%',
          maxWidth: 800,
          textAlign: 'center',
          marginTop: 180,
          zIndex: 5,
        }}>
          <div style={{ 
            fontFamily: 'Playfair Display, serif', 
            fontSize: '2.7rem', 
            fontWeight: 700, 
            letterSpacing: '4px', 
            color: '#2d3142',
            marginBottom: '0.2rem',
          }}>
            CERTIFICATE OF APPRECIATION
          </div>
          <div style={{ 
            fontSize: '1.1rem', 
            color: '#444', 
            fontWeight: 400,
            marginBottom: '1.2rem',
          }}>
            This certificate is proudly presented to
          </div>
          <div style={{ 
            fontSize: '2rem', 
            fontWeight: 700,
            color: '#2d3142',
            marginBottom: '0.5rem',
            fontFamily: 'Playfair Display, serif',
          }}>
            {recipientName}
          </div>
        </div>
        
        {/* Divider */}
        <div style={{ width: '60%', borderBottom: '1px solid #000', margin: '0.5rem auto 1.2rem auto' }} />
        
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
        
        {/* Divider */}
        <div style={{ width: '60%', borderBottom: '1px solid #000', margin: '0.5rem auto 1.2rem auto' }} />
        
        {/* Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: signatoryCount === 1 ? 'center' : 'space-between',
          alignItems: 'flex-end',
          marginTop: '4rem',
          padding: '0 20px',
          width: '100%',
          boxSizing: 'border-box',
          gap: '2rem',
          position: signatoryCount >= 4 ? 'relative' : 'static',
        }}>
          {getSignatureLayout()}
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview; 