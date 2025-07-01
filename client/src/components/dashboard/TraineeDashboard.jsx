import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import axiosInstance from '../../utils/axios';

function TraineeDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [msgStatus, setMsgStatus] = useState('');
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchInbox();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard/trainee/');
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInbox = async () => {
    setInboxLoading(true);
    setInboxError('');
    try {
      const response = await axiosInstance.get('/messages/my/');
      setInbox(response.data);
    } catch (err) {
      setInboxError('Failed to load messages');
    } finally {
      setInboxLoading(false);
    }
  };

  const markModuleCompleted = async (assignmentId) => {
    try {
      await axios.post(`/api/trainee/complete/${assignmentId}/`);
      fetchDashboardData(); // Refresh data
    } catch (err) {
      setError('Failed to mark module as completed');
      console.error('Complete module error:', err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    setMsgStatus('');
    try {
      await axiosInstance.post('/messages/send/', { content: message });
      setMsgStatus('Message sent!');
      setMessage('');
    } catch (err) {
      setMsgStatus('Failed to send message.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading dashboard...</div>
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

  if (!dashboardData) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-title">No Dashboard Data</div>
        <div className="empty-state-text">Unable to load your dashboard information.</div>
      </div>
    );
  }

  const { progress, assigned_modules } = dashboardData;

  return (
    <div className="main-content" style={{ background: '#181b20', minHeight: '100vh', padding: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px' }}>
        <div style={{ borderBottom: '1.5px solid #23272f', padding: '1.2rem 0 1rem 0', width: '100%' }}>
          <h1 className="dashboard-title" style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Welcome back, {user?.username}!</h1>
          <p className="dashboard-subtitle" style={{ margin: '4px 0 0 2px', fontSize: 15, color: '#b0b8c1' }}>Here's your training progress overview</p>
      </div>
      {/* Progress Overview */}
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem 1.5rem 1.2rem 1.5rem', marginTop: 24, width: '100%' }}>
          <h3 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.08rem', color: '#fff', textAlign: 'left' }}>Training Progress</h3>
          <div className="stat-grid">
            <div className="stat-item">
              <div className="stat-number">{progress.total_assigned}</div>
              <div className="stat-label">Total Modules</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{progress.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{progress.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{progress.completion_percentage}%</div>
              <div className="stat-label">Completion</div>
            </div>
          </div>
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${progress.completion_percentage}%` }}
              ></div>
            </div>
            <div className="progress-text">
              {progress.completed} of {progress.total_assigned} modules completed
            </div>
          </div>
        </div>
      {/* Assigned Modules */}
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem 1.5rem 1.2rem 1.5rem', marginTop: 24, width: '100%' }}>
          <h3 style={{ margin: '0 0 12px 0', fontWeight: 700, fontSize: '1.08rem', color: '#fff', textAlign: 'left' }}>Your Training Modules</h3>
        {assigned_modules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <div className="empty-state-title">No Modules Assigned</div>
            <div className="empty-state-text">You haven't been assigned any training modules yet. Contact your instructor to get started.</div>
          </div>
        ) : (
          <div className="module-grid">
            {assigned_modules.map((assignment) => (
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
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem', marginTop: 24 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Message Instructor</h3>
          <form onSubmit={sendMessage}>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              style={{ width: '100%', minHeight: 60, borderRadius: 8, border: '1px solid #23272f', background: '#23272f', color: '#fff', marginBottom: 10, padding: 10 }}
              required
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }}>Send</button>
            {msgStatus && <div style={{ marginTop: 8, color: msgStatus === 'Message sent!' ? '#22c55e' : '#e74c3c' }}>{msgStatus}</div>}
          </form>
        </div>
        {/* Instructor Replies Section */}
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem', marginTop: 24 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Instructor Replies</h3>
          {inboxLoading ? (
            <div style={{ color: '#b0b8c1' }}>Loading messages...</div>
          ) : inboxError ? (
            <div style={{ color: '#e74c3c' }}>{inboxError}</div>
          ) : inbox.length === 0 ? (
            <div style={{ color: '#b0b8c1' }}>No replies from instructors yet.</div>
          ) : (
            inbox.map(msg => (
              <div key={msg.id} style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #23272f' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                  From: {msg.sender && msg.sender.username ? msg.sender.username : 'Instructor'}
                  <span style={{ color: '#b0b8c1', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ color: '#e0e6ed', margin: '8px 0 0 0' }}>{msg.content}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TraineeDashboard; 