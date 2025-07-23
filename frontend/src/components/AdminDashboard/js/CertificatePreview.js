import React, { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';

const A4_WIDTH = 1123;
const A4_HEIGHT = 794;
const MAX_WIDTH = 1000;

const CertificatePreview = ({ data }) => {
  const { name, associate, signatories, message } = data;
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
  const logoSrc = backendBaseUrl + '/Assets/disaster_logo.png';
  const backgroundSrc = backendBaseUrl + '/Assets/background.jpg';

  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        setScale(Math.min(1, containerWidth / A4_WIDTH));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const recipientName = name || associate || 'Certificate Recipient';
  const displayMessage = message || `This certificate is proudly presented to ${recipientName} in recognition of their exemplary performance and unwavering dedication to volunteer disaster response activities.`;
  const signatoriesList = signatories || [{ name: 'MICHAEL G. CAPARAS', title: 'Founder' }];
  const sigClass = `signatures-${signatoriesList.length}`;

  // Helper for custom signatory layout (4 or 5 signatories)
  const renderSignatories = () => {
    if (signatoriesList.length === 4) {
      return (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
            {signatoriesList.slice(0, 3).map((sig, idx) => (
              <div key={idx} className="signature-item" style={{ textAlign: 'center', fontSize: '1.1rem', color: '#222', fontWeight: 500, flex: '1 1 180px', maxWidth: 200 }}>
                <span className="name" style={{ fontWeight: 'bold' }}>{sig.name}</span>
                <hr style={{ marginBottom: '0.3rem', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #000', border: 'none' }} />
                <div className="cert-title-small" style={{ textAlign: 'center', fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>{sig.title}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%', marginTop: '1.5rem' }}>
            <div className="signature-item" style={{ textAlign: 'center', fontSize: '1.1rem', color: '#222', fontWeight: 500, flex: '1 1 180px', maxWidth: 200 }}>
              <span className="name" style={{ fontWeight: 'bold' }}>{signatoriesList[3].name}</span>
              <hr style={{ marginBottom: '0.3rem', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #000', border: 'none' }} />
              <div className="cert-title-small" style={{ textAlign: 'center', fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>{signatoriesList[3].title}</div>
            </div>
          </div>
        </div>
      );
    }
    if (signatoriesList.length === 5) {
      return (
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', width: '100%' }}>
            {signatoriesList.slice(0, 3).map((sig, idx) => (
              <div key={idx} className="signature-item" style={{ textAlign: 'center', fontSize: '1.1rem', color: '#222', fontWeight: 500, flex: '1 1 180px', maxWidth: 200 }}>
                <span className="name" style={{ fontWeight: 'bold' }}>{sig.name}</span>
                <hr style={{ marginBottom: '0.3rem', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #000', border: 'none' }} />
                <div className="cert-title-small" style={{ textAlign: 'center', fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>{sig.title}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1.5rem' }}>
            <div className="signature-item" style={{ textAlign: 'center', fontSize: '1.1rem', color: '#222', fontWeight: 500, flex: '1 1 180px', maxWidth: 200 }}>
              <span className="name" style={{ fontWeight: 'bold' }}>{signatoriesList[3].name}</span>
              <hr style={{ marginBottom: '0.3rem', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #000', border: 'none' }} />
              <div className="cert-title-small" style={{ textAlign: 'center', fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>{signatoriesList[3].title}</div>
            </div>
            <div className="signature-item" style={{ textAlign: 'center', fontSize: '1.1rem', color: '#222', fontWeight: 500, flex: '1 1 180px', maxWidth: 200 }}>
              <span className="name" style={{ fontWeight: 'bold' }}>{signatoriesList[4].name}</span>
              <hr style={{ marginBottom: '0.3rem', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #000', border: 'none' }} />
              <div className="cert-title-small" style={{ textAlign: 'center', fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>{signatoriesList[4].title}</div>
            </div>
          </div>
        </div>
      );
    }
    // Default: 1-3 signatories, or fallback
    return (
      <div className={`signatures-container ${sigClass}`}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent:
            signatoriesList.length === 1 ? 'center' :
              signatoriesList.length <= 3 ? 'space-between' :
                'space-evenly',
          alignItems: 'flex-end',
          width: '100%',
          gap: '2rem',
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid #ccc',
        }}
      >
        {signatoriesList.map((sig, idx) => (
          <div key={idx} className="signature-item" style={{ textAlign: 'center', fontSize: '1.1rem', color: '#222', fontWeight: 500, flex: '1 1 180px', maxWidth: 200 }}>
            <span className="name" style={{ fontWeight: 'bold' }}>{sig.name}</span>
            <hr style={{ marginBottom: '0.3rem', width: '100%', marginLeft: 'auto', marginRight: 'auto', borderTop: '1px solid #000', border: 'none' }} />
            <div className="cert-title-small" style={{ textAlign: 'center', fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>{sig.title}</div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        background: 'none',
        boxSizing: 'border-box',
      }}
    >
      <div
        id="certificate-preview"
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          position: 'relative',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.2s ease-in-out',
          fontFamily: `'Montserrat', 'Playfair Display', serif`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
          background: 'none',
        }}
      >
        {/* Background Image */}
        <img
          src={backgroundSrc}
          alt="Background"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.78,
            zIndex: 0,
            pointerEvents: 'none',
          }}
        />
        {/* Corner SVG Decorations */}
        <svg
          width={A4_WIDTH}
          height={A4_HEIGHT}
          viewBox="0 0 1123 794"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none',
            display: 'block',
          }}
        >
          <g transform="rotate(180,150,150)">
            <polygon points="0,300 300,0 300,300" fill="#014A9B" />
            <polygon points="75,300 300,75 300,135 135,300" fill="#4AC2E0" />
            <polygon points="0,300 120,300 300,120 300,75" fill="#F7B737" />
          </g>
          <g transform="translate(823,0) rotate(270,150,150)">
            <polygon points="0,300 300,0 300,300" fill="#014A9B" />
            <polygon points="75,300 300,75 300,135 135,300" fill="#4AC2E0" />
            <polygon points="0,300 120,300 300,120 300,75" fill="#F7B737" />
          </g>
          <g transform="translate(0,494) rotate(90,150,150)">
            <polygon points="0,300 300,0 300,300" fill="#014A9B" />
            <polygon points="75,300 300,75 300,135 135,300" fill="#4AC2E0" />
            <polygon points="0,300 120,300 300,120 300,75" fill="#F7B737" />
          </g>
          <g transform="translate(823,494)">
            <polygon points="0,300 300,0 300,300" fill="#014A9B" />
            <polygon points="75,300 300,75 300,135 135,300" fill="#4AC2E0" />
            <polygon points="0,300 120,300 300,120 300,75" fill="#F7B737" />
          </g>
        </svg>
        {/* Certificate Main Content */}
        <div
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            right: 18,
            bottom: 18,
            margin: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.78)',
            borderRadius: 25,
            boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
            zIndex: 2,
            padding: 0,
            border: 'none',
            width: 'calc(100% - 36px)',
            height: 'calc(100% - 36px)',
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '6px solid #2563b6',
            borderRadius: 20,
            padding: '36px 40px',
            margin: 0,
            maxWidth: 900,
            width: '80%',
            minHeight: 540,
            position: 'relative',
            zIndex: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src={logoSrc} alt="Main Logo" style={{ width: 120, height: 'auto', margin: '0 auto 8px auto', display: 'block' }} />
            <div style={{
              width: '100%',
              textAlign: 'center',
              zIndex: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.05)',
              padding: 0,
            }}>
              <div style={{
                textAlign: 'center',
                fontFamily: 'Playfair Display, serif',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                letterSpacing: 4,
                color: '#2d3142',
                marginBottom: '0.2rem',
                paddingTop: 0,
                marginTop: '0.3rem',
              }}>
                CERTIFICATE OF APPRECIATION
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '1.1rem',
                color: '#444',
                fontWeight: 400,
                marginBottom: '1.2rem',
                marginTop: '0.2rem',
              }}>
                This certificate is proudly presented to
              </div>
              <div style={{
                textAlign: 'center',
                fontSize: '1.7rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#222',
                fontFamily: 'Playfair Display, serif',
                marginTop: '2.2rem',
              }}>
                {recipientName}
              </div>
              <hr style={{
                border: 'none',
                borderTop: '1px solid #000',
                margin: '0.5rem auto 1.2rem auto',
                width: '60%',
              }} />
              <div style={{
                textAlign: 'center',
                fontSize: '1.08rem',
                color: '#444',
                margin: '0 auto 2.2rem auto',
                maxWidth: '80%',
                lineHeight: 1.5,
                marginTop: '1.2rem',
              }}>
                {displayMessage.split('\n').map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx !== displayMessage.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              {/* Signatories custom layout */}
              {renderSignatories()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
