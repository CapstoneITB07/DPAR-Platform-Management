import React from 'react';

const gold = '#bfa43a';
const gray = '#444b5a';
const lightGray = '#f4f4f7';

const GoldWave = ({ position }) => (
  <svg
    width="120"
    height="80"
    viewBox="0 0 180 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{
      position: 'absolute',
      ...(position === 'top-left' ? { top: 0, left: 0 } : { bottom: 0, right: 0 }),
      zIndex: 0,
      opacity: 0.7,
      maxWidth: '30%',
      height: 'auto',
    }}
  >
    <path
      d="M0,40 Q60,0 120,40 T180,40 Q120,80 60,40 T0,40"
      stroke={gold}
      strokeWidth="2"
      fill="none"
    />
    <path
      d="M0,80 Q60,40 120,80 T180,80 Q120,120 60,80 T0,80"
      stroke={gold}
      strokeWidth="1.2"
      fill="none"
      opacity="0.5"
    />
  </svg>
);

const GoldSeal = () => (
  <svg width="56" height="56" viewBox="0 0 70 70" style={{ display: 'block', margin: '0 auto' }}>
    <circle cx="35" cy="35" r="30" fill="#ffe082" stroke={gold} strokeWidth="4" />
    <circle cx="35" cy="35" r="18" fill="#fffde7" stroke={gold} strokeWidth="2" />
    <text x="35" y="43" textAnchor="middle" fontSize="28" fontWeight="bold" fill={gold} fontFamily="serif">★</text>
  </svg>
);

const CertificateTemplate = ({ name = 'NAME SURNAME', date = '', signature = '', orgLogo, message = 'This certificate is given to ________________ for his achievement in the field of education and proves that he is competent in his field.' }) => {
  return (
    <div style={{
      width: '100%',
      maxWidth: 650,
      background: '#fff',
      border: `3px solid ${lightGray}`,
      borderRadius: '10px',
      boxSizing: 'border-box',
      fontFamily: 'Georgia, Times, serif',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto',
      boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      padding: '36px 24px 0 24px',
      height: 'auto',
      minHeight: 480,
    }}>
      {/* Gold wave decorations */}
      <GoldWave position="top-left" />
      <GoldWave position="bottom-right" />
      {/* Logo at top right */}
      {orgLogo && (
        <img src={orgLogo} alt="Organization Logo" style={{ position: 'absolute', top: 24, right: 32, width: 60, height: 60, objectFit: 'contain', zIndex: 2 }} />
      )}
      {/* Certificate content */}
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '40px 10px 0 10px', height: '100%' }}>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6, color: gray, marginBottom: 0, fontFamily: 'Georgia, Times, serif' }}>
          CERTIFICATE
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 2, color: gold, marginBottom: 14, marginTop: 0, fontFamily: 'Georgia, Times, serif' }}>
          OF APPRECIATION
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: gray, letterSpacing: 1, marginBottom: 24, marginTop: 6, fontFamily: 'Montserrat, Arial, sans-serif' }}>
          THE FOLLOWING AWARD IS GIVEN TO
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1, color: gray, marginBottom: 10, fontFamily: 'Georgia, Times, serif' }}>
          {name}
        </div>
        {/* Gold line */}
        <div style={{ width: '100%', height: 2, background: gold, margin: '18px 0 12px 0', borderRadius: 2 }} />
        <div style={{ fontSize: 15, color: gray, marginBottom: 24, fontFamily: 'Georgia, Times, serif', minHeight: 36, maxWidth: 480, marginLeft: 'auto', marginRight: 'auto', whiteSpace: 'pre-line' }}>
          {message}
        </div>
        {/* Date, Seal, Signature */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 38, width: '100%' }}>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, color: gray, marginBottom: 2 }}>{date}</div>
            <div style={{ borderTop: `2px solid ${gold}`, width: 140, margin: '0 auto 10px auto' }}></div>
            <div style={{ fontSize: 18, color: gold, fontWeight: 600, marginTop: 2 }}>Date</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <GoldSeal />
          </div>
          <div style={{ textAlign: 'center', flex: 1 }}>
            <div style={{ fontSize: 18, color: gray, marginBottom: 2 }}>{signature}</div>
            <div style={{ borderTop: `2px solid ${gold}`, width: 140, margin: '0 auto 10px auto' }}></div>
            <div style={{ fontSize: 18, color: gold, fontWeight: 600, marginTop: 2 }}>Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateTemplate; 