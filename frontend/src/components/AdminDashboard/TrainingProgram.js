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

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>TRAINING PROGRAMS</h2>
        <button onClick={() => openModal()} style={{ background: '#001aff', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>
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
                <input name="name" value={form.name} onChange={handleChange} required style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label>Date</label><br />
                  <input type="date" name="date" value={form.date} onChange={handleChange} required style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Location</label><br />
                  <input name="location" value={form.location} onChange={handleChange} required style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Program Description</label><br />
                <textarea name="description" value={form.description} onChange={handleChange} required style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #ccc' }} />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Upload Image</label><br />
                <input type="file" accept="image/*" onChange={handleImageChange} style={{ marginTop: 4 }} />
                {form.imagePreview && (
                  <div style={{ marginTop: 8 }}>
                    <img src={form.imagePreview} alt="Preview" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 8, display: 'block' }} />
                    <button type="button" onClick={handleRemoveImage} style={{ marginTop: 6, background: '#eee', color: '#333', border: 'none', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>Remove Image</button>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={closeModal} style={{ background: '#ccc', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={loading} style={{ background: '#001aff', color: 'white', border: 'none', borderRadius: 4, padding: '6px 16px', cursor: 'pointer' }}>{loading ? (editId ? 'Saving...' : 'Adding...') : (editId ? 'Save' : 'Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Card Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32, marginTop: 32 }}>
        {programs.length === 0 ? (
          <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#888' }}>No training programs yet.</p>
        ) : (
          programs.map((program, idx) => (
            <div key={program.id} style={{ border: '1px solid #bbb', borderRadius: 16, padding: 0, background: 'white', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', minHeight: 320 }}>
              {/* Three-dot menu */}
              <button onClick={() => handleMenuToggle(idx)} style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}>
                <FaEllipsisH size={20} />
              </button>
              {menuOpenIndex === idx && (
                <div style={{ position: 'absolute', top: 38, right: 16, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 120 }}>
                  <div style={{ padding: '10px 16px', cursor: 'pointer', color: '#333', borderBottom: '1px solid #f0f2f5' }} onClick={() => openModal(idx)}>Edit</div>
                  <div style={{ padding: '10px 16px', cursor: 'pointer', color: '#e74c3c' }} onClick={() => handleDelete(idx)}>Delete</div>
                </div>
              )}
              {/* Image */}
              {program.image_url && (
                <img src={program.image_url} alt="Program" style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderTopLeftRadius: 16, borderTopRightRadius: 16 }} />
              )}
              {/* Content */}
              <div style={{ padding: 20, width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 6 }}>{program.name}</div>
                <div style={{ color: '#555', marginBottom: 8 }}>{program.date} {program.location && `| ${program.location}`}</div>
                <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: 12, width: '100%', minHeight: 60, marginBottom: 16, textAlign: 'center', color: '#333', background: '#f8f8f8' }}>{program.description}</div>
                <button style={{ background: '#fff', border: '1px solid #001aff', borderRadius: 6, padding: '4px 16px', color: '#001aff', cursor: 'pointer', fontWeight: 'bold' }}>SEE MORE</button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}

export default TrainingProgram; 