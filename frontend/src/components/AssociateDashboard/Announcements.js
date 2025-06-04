import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await axios.get('http://localhost:8000/api/announcements', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnnouncements(res.data);
    } catch (err) {
      setError('Failed to load announcements');
    }
  };

  return (
    <AssociateLayout>
      <h2>Announcements</h2>
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      {/* Image Modal */}
      {modalImg && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setModalImg(null)}>
          <img src={modalImg} alt="Announcement Large" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 4px 32px rgba(0,0,0,0.25)' }} />
        </div>
      )}
      <div style={{ marginTop: 32, maxWidth: 600, marginLeft: 'auto', marginRight: 'auto' }}>
        {announcements.length === 0 ? (
          <div>No announcements yet.</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{
              background: '#f8fafc',
              borderRadius: 14,
              marginBottom: 28,
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              border: '1px solid #e3e7ed',
              position: 'relative',
              overflow: 'hidden',
              transition: 'box-shadow 0.2s',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '16px 20px 8px 20px', borderBottom: '1px solid #f0f2f5', background: '#f3f6fa' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: '#888' }}>{new Date(a.created_at).toLocaleString()}</div>
                </div>
              </div>
              {/* Content */}
              <div style={{ padding: '18px 20px 10px 20px' }}>
                {a.title && <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 6, color: '#1a202c' }}>{a.title}</div>}
                {a.description && <div style={{ fontSize: 16, color: '#444', marginBottom: a.photo_url ? 12 : 0 }}>{a.description}</div>}
                {a.photo_url && (
                  <img
                    src={a.photo_url}
                    alt="Announcement"
                    style={{ width: '100%', maxHeight: 350, objectFit: 'cover', borderRadius: 10, marginTop: 10, marginBottom: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                    onClick={() => setModalImg(a.photo_url)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AssociateLayout>
  );
}

export default Announcements; 