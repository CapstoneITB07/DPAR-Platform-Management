import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AboutUs() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [fade, setFade] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDropdown = () => setDropdownOpen(!dropdownOpen);
  const closeDropdown = () => setDropdownOpen(false);

  // Animation and navigation for About Us
  const handleAboutClick = () => {
    if (location.pathname === '/citizen/about') return;
    setFade(true);
    setTimeout(() => {
      navigate('/citizen/about');
    }, 350);
  };

  // Animation and navigation for Home
  const handleHomeClick = () => {
    if (location.pathname === '/citizen') return;
    setFade(true);
    setTimeout(() => {
      navigate('/citizen');
    }, 350);
  };

  // Determine if ABOUT US is active
  const isAboutActive = location.pathname === '/citizen/about';
  const isHomeActive = location.pathname === '/citizen';

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fb' }}>
      {/* Navigation Bar */}
      <nav style={{ background: '#8B1409', color: '#fff', padding: '0 0 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60, position: 'relative' }}>
        <div style={{ fontWeight: 'bold', fontSize: 24, marginRight: 'auto', marginLeft: 30 }}>
          DPAR VOLUNTEER COALITION
        </div>
        <ul style={{ listStyle: 'none', display: 'flex', margin: 0, padding: 0, alignItems: 'center', height: '100%' }}>
          <li
            style={{
              margin: '0 20px',
              fontWeight: 'bold',
              background: isHomeActive ? '#a52a1a' : 'transparent',
              borderRadius: 8,
              padding: '8px 18px',
              cursor: 'pointer',
              transition: 'background 0.3s',
            }}
            onClick={handleHomeClick}
          >
            HOME
          </li>
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

      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(rgba(139, 20, 9, 0.9), rgba(139, 20, 9, 0.8))',
        padding: '80px 20px',
        textAlign: 'center',
        color: '#fff',
        marginBottom: 40,
      }}>
        <h1 style={{ fontSize: 48, fontWeight: 800, margin: 0, letterSpacing: 1 }}>About DPAR VOLUNTEER COALITION</h1>
        <p style={{ fontSize: 20, marginTop: 16, maxWidth: 800, margin: '20px auto 0', lineHeight: 1.6 }}>
          Empowering communities through volunteer-driven disaster preparedness and response initiatives
        </p>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 20px',
        opacity: fade ? 0 : 1,
        transition: 'opacity 0.35s',
      }}>
        {/* Timeline Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px',
          marginBottom: 40,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ 
              color: '#8B1409', 
              fontSize: 36, 
              marginBottom: 16,
              fontWeight: 800,
              letterSpacing: 0.5
            }}>Our Journey</h2>
            <div style={{ 
              width: 80, 
              height: 4, 
              background: 'linear-gradient(to right, #8B1409, #ff6b6b)', 
              margin: '0 auto 24px',
              borderRadius: 2
            }}></div>
            <p style={{ 
              textAlign: 'center', 
              color: '#666', 
              fontSize: 17, 
              maxWidth: 800, 
              margin: '0 auto', 
              lineHeight: 1.6 
            }}>
              From our humble beginnings to becoming a leading force in disaster preparedness and response, 
              DPAR Volunteer Coalition has grown through dedication, innovation, and community support.
            </p>
          </div>

          <div style={{ position: 'relative', paddingLeft: 0, paddingRight: 0, margin: '0 auto', maxWidth: 1000 }}>
            {/* Vertical line with gradient and animated dots */}
            <div style={{ 
              position: 'absolute', 
              left: '50%', 
              top: 0, 
              bottom: 0, 
              width: 4, 
              background: 'linear-gradient(to bottom, #8B1409, #ff6b6b)', 
              transform: 'translateX(-50%)', 
              zIndex: 0,
              borderRadius: 2
            }}>
              {/* Animated dots along the timeline */}
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{
                  position: 'absolute',
                  left: '50%',
                  top: `${(i * 100) / 5}%`,
                  width: 12,
                  height: 12,
                  background: '#fff',
                  border: '3px solid #8B1409',
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  boxShadow: '0 0 0 4px rgba(139, 20, 9, 0.1)',
                  animation: 'pulse 2s infinite',
                }}></div>
              ))}
            </div>

            {/* Timeline events */}
            {[
              {
                year: '2018',
                title: 'The Beginning',
                desc: 'DPAR Volunteer Coalition was founded with a vision to create a unified network of volunteers dedicated to disaster preparedness and response.',
                achievements: ['Established core volunteer team', 'Developed initial response protocols', 'Created first community partnerships'],
                impact: 'Laid the foundation for community-based disaster response',
                side: 'left',
              },
              {
                year: '2019',
                title: 'Building Partnerships',
                desc: 'Established crucial partnerships with local government units, NGOs, and community organizations to strengthen our disaster response capabilities.',
                achievements: ['Partnered with 15 local organizations', 'Launched first training programs', 'Developed emergency response network'],
                impact: 'Expanded reach to 5 major communities',
                side: 'right',
              },
              {
                year: '2020',
                title: 'Pandemic Response',
                desc: 'Mobilized volunteers for COVID-19 response, providing essential services and support to vulnerable communities during the global crisis.',
                achievements: ['Distributed 50,000+ relief packages', 'Established 24/7 emergency hotline', 'Trained 1,000+ volunteers'],
                impact: 'Served over 100,000 individuals during the pandemic',
                side: 'left',
              },
              {
                year: '2021',
                title: 'Digital Transformation',
                desc: 'Launched innovative digital platforms and training programs to enhance volunteer coordination and community preparedness.',
                achievements: ['Developed mobile response app', 'Created online training portal', 'Implemented real-time tracking system'],
                impact: 'Increased response efficiency by 60%',
                side: 'right',
              },
              {
                year: '2022',
                title: 'Expanding Impact',
                desc: 'Grew our volunteer network to over 5,000 members, implementing comprehensive disaster risk reduction programs across multiple communities.',
                achievements: ['Covered 25+ communities', 'Conducted 100+ training sessions', 'Responded to 50+ emergencies'],
                impact: 'Reduced emergency response time by 40%',
                side: 'left',
              },
              {
                year: '2023',
                title: 'Future Forward',
                desc: 'Continuing to innovate and expand our reach, focusing on sustainable disaster preparedness and community resilience building.',
                achievements: ['Launched AI-powered response system', 'Expanded to 3 new regions', 'Developed advanced training modules'],
                impact: 'On track to train 10,000+ volunteers by year-end',
                side: 'right',
              }
            ].map((event, idx) => (
              <div key={event.year} style={{
                display: 'flex',
                justifyContent: event.side === 'left' ? 'flex-start' : 'flex-end',
                alignItems: 'flex-start',
                position: 'relative',
                marginBottom: 100,
                zIndex: 1,
              }}>
                {event.side === 'left' && (
                  <div style={{ flex: 1, maxWidth: 420, paddingRight: 40 }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(139, 20, 9, 0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      ':hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      }
                    }}>
                      <div style={{
                        fontWeight: 800,
                        fontSize: 24,
                        marginBottom: 12,
                        color: '#8B1409',
                      }}>{event.title}</div>
                      <div style={{ 
                        color: '#444', 
                        fontSize: 16, 
                        lineHeight: 1.6,
                        marginBottom: 20
                      }}>{event.desc}</div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '20px',
                        borderRadius: 8,
                        borderLeft: '4px solid #8B1409',
                        marginBottom: 16
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#8B1409',
                          marginBottom: 12,
                          fontSize: 15
                        }}>Key Achievements:</div>
                        <ul style={{ 
                          margin: 0, 
                          paddingLeft: 20,
                          color: '#666',
                          fontSize: 14,
                          lineHeight: 1.8
                        }}>
                          {event.achievements.map((achievement, i) => (
                            <li key={i} style={{ marginBottom: 8 }}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={{
                        background: 'linear-gradient(to right, rgba(139, 20, 9, 0.05), rgba(139, 20, 9, 0.1))',
                        padding: '16px',
                        borderRadius: 8,
                        borderLeft: '4px solid #ff6b6b',
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#8B1409',
                          marginBottom: 8,
                          fontSize: 15
                        }}>Impact:</div>
                        <div style={{ 
                          color: '#666',
                          fontSize: 14,
                          lineHeight: 1.6
                        }}>{event.impact}</div>
                      </div>
                    </div>
                  </div>
                )}
                {/* Timeline marker and year */}
                <div style={{
                  width: 160,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #8B1409, #ff6b6b)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: 20,
                    borderRadius: 8,
                    padding: '10px 28px',
                    marginBottom: 12,
                    boxShadow: '0 4px 12px rgba(139, 20, 9, 0.2)',
                    textAlign: 'center',
                    minWidth: 120,
                    letterSpacing: 0.5
                  }}>{event.year}</div>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#fff',
                    border: '4px solid #8B1409',
                    marginBottom: 12,
                    boxShadow: '0 4px 12px rgba(139, 20, 9, 0.2)',
                    position: 'relative',
                    zIndex: 2
                  }}></div>
                  {idx !== 5 && <div style={{ 
                    flex: 1, 
                    width: 4, 
                    background: 'linear-gradient(to bottom, #8B1409, #ff6b6b)', 
                    minHeight: 80 
                  }}></div>}
                </div>
                {event.side === 'right' && (
                  <div style={{ flex: 1, maxWidth: 420, paddingLeft: 40 }}>
                    <div style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: '24px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      border: '1px solid rgba(139, 20, 9, 0.1)',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      ':hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                      }
                    }}>
                      <div style={{
                        fontWeight: 800,
                        fontSize: 24,
                        marginBottom: 12,
                        color: '#8B1409',
                      }}>{event.title}</div>
                      <div style={{ 
                        color: '#444', 
                        fontSize: 16, 
                        lineHeight: 1.6,
                        marginBottom: 20
                      }}>{event.desc}</div>
                      <div style={{
                        background: '#f8f9fa',
                        padding: '20px',
                        borderRadius: 8,
                        borderLeft: '4px solid #8B1409',
                        marginBottom: 16
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#8B1409',
                          marginBottom: 12,
                          fontSize: 15
                        }}>Key Achievements:</div>
                        <ul style={{ 
                          margin: 0, 
                          paddingLeft: 20,
                          color: '#666',
                          fontSize: 14,
                          lineHeight: 1.8
                        }}>
                          {event.achievements.map((achievement, i) => (
                            <li key={i} style={{ marginBottom: 8 }}>{achievement}</li>
                          ))}
                        </ul>
                      </div>
                      <div style={{
                        background: 'linear-gradient(to right, rgba(139, 20, 9, 0.05), rgba(139, 20, 9, 0.1))',
                        padding: '16px',
                        borderRadius: 8,
                        borderLeft: '4px solid #ff6b6b',
                      }}>
                        <div style={{ 
                          fontWeight: 600, 
                          color: '#8B1409',
                          marginBottom: 8,
                          fontSize: 15
                        }}>Impact:</div>
                        <div style={{ 
                          color: '#666',
                          fontSize: 14,
                          lineHeight: 1.6
                        }}>{event.impact}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Mission Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px',
          marginBottom: 40,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ 
              color: '#8B1409', 
              fontSize: 36, 
              marginBottom: 16,
              fontWeight: 800,
              letterSpacing: 0.5
            }}>Our Mission</h2>
            <div style={{ 
              width: 80, 
              height: 4, 
              background: 'linear-gradient(to right, #8B1409, #ff6b6b)', 
              margin: '0 auto 24px',
              borderRadius: 2
            }}></div>
          </div>
          <div style={{
            maxWidth: 900,
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <p style={{ 
              fontSize: 20, 
              lineHeight: 1.8, 
              color: '#444',
              marginBottom: 40,
              fontWeight: 500
            }}>
              DPAR Volunteer Coalition is dedicated to building resilient communities through volunteer-driven initiatives. 
              We unite passionate individuals and organizations to prepare for, respond to, and recover from disasters, 
              ensuring that no community faces emergencies alone.
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 30,
              marginTop: 40
            }}>
              {[
                {
                  title: 'Community Protection',
                  desc: 'Safeguarding communities through proactive disaster preparedness and rapid response initiatives.',
                  icon: '🛡️',
                  stats: '25+ Communities Protected'
                },
                {
                  title: 'Volunteer Empowerment',
                  desc: 'Equipping volunteers with the skills, knowledge, and resources needed to make a difference.',
                  icon: '👥',
                  stats: '5,000+ Empowered Volunteers'
                },
                {
                  title: 'Sustainable Impact',
                  desc: 'Creating lasting positive change through continuous improvement and community engagement.',
                  icon: '🌱',
                  stats: '100+ Successful Programs'
                }
              ].map((item, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  padding: '32px 24px',
                  borderRadius: 16,
                  border: '1px solid rgba(139, 20, 9, 0.1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  ':hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                  }
                }}>
                  <div style={{
                    fontSize: 40,
                    marginBottom: 16
                  }}>{item.icon}</div>
                  <h3 style={{ 
                    color: '#8B1409', 
                    fontSize: 22, 
                    marginBottom: 12,
                    fontWeight: 700
                  }}>{item.title}</h3>
                  <p style={{ 
                    color: '#666', 
                    fontSize: 16, 
                    lineHeight: 1.6,
                    marginBottom: 20
                  }}>{item.desc}</p>
                  <div style={{
                    background: 'linear-gradient(to right, rgba(139, 20, 9, 0.05), rgba(139, 20, 9, 0.1))',
                    padding: '12px',
                    borderRadius: 8,
                    color: '#8B1409',
                    fontWeight: 600,
                    fontSize: 15
                  }}>{item.stats}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px',
          marginBottom: 40,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ 
              color: '#8B1409', 
              fontSize: 36, 
              marginBottom: 16,
              fontWeight: 800,
              letterSpacing: 0.5
            }}>Our Core Values</h2>
            <div style={{ 
              width: 80, 
              height: 4, 
              background: 'linear-gradient(to right, #8B1409, #ff6b6b)', 
              margin: '0 auto 24px',
              borderRadius: 2
            }}></div>
            <p style={{ 
              textAlign: 'center', 
              color: '#666', 
              fontSize: 17, 
              maxWidth: 800, 
              margin: '0 auto', 
              lineHeight: 1.6 
            }}>
              These core values guide our actions and decisions, shaping how we serve our communities and work together.
            </p>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 30,
            maxWidth: 1000,
            margin: '0 auto'
          }}>
            {[
              {
                title: 'Community First',
                desc: 'We prioritize the needs and well-being of our communities in everything we do.',
                icon: '🏘️',
                principles: ['Local Focus', 'Community Voice', 'Inclusive Approach']
              },
              {
                title: 'Volunteer Spirit',
                desc: 'We believe in the power of volunteerism and the impact of dedicated individuals.',
                icon: '🤝',
                principles: ['Dedication', 'Collaboration', 'Service Excellence']
              },
              {
                title: 'Innovation',
                desc: 'We continuously seek new and better ways to serve our communities.',
                icon: '💡',
                principles: ['Creative Solutions', 'Adaptive Learning', 'Forward Thinking']
              },
            ].map((value, idx) => (
              <div key={idx} style={{
                background: '#fff',
                padding: '32px 24px',
                borderRadius: 16,
                border: '1px solid rgba(139, 20, 9, 0.1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                transition: 'all 0.3s ease',
                ':hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
                }
              }}>
                <div style={{
                  fontSize: 40,
                  marginBottom: 16
                }}>{value.icon}</div>
                <h3 style={{ 
                  color: '#8B1409', 
                  fontSize: 22, 
                  marginBottom: 12,
                  fontWeight: 700
                }}>{value.title}</h3>
                <p style={{ 
                  color: '#666', 
                  fontSize: 16, 
                  lineHeight: 1.6,
                  marginBottom: 20
                }}>{value.desc}</p>
                <div style={{
                  background: '#f8f9fa',
                  padding: '16px',
                  borderRadius: 8,
                  borderLeft: '4px solid #8B1409'
                }}>
                  <div style={{ 
                    fontWeight: 600, 
                    color: '#8B1409',
                    marginBottom: 12,
                    fontSize: 15
                  }}>Key Principles:</div>
                  <ul style={{ 
                    margin: 0, 
                    paddingLeft: 20,
                    color: '#666',
                    fontSize: 14,
                    lineHeight: 1.8
                  }}>
                    {value.principles.map((principle, i) => (
                      <li key={i} style={{ marginBottom: 8 }}>{principle}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>
          {`
            @keyframes pulse {
              0% {
                box-shadow: 0 0 0 0 rgba(139, 20, 9, 0.4);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(139, 20, 9, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(139, 20, 9, 0);
              }
            }
          `}
        </style>
      </div>

      {/* Footer */}
      <footer style={{
        background: '#8B1409',
        color: '#fff',
        textAlign: 'center',
        padding: '20px 0',
        marginTop: 48,
        fontSize: 15,
      }}>
        <div style={{ fontSize: 14, color: '#ffd6d6' }}>
          &copy; {new Date().getFullYear()} DPAR Volunteer Coalition. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export default AboutUs;