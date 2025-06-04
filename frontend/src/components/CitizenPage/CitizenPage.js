import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../logo.svg';

function CitizenPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  // Animation and navigation for About Us
  const handleAboutClick = () => {
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
    }, 350);
  };

  // Determine if ABOUT US is active
  const isAboutActive = location.pathname === '/citizen/about';

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <nav style={{ background: '#8B1409', color: '#fff', padding: '0 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, position: 'relative' }}>
        <div style={{ fontWeight: 'bold', fontSize: 24, marginRight: 'auto', marginLeft: 30 }}>
          DPAR VOLUNTEER COALITION
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', margin: 0, padding: 0, alignItems: 'center', height: '100%' }}>
          <li style={{ margin: '0 20px', fontWeight: 'bold', background: '#a52a1a', borderRadius: 8, padding: '8px 18px' }}>HOME</li>
          <li style={{ margin: '0 20px', position: 'relative', cursor: 'pointer' }} onMouseLeave={closeDropdown}>
            <span onClick={handleDropdown} style={{ fontWeight: 'bold', display: 'inline-block', padding: '8px 18px', borderRadius: 8, background: dropdownOpen ? '#a52a1a' : 'transparent' }}>
              PREPAREDNESS <span style={{ fontSize: 12 }}>▼</span>
            </span>
            {dropdownOpen && (
              <ul style={{ position: 'absolute', top: 40, left: 0, background: '#fff', color: '#8B1409', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: 150, zIndex: 10, padding: 0 }}>
                {['TYPHOON', 'PANDEMIC', 'FIRE', 'FLOOD'].map((item) => (
                  <li key={item} style={{ padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold', borderBottom: '1px solid #eee' }} onClick={closeDropdown} onMouseDown={e => e.preventDefault()}>{item}</li>
                ))}
              </ul>
            )}
          </li>
          <li
            style={{
              margin: '0 20px',
              fontWeight: 'bold',
              padding: '8px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              background: isAboutActive ? '#a52a1a' : 'transparent',
              transition: 'background 0.3s',
            }}
            onClick={handleAboutClick}
          >
            ABOUT US
          </li>
        </ul>
      </nav>
      {/* Main Content: 3 Rows of Organization Logos */}
      <div style={{
        background: '#fff',
        width: '100%',
        maxWidth: 1200,
        margin: '60px auto 0 auto',
        borderRadius: 16,
        padding: '40px 0 32px 0',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.35s',
      }}>
        {/* Row 1: 5 images */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 40 }}>
          {['SPAG.png', 'RMFB.png', 'ALERT.png', 'MRAP.png', 'MSG - ERU.png'].map(img => (
            <img
              key={img}
              src={process.env.PUBLIC_URL + '/Assets/' + img}
              alt={img.replace('.png', '')}
              style={{ width: 140, height: 140, objectFit: 'contain', background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
            />
          ))}
        </div>
        {/* Row 2: 5 images */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60, marginBottom: 40 }}>
          {['DRRM - Y.png', 'AKLMV.png', 'JKM.png', 'KAIC.png', 'CCVOL.png'].map(img => (
            <img
              key={img}
              src={process.env.PUBLIC_URL + '/Assets/' + img}
              alt={img.replace('.png', '')}
              style={{ width: 140, height: 140, objectFit: 'contain', background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
            />
          ))}
        </div>
        {/* Row 3: 5 images */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60 }}>
          {['FRONTLINER.png', 'CRRG.png', 'TF.png', 'SRG.png', 'PCGA 107th.png'].map(img => (
            <img
              key={img}
              src={process.env.PUBLIC_URL + '/Assets/' + img}
              alt={img.replace('.png', '')}
              style={{ width: 140, height: 140, objectFit: 'contain', background: 'white', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
            />
          ))}
        </div>
      </div>
      {/* Contact Us Section */}
      <div style={{
        width: '100%',
        maxWidth: 1200,
        margin: '60px auto 0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* About Us Card */}
        <div style={{
          flex: '1 1 340px',
          background: '#8B1409',
          borderRadius: 20,
          padding: '32px 24px 48px 24px',
          minWidth: 320,
          maxWidth: 420,
          color: '#fff',
          boxShadow: '0 4px 24px rgba(139,20,9,0.10)',
          position: 'relative',
        }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24, letterSpacing: 1, textAlign: 'center' }}>ABOUT US</div>
          <div style={{
            background: '#fff',
            color: '#222',
            borderRadius: 14,
            padding: '28px 18px',
            fontWeight: 700,
            fontSize: 20,
            textAlign: 'center',
            lineHeight: 1.4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            Republic Act (RA) 10121 is also known as the Philippine Disaster Risk Reduction and Management Act of 2010. It's a law that aims to improve the country's disaster risk reduction and management system.
          </div>
        </div>
        {/* Contact Us Form Card */}
        <div style={{
          flex: '1 1 340px',
          background: '#8B1409',
          borderRadius: 20,
          padding: '32px 24px 48px 24px',
          minWidth: 320,
          maxWidth: 480,
          color: '#fff',
          boxShadow: '0 4px 24px rgba(139,20,9,0.10)',
          position: 'relative',
        }}>
          <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 24, letterSpacing: 1, textAlign: 'center' }}>CONTACT US FORM</div>
          <form style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>FULL NAME
              <input type="text" placeholder="Enter your full name" style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: 'none',
                marginTop: 6,
                fontSize: 16,
                background: '#fff',
                color: '#222',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                outline: 'none',
              }} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>EMAIL ADDRESS
              <input type="email" placeholder="Enter your email address" style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: 'none',
                marginTop: 6,
                fontSize: 16,
                background: '#fff',
                color: '#222',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                outline: 'none',
              }} />
            </label>
            <label style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>COMMENT OR ADDRESS
              <textarea placeholder="Type your message or address here" rows={3} style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: 'none',
                marginTop: 6,
                fontSize: 16,
                background: '#fff',
                color: '#222',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                outline: 'none',
                resize: 'vertical',
              }} />
            </label>
            <button type="submit" style={{
              marginTop: 8,
              background: 'linear-gradient(90deg, #ff6b6b, #8B1409)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 16,
              border: 'none',
              borderRadius: 8,
              padding: '12px 0',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(139,20,9,0.10)',
              transition: 'background 0.2s',
            }}>Send Message</button>
          </form>
        </div>
        {/* Contact Info Card (overlapping) */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#b32d1a',
          color: '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 16px rgba(139,20,9,0.13)',
          padding: '28px 32px',
          minWidth: 260,
          maxWidth: 320,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 }}>
            <span role="img" aria-label="location" style={{ fontSize: 22 }}>📍</span>
            Brgy. Banay banay, Cabuyao City, Laguna
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 }}>
            <span role="img" aria-label="phone" style={{ fontSize: 22 }}>📞</span>
            +63 912 3456 789
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 }}>
            <span role="img" aria-label="mobile" style={{ fontSize: 22 }}>📱</span>
            +63 912 3456 789
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 }}>
            <span role="img" aria-label="clock" style={{ fontSize: 22 }}>⏰</span>
            MONDAY - SUNDAY<br />8:00 - 17:00
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer style={{
        background: '#8B1409',
        color: '#fff',
        textAlign: 'center',
        padding: '3px 0 10px 0',
        marginTop: 48,
        fontSize: 15,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        letterSpacing: 0.2,
      }}>
        <div style={{ fontSize: 14, color: '#ffd6d6', marginTop: 8 }}>
          &copy; {new Date().getFullYear()} DPAR Volunteer Coalition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default CitizenPage; 