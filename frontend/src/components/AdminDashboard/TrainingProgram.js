import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FaEllipsisH } from 'react-icons/fa';
import axios from 'axios';

function TrainingProgram() {
  const [programs, setPrograms] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', location: '', description: '', image: null, imagePreview: null });
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [menuOpenIndex, setMenuOpenIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/training-programs');
      setPrograms(res.data);
    } catch (err) {
      setError('Failed to load training programs');
    }
  };

  const openModal = (index = null) => {
    if (index !== null) {
      const prog = programs[index];
      setForm({
        name: prog.name || '',
        date: prog.date || '',
        location: prog.location || '',
        description: prog.description || '',
        image: null,
        imagePreview: prog.image_url || null,
      });
      setEditIndex(index);
      setEditId(prog.id);
    } else {
      setForm({ name: '', date: '', location: '', description: '', image: null, imagePreview: null });
      setEditIndex(null);
      setEditId(null);
    }
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setForm({ name: '', date: '', location: '', description: '', image: null, imagePreview: null });
    setEditIndex(null);
    setEditId(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, image: file, imagePreview: URL.createObjectURL(file) });
    }
  };

  const handleRemoveImage = () => {
    setForm({ ...form, image: null, imagePreview: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('date', form.date);
    formData.append('location', form.location);
    formData.append('description', form.description);
    if (form.image) formData.append('image', form.image);
    try {
      if (editId) {
        await axios.post(`http://localhost:8000/api/training-programs/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await axios.post('http://localhost:8000/api/training-programs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      closeModal();
      fetchPrograms();
    } catch (err) {
      setError('Failed to save training program');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm('Are you sure you want to delete this training program?')) return;
    try {
      const id = programs[index].id;
      await axios.delete(`http://localhost:8000/api/training-programs/${id}`);
      fetchPrograms();
    } catch (err) {
      setError('Failed to delete training program');
    }
    setMenuOpenIndex(null);
  };

  const handleMenuToggle = (idx) => {
    setMenuOpenIndex(menuOpenIndex === idx ? null : idx);
  };

  const toggleExpand = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const DESCRIPTION_LIMIT = 120;

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, letterSpacing: 0.5, color: 'black' }}>TRAINING PROGRAMS</h2>
        <button onClick={() => openModal()} style={{ background: '#001aff', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 22px', fontWeight: 'bold', fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,26,255,0.08)' }}>
          ADD PROGRAM
        </button>
      </div>
      {error && <div style={{ color: 'red', margin: '10px 0' }}>{error}</div>}
      {/* Add/Edit Modal Popup */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 16, minWidth: 340, maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button onClick={closeModal} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, cursor: 'pointer' }}>&times;</button>
            <h3 style={{ marginBottom: 18 }}>{editId ? 'Edit' : 'Add'} Training Program</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 12 }}>
                <label>Program Name</label><br />
                <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
              </div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Date</label><br />
                  <input type="date" name="date" value={form.date} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Location</label><br />
                  <input name="location" value={form.location} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15 }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Program Description</label><br />
                <textarea name="description" value={form.description} onChange={handleChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 15, minHeight: 80 }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Upload Image</label><br />
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: 4 }} />
                {form.imagePreview && (
                  <div style={{ marginTop: 8 }}>
                    <img src={form.imagePreview} alt="Preview" style={{ maxWidth: 220, maxHeight: 160, borderRadius: 10, display: 'block', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                    <button type="button" onClick={handleRemoveImage} style={{ marginTop: 6, background: '#eee', color: '#333', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Remove Image</button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={closeModal} style={{ background: '#ccc', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 15 }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ background: '#001aff', color: 'white', border: 'none', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 15 }}>{loading ? (editId ? 'Saving...' : 'Adding...') : (editId ? 'Save' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 36, marginTop: 36, maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        {programs.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>No training programs yet.</p>
        ) : (
          programs.map((program, idx) => {
            const isLong = program.description && program.description.length > DESCRIPTION_LIMIT;
            const isExpanded = !!expanded[program.id];
            const displayDesc = isLong && !isExpanded ? program.description.slice(0, DESCRIPTION_LIMIT) + '...' : program.description;
            return (
              <div key={program.id} style={{
                border: '1px solid #e0e0e0',
                borderRadius: 18,
                background: '#fff',
                boxShadow: '0 4px 18px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                minHeight: 420,
                position: 'relative',
                overflow: 'hidden',
                transition: 'box-shadow 0.2s',
              }}>
                {/* Three-dot menu */}
                <button onClick={() => handleMenuToggle(idx)} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}>
                  <FaEllipsisH size={22} />
                </button>
                {menuOpenIndex === idx && (
                  <div style={{ position: 'absolute', top: 44, right: 18, background: '#fff', border: '1px solid #eee', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 120 }}>
                    <div style={{ padding: '12px 18px', cursor: 'pointer', color: '#333', borderBottom: '1px solid #f0f2f5' }} onClick={() => openModal(idx)}>Edit</div>
                    <div style={{ padding: '12px 18px', cursor: 'pointer', color: '#e74c3c' }} onClick={() => handleDelete(idx)}>Delete</div>
                  </div>
                )}
                {/* Image */}
                {program.image_url && (
                  <img src={program.image_url} alt="Program" style={{ width: '100%', height: 220, objectFit: 'cover', borderTopLeftRadius: 18, borderTopRightRadius: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
                )}
                {/* Content */}
                <div style={{ padding: 28, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                  <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#A11C22', letterSpacing: 0.2, wordBreak: 'break-word' }}>{program.name}</div>
                  <div style={{ color: '#555', marginBottom: 10, fontSize: 15, fontWeight: 500 }}>
                    {program.date} {program.location && <span style={{ color: '#1976d2' }}>| {program.location}</span>}
                  </div>
                  <div style={{ fontSize: 16, color: '#333', marginBottom: 16, lineHeight: 1.6, minHeight: 40, width: '100%', wordBreak: 'break-word', whiteSpace: 'pre-line', overflowWrap: 'break-word' }}>
                    {displayDesc}
                    {isLong && (
                      <button onClick={() => toggleExpand(program.id)} style={{ background: 'none', color: '#1976d2', border: 'none', fontWeight: 600, cursor: 'pointer', marginLeft: 6, fontSize: 15, padding: 0 }}>
                        {isExpanded ? 'See less' : 'See more'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </AdminLayout>
  );
}

export default TrainingProgram; 