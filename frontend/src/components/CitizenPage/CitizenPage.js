import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../logo.svg';
import axios from 'axios';

function CitizenPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);

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

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8000/api/training-programs');
      setPrograms(res.data);
    } catch (err) {
      setError('Failed to load training programs');
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = (imgUrl) => {
    setModalImg(imgUrl);
    setModalOpen(true);
  };
  const closeImageModal = () => {
    setModalOpen(false);
    setModalImg(null);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
      {/* Training Programs as Posts */}
      <div style={{ background: '#f7f8fa', flex: 1, padding: '40px 0 60px 0', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ textAlign: 'center', fontWeight: 700, letterSpacing: 1, marginBottom: 36, fontSize: 28, color: '#222' }}>Training Programs</h2>
        <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 36 }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#888', fontSize: 18 }}>Loading...</div>
          ) : error ? (
            <div style={{ textAlign: 'center', color: 'red', fontSize: 18 }}>{error}</div>
          ) : programs.length === 0 ? (
            <p style={{ color: '#888', fontSize: 18, textAlign: 'center' }}>No training programs available.</p>
          ) : (
            programs.map((program) => (
              <div key={program.id} style={{ background: '#fff', borderRadius: 18, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 0, margin: '0 auto', width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'stretch', overflow: 'hidden' }}>
                {/* Post image (like Facebook post) */}
                {program.image_url && (
                  <img
                    src={program.image_url}
                    alt="Program"
                    style={{ width: '100%', height: 220, objectFit: 'cover', cursor: 'pointer', display: 'block' }}
                    onClick={() => openImageModal(program.image_url)}
                    title="Click to view larger"
                  />
                )}
                {/* Post content */}
                <div style={{ padding: '24px 28px 18px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: 20, color: '#1a1a1a', marginBottom: 2, textAlign: 'center' }}>{program.name}</div>
                  <div style={{ color: '#4a4a4a', fontSize: 15, marginBottom: 12, textAlign: 'center' }}>{program.date}{program.location && <span> &bull; {program.location}</span>}</div>
                  <div style={{ color: '#333', background: '#f3f4f6', borderRadius: 12, padding: '18px 16px', width: '100%', minHeight: 60, fontSize: 16, textAlign: 'left', marginBottom: 0 }}>{program.description}</div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Image Modal */}
        {modalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={closeImageModal}>
            <div style={{ background: '#fff', padding: 24, borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.18)', position: 'relative', maxWidth: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
              <button onClick={closeImageModal} style={{ position: 'absolute', top: 10, right: 14, background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: '#888' }}>&times;</button>
              <img src={modalImg} alt="Large Program" style={{ maxWidth: 400, maxHeight: '65vh', borderRadius: 12, marginBottom: 10 }} />
            </div>
          </div>
        )}
      </div>
      {/* Footer always at the bottom */}
      <footer style={{
        background: '#8B1409',
        color: '#fff',
        textAlign: 'center',
        padding: '3px 0 10px 0',
        fontSize: 15,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        letterSpacing: 0.2,
        marginTop: 'auto',
      }}>
        <div style={{ fontSize: 14, color: '#ffd6d6', marginTop: 8 }}>
          &copy; {new Date().getFullYear()} DPAR Volunteer Coalition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default CitizenPage; 