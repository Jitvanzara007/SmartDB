import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';

function AssignModulesModal({ trainee, isOpen, onClose, allModules, assignedModuleIds, onSave }) {
  const [selectedModules, setSelectedModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) {
      setSelectedModules(assignedModuleIds || []);
      setError('');
    }
  }, [isOpen, assignedModuleIds]);
  if (!isOpen || !trainee) return null;
  const handleToggle = (moduleId) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };
  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all(
        selectedModules.map(moduleId =>
          axiosInstance.post(`/modules/${moduleId}/assign/`, { trainee_ids: [trainee.id] })
        )
      );
      onSave(selectedModules);
      onClose();
    } catch (err) {
      setError('Failed to assign modules.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272f', color: '#fff', borderRadius: 12, minWidth: 350, maxWidth: 420, width: '90vw', boxShadow: '0 8px 32px #000a', zIndex: 10000, padding: '2rem', position: 'relative' }}>
        <h2 style={{ marginBottom: 16 }}>Assign Modules to {trainee.first_name} {trainee.last_name}</h2>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
          {allModules.length === 0 ? (
            <div>No modules available.</div>
          ) : (
            allModules.map((mod) => (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <input
                  type="checkbox"
                  checked={selectedModules.includes(mod.id)}
                  onChange={() => handleToggle(mod.id)}
                  id={`mod-${mod.id}`}
                  style={{ marginRight: 8 }}
                />
                <label htmlFor={`mod-${mod.id}`}>{mod.title}</label>
              </div>
            ))
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function AddTraineeModal({ isOpen, onClose, onTraineeAdded }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) {
      setFormData({ first_name: '', last_name: '', username: '', email: '', password: '' });
      setError('');
    }
  }, [isOpen]);
  if (!isOpen) return null;
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('/auth/register/', {
        ...formData,
        role: 'trainee',
      });
      onTraineeAdded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add trainee.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272f', color: '#fff', borderRadius: 12, minWidth: 350, maxWidth: 420, width: '90vw', boxShadow: '0 8px 32px #000a', zIndex: 10000, padding: '2rem', position: 'relative' }}>
        <h2 style={{ marginBottom: 16 }}>Add New Trainee</h2>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input name="first_name" value={formData.first_name} onChange={handleChange} placeholder="First Name" required style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181b20', color: '#fff' }} />
          <input name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Last Name" required style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181b20', color: '#fff' }} />
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" required style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181b20', color: '#fff' }} />
          <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Email" required style={{ width: '100%', marginBottom: 10, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181b20', color: '#fff' }} />
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Password" required style={{ width: '100%', marginBottom: 18, padding: 8, borderRadius: 6, border: '1px solid #444', background: '#181b20', color: '#fff' }} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" type="button" onClick={onClose} disabled={loading}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmDeleteModal({ isOpen, onClose, onConfirm, trainee }) {
  if (!isOpen || !trainee) return null;
  return (
    <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272f', color: '#fff', borderRadius: 12, minWidth: 320, maxWidth: 400, width: '90vw', boxShadow: '0 8px 32px #000a', zIndex: 10000, padding: '2rem', position: 'relative' }}>
        <h2 style={{ marginBottom: 16 }}>Delete Trainee</h2>
        <p>Are you sure you want to delete <b>{trainee.first_name} {trainee.last_name}</b> (@{trainee.username})?</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ProgressModal({ isOpen, onClose, trainee }) {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (isOpen && trainee) {
      setLoading(true);
      axiosInstance.get(`/instructor/trainees/${trainee.id}/progress/`).then(res => {
        setProgress(res.data);
      }).catch(() => setProgress(null)).finally(() => setLoading(false));
    }
  }, [isOpen, trainee]);
  if (!isOpen || !trainee) return null;
  return (
    <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#23272f', color: '#fff', borderRadius: 12, minWidth: 350, maxWidth: 500, width: '90vw', boxShadow: '0 8px 32px #000a', zIndex: 10000, padding: '2rem', position: 'relative' }}>
        <h2 style={{ marginBottom: 16 }}>Progress for {trainee.first_name} {trainee.last_name}</h2>
        {loading ? <div>Loading...</div> : progress ? (
          <div>
            <div><b>Total Assigned:</b> {progress.total_assigned}</div>
            <div><b>Completed:</b> {progress.completed}</div>
            <div><b>Pending:</b> {progress.pending}</div>
            <div><b>Completion %:</b> {progress.completion_percentage}%</div>
            <div style={{ marginTop: 12 }}>
              <b>Assignments:</b>
              <ul>
                {progress.assignments && progress.assignments.map(a => (
                  <li key={a.id}>{a.module.title} - {a.is_completed ? 'Completed' : 'Pending'}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : <div>No progress data available.</div>}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const cardColors = ['#4f8cff', '#ffb347', '#6ee7b7', '#f87171', '#a78bfa', '#fbbf24'];

function getAvatarColor(idx) {
  return cardColors[idx % cardColors.length];
}

function ManageTrainees() {
  const { user } = useAuth();
  const [trainees, setTrainees] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState(null);
  const [assignedModuleIds, setAssignedModuleIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [traineeToDelete, setTraineeToDelete] = useState(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [traineeToView, setTraineeToView] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTrainees();
    fetchModules();
  }, []);

  const fetchTrainees = async () => {
    try {
      const response = await axiosInstance.get('/trainees/');
      setTrainees(response.data);
    } catch (err) {
      setError('Failed to load trainees');
      console.error('Trainees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axiosInstance.get('/modules/');
      setModules(response.data.results || response.data);
    } catch (err) {
      setError('Failed to load modules');
      console.error('Modules error:', err);
    }
  };

  const openAssignModal = async (trainee) => {
    setSelectedTrainee(trainee);
    setShowAssignModal(true);
    try {
      const response = await axiosInstance.get(`/assignments/?trainee_id=${trainee.id}`);
      let assignments = response.data.results || response.data;
      setAssignedModuleIds(assignments.map(a => a.module.id));
    } catch (err) {
      setAssignedModuleIds([]);
    }
  };

  const handleAssignSave = (newAssignedIds) => {
    setAssignedModuleIds(newAssignedIds);
  };

  const handleAddTrainee = () => {
    setShowAddModal(true);
  };

  const handleTraineeAdded = () => {
    fetchTrainees();
  };

  const handleDeleteTrainee = (trainee) => {
    setTraineeToDelete(trainee);
    setShowDeleteModal(true);
  };

  const confirmDeleteTrainee = async () => {
    if (!traineeToDelete) return;
    try {
      await axiosInstance.delete(`/trainees/${traineeToDelete.id}/delete/`);
      setShowDeleteModal(false);
      setTraineeToDelete(null);
      fetchTrainees();
    } catch (err) {
      alert('Failed to delete trainee.');
    }
  };

  const handleViewProgress = (trainee) => {
    setTraineeToView(trainee);
    setShowProgressModal(true);
  };

  const filteredTrainees = trainees.filter(t =>
    t.first_name.toLowerCase().includes(search.toLowerCase()) ||
    t.last_name.toLowerCase().includes(search.toLowerCase()) ||
    t.username.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading trainees...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  // Responsive grid style
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '1.2rem',
    width: '100%',
    justifyItems: 'stretch',
    alignItems: 'stretch',
    margin: 0,
    padding: 0,
    background: 'transparent',
  };
  // Media query for responsiveness (inline style workaround)
  const mediaQuery = `@media (max-width: 900px) { .trainee-grid { grid-template-columns: repeat(2, 1fr) !important; } }\n@media (max-width: 600px) { .trainee-grid { grid-template-columns: 1fr !important; } }`;

  return (
    <div className="main-content" style={{ background: '#181b20', minHeight: '100vh', padding: 0 }}>
      <style>{mediaQuery}</style>
      {/* Unified container for header and section card, aligns with sidebar/main content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px' }}>
        {/* Header - border aligns with sidebar/main content */}
        <div className="dashboard-header" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, margin: 0, borderBottom: '1.5px solid #23272f', padding: '1.2rem 0 1rem 0', width: '100%' }}>
          <div>
            <h1 className="dashboard-title" style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Manage Trainees</h1>
            <p className="dashboard-subtitle" style={{ margin: '4px 0 0 2px', fontSize: 15, color: '#b0b8c1' }}>View and manage your training participants</p>
      </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="text"
              placeholder="Search trainees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid #23272f', background: '#23272f', color: '#fff', width: 180, fontSize: 15, marginRight: 8 }}
            />
            <button className="btn btn-primary" style={{ fontWeight: 600, fontSize: 15, padding: '0.5rem 1.2rem', borderRadius: 8 }} onClick={handleAddTrainee}>+ Add Trainee</button>
          </div>
        </div>
        {/* Section Card - background, borderRadius, shadow, padding, marginTop */}
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem 1.5rem 1.2rem 1.5rem', marginTop: 24, width: '100%' }}>
          {/* Section Title - left-aligned, flush with card and grid */}
          <h3 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.08rem', color: '#fff', textAlign: 'left' }}>Trainee List</h3>
          {/* Grid - fills card, cards start at left edge */}
          {filteredTrainees.length === 0 ? (
            <div className="empty-state" style={{ textAlign: 'center', color: '#b0b8c1', marginTop: 40 }}>
              <div className="empty-state-icon" style={{ fontSize: 36, marginBottom: 8 }}>👥</div>
              <div className="empty-state-title" style={{ fontSize: 18, fontWeight: 700 }}>No Trainees Found</div>
              <div className="empty-state-text" style={{ fontSize: 14 }}>No trainees match your search or have registered yet.</div>
            </div>
          ) : (
            <div className="trainee-grid" style={gridStyle}>
              {filteredTrainees.map((trainee, idx) => (
                <div
                  key={trainee.id}
                  style={{
                    background: '#23272f',
                    color: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 4px 24px #0003',
                    padding: '1.5rem 1.5rem',
                    minWidth: 0,
                    width: '100%',
                    maxWidth: 420,
                    minHeight: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    cursor: 'pointer',
                    position: 'relative',
                    border: '1px solid #23272f',
                    outline: 'none',
                    margin: 0,
                    overflow: 'hidden',
                    justifyContent: 'space-between',
                  }}
                  tabIndex={0}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 8px 32px #0005'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 24px #0003'}
                >
                  {/* Avatar */}
                  <div style={{ width: 70, height: 70, borderRadius: '50%', background: getAvatarColor(idx), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 700, marginBottom: 18, color: '#fff', boxShadow: '0 2px 8px #0002', border: '2px solid #181b20' }}>
                    {trainee.first_name ? trainee.first_name.charAt(0).toUpperCase() : trainee.username.charAt(0).toUpperCase()}
                  </div>
                  {/* Info */}
                  <div style={{ fontWeight: 700, fontSize: '1.12rem', marginBottom: 2, letterSpacing: -0.2 }}>{trainee.first_name} {trainee.last_name}</div>
                  <div style={{ color: '#b0b8c1', fontSize: '1.01rem', marginBottom: 8 }}>@{trainee.username}</div>
                  <div style={{ marginBottom: 6, fontSize: 15 }}><b>Email:</b> <span style={{ color: '#e0e6ed' }}>{trainee.email}</span></div>
                  <div style={{ marginBottom: 6, fontSize: 15 }}><b>Status:</b> <span style={{ color: trainee.is_active ? '#22c55e' : '#e74c3c', fontWeight: 700 }}>{trainee.is_active ? 'Active' : 'Inactive'}</span></div>
                  <div style={{ marginBottom: 6, fontSize: 15 }}><b>Joined:</b> {new Date(trainee.created_at).toLocaleDateString()}</div>
                  {/* Spacer to push actions to bottom */}
                  <div style={{ flex: 1 }} />
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 18, width: '100%', justifyContent: 'flex-end', borderTop: '1px solid #23272f', paddingTop: 14 }}>
                    <button className="btn btn-secondary btn-sm" style={{ fontWeight: 600, borderRadius: 6, background: '#23272f', color: '#4f8cff', border: '1px solid #4f8cff', fontSize: 15 }} onClick={() => openAssignModal(trainee)}>
                      Assign
                    </button>
                    <button className="btn btn-primary btn-sm" style={{ fontWeight: 600, borderRadius: 6, background: '#4f8cff', color: '#fff', border: 'none', fontSize: 15 }} onClick={() => handleViewProgress(trainee)}>
                      Progress
                    </button>
                    <button className="btn btn-danger btn-sm" style={{ fontWeight: 600, borderRadius: 6, background: '#e74c3c', color: '#fff', border: 'none', fontSize: 15 }} onClick={() => handleDeleteTrainee(trainee)}>
                      Delete
                    </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>
      <AddTraineeModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onTraineeAdded={handleTraineeAdded} />
      <ConfirmDeleteModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDeleteTrainee} trainee={traineeToDelete} />
      <ProgressModal isOpen={showProgressModal} onClose={() => setShowProgressModal(false)} trainee={traineeToView} />
      <AssignModulesModal
        trainee={selectedTrainee}
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        allModules={modules}
        assignedModuleIds={assignedModuleIds}
        onSave={handleAssignSave}
      />
    </div>
  );
}

export default ManageTrainees; 