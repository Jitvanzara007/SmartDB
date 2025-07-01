import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axios';

function CreateModuleModal({ isOpen, onClose, onModuleCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setError('');
      setFormData({
        title: '',
        description: '',
        content: '',
        duration_minutes: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.7)',
        zIndex: 9999,
      }} onClick={onClose} />
      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: '#23272f',
        color: '#fff',
        borderRadius: 12,
        minWidth: 380,
        maxWidth: 420,
        width: '90vw',
        boxShadow: '0 8px 32px #000a',
        zIndex: 10000,
        padding: '2.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ marginBottom: 24, fontWeight: 700, fontSize: '1.5rem', textAlign: 'center' }}>Create New Module</h2>
        {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={async (e) => {
          e.preventDefault();
          setError('');
          try {
            const response = await axiosInstance.post('/modules/', {
              title: formData.title.trim(),
              description: formData.description.trim(),
              content: formData.content.trim(),
              duration_minutes: parseInt(formData.duration_minutes),
            });
            onModuleCreated(response.data);
            onClose();
          } catch (err) {
            setError(err.response?.data?.error || 'Failed to create module. Please try again.');
          }
        }}>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              minLength={3}
              maxLength={100}
              placeholder="Enter module title"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#181b20',
                color: '#fff',
                fontSize: '1rem',
                outline: 'none',
                marginBottom: 0,
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              minLength={10}
              maxLength={500}
              placeholder="Enter module description"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#181b20',
                color: '#fff',
                fontSize: '1rem',
                minHeight: 80,
                resize: 'vertical',
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              minLength={5}
              maxLength={1000}
              placeholder="Enter module content (details, instructions, etc.)"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#181b20',
                color: '#fff',
                fontSize: '1rem',
                minHeight: 80,
                resize: 'vertical',
              }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>Duration (minutes)</label>
            <input
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              required
              min={1}
              placeholder="Enter duration in minutes"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: 6,
                border: '1px solid #444',
                background: '#181b20',
                color: '#fff',
                fontSize: '1rem',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', borderRadius: 6 }}>Create</button>
            <button type="button" className="btn btn-secondary" style={{ padding: '0.75rem 1.5rem', fontWeight: 600, fontSize: '1rem', borderRadius: 6, background: '#444', color: '#fff', border: 'none' }} onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
}

export default CreateModuleModal; 