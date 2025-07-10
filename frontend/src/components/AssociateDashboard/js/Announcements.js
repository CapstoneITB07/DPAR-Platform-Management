import React, { useEffect, useState } from 'react';
import AssociateLayout from './AssociateLayout';
import axios from 'axios';
import '../css/Announcements.css';
import { FaFire, FaCheckDouble, FaWater, FaSnowflake, FaShieldAlt } from 'react-icons/fa';

const slides = [
  {
    icon: <FaFire size={140} color="#ffa500" />,
    title: "Disaster Preparedness & Response",
    subtitle: "Protecting Communities, Saving Lives",
    desc: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur."
  },
  {
    icon: <FaCheckDouble size={140} color="#21963f" />,
    title: "Mitigation",
    subtitle: "Minimize Risk and Damage",
    desc: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur."
  },
  {
    icon: <FaSnowflake size={140} color="#00bcd4" />,
    title: "Preparedness",
    subtitle: "Get Ready for the Unexpected",
    desc: "Tips for keeping your family safe during cold weather emergencies."
  },
  {
    icon: <FaShieldAlt size={140} color="#a72828" />,
    title: "Response",
    subtitle: "Together, We Are Stronger",
    desc: "Building resilient communities through preparedness and cooperation."
  },
  {
    icon: <FaWater size={140} color="#00bcd4" />,
    title: "Recovery",
    subtitle: "Rebuilding and Restoring",
    desc: "DPAR is dedicated to ensuring communities are prepared for disasters and equipped to respond effectively when emergencies occur."
  }
];

function AnnouncementsLeftCard() {
  const [current, setCurrent] = useState(0);
  const prevSlide = () => setCurrent((current - 1 + slides.length) % slides.length);
  const nextSlide = () => setCurrent((current + 1) % slides.length);

  return (
    <div className="announcements-left-card">
      <div className="announcements-bg-logo" style={{ backgroundImage: "url('/Assets/disaster_logo.png')", opacity: 0.13 }} />
      <button
        className="announcements-arrow announcements-arrow-left"
        onClick={prevSlide}
        tabIndex={0}
        aria-label="Previous slide"
        style={{ zIndex: 20 }}
      >
        &#10094;
      </button>
      <button
        className="announcements-arrow announcements-arrow-right"
        onClick={nextSlide}
        tabIndex={0}
        aria-label="Next slide"
        style={{ zIndex: 20 }}
      >
        &#10095;
      </button>
      <div className="announcements-content-overlay">
        <div className="announcements-icon-bg" style={{ marginBottom: 16 }}>
          {slides[current].icon}
        </div>
        <div className="announcements-title">{slides[current].title}</div>
        <div className="announcements-subtitle">{slides[current].subtitle}</div>
      </div>
      <div className="announcements-gradient-bottom">
        <div className="announcements-desc">{slides[current].desc}</div>
        <div className="announcements-dots">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={"announcements-dot" + (idx === current ? " active" : "")}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

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
      <div className="announcements-bg">
        <div className="announcements-container">
          <h1 className="announcements-header">Announcements</h1>
          {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
          {/* Modal for image */}
          {modalImg && (
            <div className="announcements-modal" onClick={() => setModalImg(null)}>
              <img src={modalImg} alt="Announcement Large" className="announcements-modal-img" />
            </div>
          )}
          <div className="announcements-flex">
            {/* Left: Static Card */}
            <AnnouncementsLeftCard />
            {/* Right: Announcements List */}
            <div className="announcements-right-col">
              {announcements.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#888', fontStyle: 'italic', background: '#fff', borderRadius: 10, padding: 32, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>No announcements yet.</div>
              ) : (
                announcements.map(a => (
                  <div key={a.id} className="announcement-card">
                    {/* Date/Time Row */}
                    <div className="announcement-datetime-row">
                      <div>
                        <span className="announcement-date-badge">
                          <span role="img" aria-label="calendar">📅</span> {new Date(a.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="announcement-time-badge">
                          <span role="img" aria-label="clock">⏰</span> {new Date(a.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                    {/* Title/Content */}
                    <div className="announcement-content">
                      {a.title && <div className="announcement-title">{a.title}</div>}
                      {a.description && <div className="announcement-desc">{a.description}</div>}
                      {a.photo_url && (
                        <div className="announcement-img-wrapper">
                          <img
                            src={a.photo_url}
                            alt="Announcement"
                            className="announcement-img"
                            onClick={() => setModalImg(a.photo_url)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AssociateLayout>
  );
}

export default Announcements; 