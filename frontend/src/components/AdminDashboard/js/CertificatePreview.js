import React, { useRef, useEffect, useState } from 'react';
import { API_BASE } from '../../../utils/url';

const A4_WIDTH = 1123;
const A4_HEIGHT = 794;

const CertificatePreview = ({ data }) => {
  const { name, associate, signatories = [], message } = data || {};
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || API_BASE;
  const logoSrc = backendBaseUrl + '/Assets/disaster_logo.png';
  const backgroundSrc = backendBaseUrl + '/Assets/background.jpg';

  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const calculatedScale = containerWidth / A4_WIDTH;
        setScale(Math.min(1, calculatedScale));
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleToggleFullscreen = () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error("Fullscreen request failed:", err.message);
        });
      } else {
        document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle error:", err.message);
    }
  };

  const recipientName = name || associate || 'Certificate Recipient';
  const displayMessage =
    message ||
    `This certificate is proudly presented in recognition of exemplary performance and unwavering dedication to volunteer disaster response activities.`;

  const validSignatories = Array.isArray(signatories) && signatories.length > 0
    ? signatories
    : [{ name: 'MICHAEL G. CAPARAS', title: 'Founder' }];

  const SignatureBlock = ({ sig }) => (
    <div
      className="signature-item"
      style={{
        textAlign: 'center',
        fontSize: '1.1rem',
        color: '#222',
        fontWeight: 500,
        flex: '1 1 180px',
        maxWidth: 200,
      }}
    >
      <div style={{ fontWeight: 'bold' }}>{sig.name}</div>
      <hr
        style={{
          border: 'none',
          borderTop: '1.5px solid #000',
          margin: '0.5rem auto 0.3rem auto',
          width: '80%',
        }}
      />
      <div style={{ fontSize: '1rem', color: '#222', fontWeight: 400, marginTop: '0.5rem' }}>
        {sig.title}
      </div>
    </div>
  );

  const renderSignatories = () => {
    if (validSignatories.length === 4) {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {validSignatories.slice(0, 3).map((sig, idx) => (
              <SignatureBlock key={idx} sig={sig} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1rem' }}>
            {validSignatories.slice(3).map((sig, idx) => (
              <SignatureBlock key={idx} sig={sig} />
            ))}
          </div>
        </>
      );
    }

    if (validSignatories.length === 5) {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            {validSignatories.slice(0, 3).map((sig, idx) => (
              <SignatureBlock key={idx} sig={sig} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1rem' }}>
            {validSignatories.slice(3).map((sig, idx) => (
              <SignatureBlock key={idx} sig={sig} />
            ))}
          </div>
        </>
      );
    }

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: validSignatories.length === 1 ? 'center' : 'space-between',
          gap: '2rem',
          marginTop: '1rem',
          width: '100%',
        }}
      >
        {validSignatories.map((sig, idx) => (
          <SignatureBlock key={idx} sig={sig} />
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      onClick={handleToggleFullscreen}
      style={{
        width: '100%',
        height: '100dvh',
        overflow: 'auto',
        backgroundColor: '#f0f0f0',
        padding: '1rem',
        boxSizing: 'border-box',
        touchAction: 'manipulation',
      }}
    >
      <div
        ref={previewRef}
        style={{
          width: `${A4_WIDTH}px`,
          height: `${A4_HEIGHT}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          margin: '0 auto',
          position: 'relative',
          backgroundColor: 'white',
          fontFamily: `'Montserrat', 'Playfair Display', serif`,
          overflow: 'hidden',
        }}
      >
        {!imageError && (
          <img
            src={backgroundSrc}
            alt="Background"
            onError={() => setImageError(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.78,
              zIndex: 0,
            }}
          />
        )}

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
            zIndex: 2,
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '6px solid #2563b6',
            borderRadius: 20,
            padding: '36px 40px',
            maxWidth: 900,
            width: '80%',
            minHeight: 540,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}>
            {!logoError ? (
              <img
                src={logoSrc}
                alt="Main Logo"
                onError={() => setLogoError(true)}
                style={{ width: 120, marginBottom: '12px' }}
              />
            ) : (
              <div style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '12px' }}>Logo unavailable</div>
            )}

            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{
                fontSize: '2.5rem',
                fontWeight: 'bold',
                letterSpacing: 4,
                color: '#2d3142',
                marginBottom: '0.5rem',
              }}>
                CERTIFICATE OF APPRECIATION
              </div>
            </div>

            <div style={{ fontSize: '1.1rem', color: '#444', fontWeight: 400, marginBottom: '0.8rem' }}>
              This certificate is proudly presented to
            </div>

            <div style={{ fontSize: '1.7rem', fontWeight: 'bold', color: '#222', margin: '0.5rem 0 0.3rem' }}>
              {recipientName}
            </div>

            <hr style={{ width: '60%', border: 'none', borderTop: '1px solid #000', margin: '0.3rem auto 0.8rem auto' }} />

            <div style={{ 
              fontSize: '1.08rem', 
              color: '#444', 
              lineHeight: 1.6, 
              textAlign: 'center', 
              maxWidth: '80%', 
              margin: '0.8rem auto 1.5rem auto',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              hyphens: 'auto',
              whiteSpace: 'pre-line',
              textAlignLast: 'center',
              display: 'block'
            }}>
              {displayMessage.split('\n').map((line, idx) => (
                <div key={idx} style={{ 
                  textAlign: 'center', 
                  marginBottom: '0.3rem',
                  width: '100%'
                }}>
                  {line.trim()}
                </div>
              ))}
            </div>

            {renderSignatories()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;
