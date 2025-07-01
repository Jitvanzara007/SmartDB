import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';

console.log('*** MANAGE TRAINING MODULES COMPONENT RENDERED ***');

function ManageTrainingModules() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentModule, setCurrentModule] = useState(null);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_minutes: '',
    is_active: true
  });
  const [assignSuccess, setAssignSuccess] = useState(false);
  const [triggerAssign, setTriggerAssign] = useState(false);

  // This effect runs only on the initial mount to fetch data
  useEffect(() => {
    console.log('=== Initial useEffect running ===');
    fetchModules();
    fetchTrainees();
  }, []);

  useEffect(() => {
    if (triggerAssign) {
      handleAssignModule();
      setTriggerAssign(false);
    }
  }, [triggerAssign]);

  const fetchModules = async () => {
    try {
      const response = await axiosInstance.get('/modules/');
      const modulesData = response.data.results || response.data;
      if (Array.isArray(modulesData)) {
          setModules(modulesData);
      } else {
          console.error("Received non-array data for modules:", response.data);
          setModules([]);
          setError('Received an unexpected data format for training modules.');
      }
    } catch (err) {
      setError('Failed to load training modules');
      console.error('Modules error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainees = async () => {
    try {
      console.log('Fetching trainees...');
      console.log('Current token:', localStorage.getItem('access_token'));
      const response = await axiosInstance.get('/trainees/');
      console.log('Trainees response:', response.data);
      setTrainees(response.data);
    } catch (err) {
      console.error('Failed to load trainees:', err);
      console.error('Error response:', err.response);
      setError('Failed to load trainees. Please try again.');
    }
  };

  const handleEditModule = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const response = await axiosInstance.put(`/modules/${currentModule.id}/`, {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        duration_minutes: parseInt(formData.duration_minutes),
        is_active: formData.is_active
      });
      
      if (response.data) {
        setModules(prevModules => 
          prevModules.map(m => m.id === currentModule.id ? response.data : m)
        );
        setShowEditModal(false);
      }
    } catch (err) {
      console.error('Edit module error:', err);
      setError(err.response?.data?.error || 'Failed to update module. Please try again.');
    }
  };

  const handleAssignModule = async () => {
    console.log('=== handleAssignModule called ===');
    console.log('currentModule:', currentModule);
    console.log('selectedTrainees:', selectedTrainees);
    
    if (!currentModule || !currentModule.id) {
      setError('No module selected for assignment.');
      return;
    }
    
    if (selectedTrainees.length === 0) {
      setError('Please select at least one trainee to assign.');
      return;
    }
    
    console.log('Assign POST handler called', selectedTrainees, currentModule);
    try {
      setError('');
      setAssignmentLoading(true);
      console.log('Assigning trainees:', selectedTrainees, 'to module:', currentModule.id);
      const requestData = { trainee_ids: selectedTrainees };
      console.log('Request data:', requestData);
      console.log('Making POST request to:', `/modules/${currentModule.id}/assign/`);
      console.log('Request headers:', axiosInstance.defaults.headers);
      console.log('Request data:', requestData);
      
      const res = await axiosInstance.post(`/modules/${currentModule.id}/assign/`, requestData);
      console.log('Assign response:', res);
      console.log('Assign response data:', res.data);
      
      setAssignSuccess(true);
      await fetchModules(); // Refresh the module list
      setTimeout(() => {
        setShowAssignModal(false);
        setSelectedTrainees([]);
        setAssignSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Assign module error:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        config: err.config
      });
      
      if (err.response) {
        console.error('Error response data:', err.response.data);
        const errorMessage = err.response.data.error || 'Failed to assign trainees. Please try again.';
        setError(errorMessage);
      } else {
        setError('Failed to assign module. Please check your connection and try again.');
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  const openAssignModal = async (module) => {
    console.log("Assign button clicked for module:", module);
    setCurrentModule(module);
    setShowAssignModal(true);
    setAssignmentLoading(true);
    setAssignSuccess(false);
    setError('');
    try {
      // Fetch all trainees
      await fetchTrainees();
      // Fetch current assignments for this module
      const response = await axiosInstance.get(`/assignments/?module_id=${module.id}`);
      console.log('Assignments response:', response.data);
      
      // Handle paginated response
      let assignments;
      if (response.data && response.data.results) {
        // Paginated response
        assignments = response.data.results;
      } else if (Array.isArray(response.data)) {
        // Direct array response
        assignments = response.data;
      } else {
        // Fallback
        assignments = [];
      }
      
      console.log('Processed assignments:', assignments);
      const assignedTraineeIds = assignments.map(a => a.trainee.id);
      console.log('Assigned trainee IDs:', assignedTraineeIds);
      setSelectedTrainees(assignedTraineeIds);
    } catch (err) {
      console.error('Failed to load assigned trainees:', err);
      setError('Failed to load assigned trainees. Please try again.');
    } finally {
      setAssignmentLoading(false);
    }
  };

  const handleTraineeSelection = (traineeId) => {
    console.log('handleTraineeSelection called with traineeId:', traineeId);
    setSelectedTrainees(prev => {
      const newSelection = prev.includes(traineeId) 
        ? prev.filter(id => id !== traineeId)
        : [...prev, traineeId];
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleDeleteModule = async (moduleId) => {
    console.log("Delete button clicked for moduleId:", moduleId);
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) return;
    setLoading(true);
    setError('');
    try {
      await axiosInstance.delete(`/modules/${moduleId}/`);
      setModules(prevModules => prevModules.filter(m => m.id !== moduleId));
    } catch (err) {
      setError('Failed to delete module.');
      console.error('Delete module error:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading training modules...</div>
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

  return (
    <div className="main-content" style={{ minHeight: '100vh', background: '#181b20', padding: 0 }}>
      <div className="dashboard-header" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px', borderBottom: '1.5px solid #23272f', paddingTop: '1.2rem', paddingBottom: '1rem', width: '100%' }}>
        <h1 className="dashboard-title" style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Manage Training Modules</h1>
        <p className="dashboard-subtitle" style={{ margin: '4px 0 0 2px', fontSize: 15, color: '#b0b8c1' }}>Create, edit, and manage your training modules</p>
      </div>
      {/* Module Stats */}
      <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem 1.5rem 1.2rem 1.5rem', marginTop: 24, width: '100%', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.08rem', color: '#fff', textAlign: 'left' }}>Module Statistics</h3>
        <div className="stat-grid" style={{ display: 'flex', gap: '2.5rem', justifyContent: 'flex-start' }}>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '2.2rem', fontWeight: 700 }}>{modules.length}</div>
            <div className="stat-label" style={{ color: '#888' }}>Total Modules</div>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '2.2rem', fontWeight: 700 }}>{modules.filter(m => m.is_active).length}</div>
            <div className="stat-label" style={{ color: '#888' }}>Active Modules</div>
          </div>
          <div className="stat-item" style={{ textAlign: 'center' }}>
            <div className="stat-number" style={{ fontSize: '2.2rem', fontWeight: 700 }}>{modules.filter(m => !m.is_active).length}</div>
            <div className="stat-label" style={{ color: '#888' }}>Inactive Modules</div>
          </div>
        </div>
      </div>
      {/* Module List */}
      <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem 1.5rem 1.2rem 1.5rem', marginTop: 24, width: '100%', maxWidth: 1200, marginLeft: 'auto', marginRight: 'auto' }}>
        <div className="card-header" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1.08rem', color: '#fff', textAlign: 'left' }}>Training Modules</h3>
        </div>
        <div className="module-grid">
          {modules.length === 0 && !loading ? (
            <div className="empty-state" style={{ textAlign: 'center', color: '#b0b8c1', marginTop: 40 }}>
              <div className="empty-state-icon" style={{ fontSize: 36, marginBottom: 8 }}>📝</div>
              <div className="empty-state-title" style={{ fontSize: 18, fontWeight: 700 }}>No Training Modules</div>
              <div className="empty-state-text" style={{ fontSize: 14 }}>You haven't created any training modules yet.</div>
            </div>
          ) : (
            modules.map((module) => (
              <div key={module.id} className="module-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#23272f', color: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #0003', padding: '1.5rem 1.5rem', margin: 0, width: '100%', maxWidth: 420, minWidth: 0, alignItems: 'flex-start', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'pointer', position: 'relative', border: '1px solid #23272f', outline: 'none', overflow: 'hidden', justifyContent: 'space-between' }}>
                <div>
                  <div className="module-header">
                    <h4 className="module-title">{module.title}</h4>
                    <span className={`module-status ${module.is_active ? 'status-completed' : 'status-pending'}`}>{module.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <p className="module-description">{module.description}</p>
                  <div className="module-details">
                    <div className="detail-item">
                      <span className="detail-label">Duration:</span>
                      <span className="detail-value">{module.duration_minutes} minutes</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{new Date(module.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Last Updated:</span>
                      <span className="detail-value">{new Date(module.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="module-actions" style={{ display: 'flex', gap: 12, marginTop: 18, width: '100%', justifyContent: 'flex-end', borderTop: '1px solid #23272f', paddingTop: 14 }}>
                  <button className="btn btn-primary" onClick={() => navigate(`/modules/${module.id}/edit`)}>Edit Module</button>
                  <button className="btn btn-success" onClick={() => openAssignModal(module)}>Assign to Trainees</button>
                  <button className="btn btn-danger" style={{ background: '#c0392b', color: '#fff' }} onClick={() => handleDeleteModule(module.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      {/* Assign Module Modal */}
      {showAssignModal && currentModule && (
        <div className="modal" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#23272f', color: '#fff', borderRadius: 12, minWidth: 320, maxWidth: 420, width: '90vw', boxShadow: '0 8px 32px #000a', zIndex: 10000, padding: '1.5rem 1.2rem 1.2rem 1.2rem', position: 'relative', maxHeight: '80vh', minHeight: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
            <h2 style={{ marginBottom: 12, fontSize: 20, fontWeight: 700, color: '#fff' }}>Assign Module: {currentModule.title}</h2>
            <p style={{ color: '#b0b8c1', marginBottom: 12, fontSize: 15 }}>Select trainees to assign this module to. Already assigned trainees are pre-selected.</p>
            {error && (
              <div className="error-message" style={{ color: '#ffb4b4', background: 'rgba(255,0,0,0.08)', border: '1px solid #ffb4b4', borderRadius: 6, padding: 8, marginBottom: 10 }}>{error}</div>
            )}
            {assignSuccess && (
              <div className="success-message" style={{ color: '#6ee7b7', background: 'rgba(34,197,94,0.08)', border: '1px solid #6ee7b7', borderRadius: 6, padding: 8, marginBottom: 10 }}>✅ Trainees assigned successfully!</div>
            )}
            {assignmentLoading ? (
              <div className="loading-container" style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner"></div>
                <div>Loading trainees...</div>
              </div>
            ) : (
              <div className="trainee-list" style={{ maxHeight: 180, overflowY: 'auto', background: '#181b20', borderRadius: 8, border: '1px solid #23272f', marginBottom: 12 }}>
                {trainees.length > 0 ? (
                  trainees.map(trainee => (
                    <div key={trainee.id} className="trainee-item checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0.7rem', borderBottom: '1px solid #23272f', color: '#fff' }}>
                      <input
                        type="checkbox"
                        checked={selectedTrainees.includes(trainee.id)}
                        onChange={() => handleTraineeSelection(trainee.id)}
                        id={`trainee-checkbox-${trainee.id}`}
                        style={{ accentColor: '#4f8cff', width: 18, height: 18 }}
                      />
                      <span className="trainee-name" style={{ fontWeight: 500, flex: 1 }}>{trainee.first_name || ''} {trainee.last_name || ''} <span style={{ color: '#b0b8c1', fontSize: '0.95em' }}>({trainee.username})</span></span>
                      <span className="trainee-email" style={{ color: '#b0b8c1', fontSize: '0.95em' }}>{trainee.email}</span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state" style={{ textAlign: 'center', padding: '1.2rem', color: '#b0b8c1' }}>
                    <p>No trainees available</p>
                  </div>
                )}
              </div>
            )}
            <div className="modal-actions" style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-secondary" style={{ fontWeight: 600, borderRadius: 6, background: '#23272f', color: '#4f8cff', border: '1px solid #4f8cff', fontSize: 15 }} onClick={() => { setShowAssignModal(false); setSelectedTrainees([]); setError(''); setAssignSuccess(false); }} disabled={assignmentLoading}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ fontWeight: 600, borderRadius: 6, background: '#4f8cff', color: '#fff', border: 'none', fontSize: 15 }} onClick={() => setTriggerAssign(true)} disabled={assignmentLoading || selectedTrainees.length === 0}>
                {assignmentLoading ? 'Assigning...' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTrainingModules; 