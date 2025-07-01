import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function TraineeModules() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axios.get('/api/trainee/modules/');
      setModules(response.data);
    } catch (err) {
      setError('Failed to load modules');
      console.error('Modules error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markModuleCompleted = async (assignmentId) => {
    try {
      await axios.post(`/api/trainee/complete/${assignmentId}/`);
      fetchModules(); // Refresh data
    } catch (err) {
      setError('Failed to mark module as completed');
      console.error('Complete module error:', err);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading your training modules...</div>
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

  // Calculate module statistics
  const totalModules = modules.length;
  const completedModules = modules.filter(m => m.is_completed).length;
  const pendingModules = totalModules - completedModules;
  const completionPercentage = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  return (
    <div className="main-content">
      <div className="dashboard-header">
        <h1 className="dashboard-title">My Training Modules</h1>
        <p className="dashboard-subtitle">Complete your assigned training modules to track your progress</p>
      </div>
      
      {/* Module Progress Overview */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3 className="card-title">Module Progress</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-number">{totalModules}</div>
              <div className="stat-label">Total Modules</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{completedModules}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{pendingModules}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{completionPercentage}%</div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {completedModules} of {totalModules} modules completed
            </div>
          </div>
        </div>
      </div>

      {/* Module List */}
      <div className="dashboard-card">
        <h3 className="card-title">Your Training Modules</h3>
        {modules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">No Modules Assigned</div>
            <div className="empty-state-text">You haven't been assigned any training modules yet. Contact your instructor to get started with your training program.</div>
          </div>
        ) : (
          <div className="module-grid">
            {modules.map((assignment) => (
              <div key={assignment.id} className="module-card">
                <div className="module-header">
                  <h4 className="module-title">{assignment.module.title}</h4>
                  <span className={`module-status ${assignment.is_completed ? 'status-completed' : 'status-pending'}`}>
                    {assignment.is_completed ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                
                <p className="module-description">
                  {assignment.module.description}
                </p>
                
                <div className="module-details">
                  <div className="detail-item">
                    <span className="detail-label">Duration:</span>
                    <span className="detail-value">{assignment.module.duration_minutes} minutes</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Assigned:</span>
                    <span className="detail-value">
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </span>
                  </div>
                  {assignment.is_completed && (
                    <div className="detail-item">
                      <span className="detail-label">Completed:</span>
                      <span className="detail-value">
                        {new Date(assignment.completed_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {!assignment.is_completed && (
                  <div className="module-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => markModuleCompleted(assignment.id)}
                    >
                      Mark as Complete
                    </button>
                    <button className="btn btn-secondary">
                      View Content
                    </button>
                  </div>
                )}
                
                {assignment.is_completed && (
                  <div className="module-actions">
                    <button className="btn btn-success">
                      Review Module
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TraineeModules; 