import React, { useRef, useEffect, useState } from 'react';
import { API_BASE } from '../../../utils/url';

const A4_WIDTH = 1123;
const A4_HEIGHT = 794;

const CertificatePreview = ({ data, logoUrl, backgroundImagePreview, designImagePreview }) => {
  const { 
    name, 
    associate, 
    signatories = [], 
    message,
    backgroundColor = '#014A9B',
    accentColor = '#F7B737',
    lightAccentColor = '#4AC2E0',
    borderColor = '#2563b6',
    showTransparentBox = true,
    titleFontFamily = 'Playfair Display',
    titleFontSize = 'medium',
    nameFontFamily = 'Playfair Display',
    nameFontSize = 'medium',
    messageFontFamily = 'Montserrat',
    messageFontSize = 'medium',
    signatoryFontFamily = 'Montserrat',
    signatoryFontSize = 'medium',
  } = data || {};
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || API_BASE;
  const logoSrc = logoUrl || (backendBaseUrl + '/Assets/disaster_logo.png');
  // Use custom background preview if available, otherwise use default
  const backgroundSrc = backgroundImagePreview || (backendBaseUrl + '/Assets/background.jpg');
  
  // Debug: Log font values to console
  console.log('CertificatePreview - Font values:', {
    titleFontFamily,
    titleFontSize,
    nameFontFamily,
    nameFontSize,
    messageFontFamily,
    messageFontSize,
    signatoryFontFamily,
    signatoryFontSize,
  });
  
  // Font size mappings
  const getFontSize = (size, baseSize) => {
    const sizes = {
      small: { title: 2.0, name: 1.8, message: 0.95, signatory: 1.0 },
      medium: { title: 2.5, name: 2.2, message: 1.08, signatory: 1.1 },
      large: { title: 2.8, name: 2.4, message: 1.15, signatory: 1.2 },
    };
    return sizes[size]?.[baseSize] || sizes.medium[baseSize];
  };

  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [imageError, setImageError] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [containerHeight, setContainerHeight] = useState('100dvh');
  const [containerWidth, setContainerWidth] = useState('100%');
  const [containerPadding, setContainerPadding] = useState('1rem');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Set responsive container dimensions
      if (width <= 479) {
        setContainerHeight('120px'); // Very small height for mobile small
        setContainerWidth('95%'); // Slightly smaller width
        setContainerPadding('0.3rem');
      } else if (width <= 599) {
        setContainerHeight('140px'); // Small height for mobile large
        setContainerWidth('96%'); // Slightly smaller width
        setContainerPadding('0.4rem');
      } else if (width <= 767) {
        setContainerHeight('220px'); // Medium height for tablet portrait
        setContainerWidth('98%'); // Almost full width
        setContainerPadding('0.5rem');
      } else if (width <= 1023) {
        setContainerHeight('320px'); // Larger height for tablet landscape
        setContainerWidth('100%'); // Full width
        setContainerPadding('0.7rem');
      } else {
        setContainerHeight('100dvh'); // Full height for desktop
        setContainerWidth('100%'); // Full width
        setContainerPadding('1rem');
      }
      
      // Calculate scale based on container width (use a small delay to ensure DOM is updated)
      setTimeout(() => {
        if (containerRef.current) {
          const containerWidthValue = containerRef.current.offsetWidth;
          const calculatedScale = containerWidthValue / A4_WIDTH;
          setScale(Math.min(1, calculatedScale));
        }
      }, 10);
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
        fontSize: `${getFontSize(signatoryFontSize, 'signatory')}rem`,
        fontFamily: `'${signatoryFontFamily}', sans-serif`,
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
      <div style={{ 
        fontSize: `${getFontSize(signatoryFontSize, 'signatory') * 0.9}rem`, 
        fontFamily: `'${signatoryFontFamily}', sans-serif`,
        color: '#222', 
        fontWeight: 400, 
        marginTop: '0.5rem' 
      }}>
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
        width: containerWidth,
        height: containerHeight,
        overflow: 'auto',
        backgroundColor: '#f0f0f0',
        padding: containerPadding,
        boxSizing: 'border-box',
        touchAction: 'manipulation',
        margin: '0 auto', // Center the container when width is less than 100%
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
          backgroundColor: backgroundColor,
          fontFamily: `'Montserrat', 'Playfair Display', 'Roboto', 'Open Sans', 'Lato', serif, sans-serif`,
          overflow: 'hidden',
        }}
      >
        {/* Background image - use custom if available, otherwise default */}
        {!imageError && backgroundSrc && (
          <img
            src={backgroundSrc}
            alt="Background"
            onError={() => {
              console.error('Background image failed to load:', backgroundSrc);
              setImageError(true);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: backgroundImagePreview ? 1 : 0.78,
              zIndex: 0,
            }}
          />
        )}

        {/* Design overlay image */}
        {designImagePreview && (
          <img
            src={designImagePreview}
            alt="Design Overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 1,
              pointerEvents: 'none',
            }}
          />
        )}
        
        {/* Geometric pattern SVG (only if no design image) */}
        {!designImagePreview && (
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
              <polygon points="0,300 300,0 300,300" fill={backgroundColor} />
              <polygon points="75,300 300,75 300,135 135,300" fill={lightAccentColor} />
              <polygon points="0,300 120,300 300,120 300,75" fill={accentColor} />
            </g>
            <g transform="translate(823,0) rotate(270,150,150)">
              <polygon points="0,300 300,0 300,300" fill={backgroundColor} />
              <polygon points="75,300 300,75 300,135 135,300" fill={lightAccentColor} />
              <polygon points="0,300 120,300 300,120 300,75" fill={accentColor} />
            </g>
            <g transform="translate(0,494) rotate(90,150,150)">
              <polygon points="0,300 300,0 300,300" fill={backgroundColor} />
              <polygon points="75,300 300,75 300,135 135,300" fill={lightAccentColor} />
              <polygon points="0,300 120,300 300,120 300,75" fill={accentColor} />
            </g>
            <g transform="translate(823,494)">
              <polygon points="0,300 300,0 300,300" fill={backgroundColor} />
              <polygon points="75,300 300,75 300,135 135,300" fill={lightAccentColor} />
              <polygon points="0,300 120,300 300,120 300,75" fill={accentColor} />
            </g>
          </svg>
        )}

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
            background: showTransparentBox ? 'rgba(255,255,255,0.78)' : 'transparent',
            borderRadius: 25,
            zIndex: 2,
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: `6px solid ${borderColor}`,
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
                fontSize: `${getFontSize(titleFontSize, 'title')}rem`,
                fontFamily: `'${titleFontFamily}', serif`,
                fontWeight: 'bold',
                letterSpacing: 4,
                color: '#2d3142',
                marginBottom: '0.5rem',
              }}>
                CERTIFICATE OF APPRECIATION
              </div>
            </div>

            <div style={{ 
              fontSize: '1.1rem', 
              color: '#444', 
              fontWeight: 400, 
              marginBottom: '0.8rem',
              fontFamily: `'${messageFontFamily}', sans-serif`,
            }}>
              This certificate is proudly presented to
            </div>

            <div style={{ 
              fontSize: `${getFontSize(nameFontSize, 'name')}rem`, 
              fontFamily: `'${nameFontFamily}', serif`,
              fontWeight: 'bold', 
              color: '#222', 
              margin: '0.5rem 0 0.3rem' 
            }}>
              {recipientName}
            </div>

            <hr style={{ width: '60%', border: 'none', borderTop: '1px solid #000', margin: '0.3rem auto 0.8rem auto' }} />

            <div style={{ 
              fontSize: `${getFontSize(messageFontSize, 'message')}rem`, 
              fontFamily: `'${messageFontFamily}', sans-serif`,
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
