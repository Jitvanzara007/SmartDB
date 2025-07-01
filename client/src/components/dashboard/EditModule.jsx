import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

function EditModule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: '',
    is_active: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchModule = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/modules/${id}/`);
        console.log('Fetched module data:', res.data);
        setFormData({
          title: res.data.title,
          description: res.data.description,
          content: res.data.content,
          duration_minutes: res.data.duration_minutes,
          is_active: res.data.is_active,
        });
      } catch (err) {
        setError('Failed to fetch module data.');
      }
      setLoading(false);
    };
    fetchModule();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await axiosInstance.put(`/modules/${id}/`, formData);
      setSuccess('Module updated successfully!');
      setTimeout(() => navigate('/modules'), 1200);
    } catch (err) {
      setError('Failed to update module.');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container" style={{paddingTop: '32px', paddingBottom: '32px'}}>
      <div className="modal-content" style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '32px',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        background: 'transparent',
        boxShadow: 'none',
      }}>
        <h2 style={{textAlign: 'center', marginBottom: '16px'}}>Edit Training Module</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit} className="edit-module-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={3}
              maxLength={100}
              placeholder="Enter module title"
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={10}
              maxLength={500}
              placeholder="Enter module description"
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              minLength={5}
              maxLength={1000}
              placeholder="Enter module content (details, instructions, etc.)"
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label>Duration (minutes)</label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes}
              onChange={handleChange}
              required
              min={1}
              max={480}
              placeholder="Enter duration in minutes"
              className="form-control"
            />
          </div>
          <div className="form-group" style={{marginBottom: '16px'}}>
            <label style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                style={{marginRight: '8px'}}
              />
              Active
            </label>
          </div>
          <div className="modal-actions" style={{display: 'flex', gap: '12px', justifyContent: 'center'}}>
            <button type="submit" className="btn btn-primary">Save Changes</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditModule; 