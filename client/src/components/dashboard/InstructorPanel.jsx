import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaUserCheck, FaChartBar } from 'react-icons/fa';
import CreateModuleModal from './CreateModuleModal';

function InstructorPanel() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState({});
  const [replyStatus, setReplyStatus] = useState({});

  const fetchInstructorStats = async () => {
    try {
      const response = await axiosInstance.get('/dashboard/instructor/');
      setStats(response.data);
      if (response.data && response.data.recent_activity) {
        setRecentActivity(response.data.recent_activity);
      }
    } catch (err) {
      setError('Failed to load instructor panel data');
      console.error("Stats fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructorStats();
  }, []);

  useEffect(() => {
    // Fetch messages for instructor inbox
    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get('/messages/inbox/');
        setMessages(res.data);
      } catch (err) {
        setMessages([]);
      }
    };
    fetchMessages();
  }, []);

  const handleModuleCreated = (newModule) => {
    // When a module is created, refresh the stats to show the new count
    // and add a success message to recent activity.
    fetchInstructorStats();
    setRecentActivity(prev => [{
      icon: '✅',
      text: `New module "${newModule.title}" created.`,
      time: 'Just now'
    }, ...prev]);
  };

  const handleReplyChange = (id, value) => {
    setReplyText(prev => ({ ...prev, [id]: value }));
  };

  const sendReply = async (id) => {
    setReplyStatus(prev => ({ ...prev, [id]: '' }));
    try {
      await axiosInstance.post(`/messages/${id}/reply/`, { content: replyText[id] });
      setReplyStatus(prev => ({ ...prev, [id]: 'Reply sent!' }));
      setReplyText(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      setReplyStatus(prev => ({ ...prev, [id]: 'Failed to send reply.' }));
    }
  };

  if (loading) return <div className="loading-container"><div>Loading...</div></div>;
  
  return (
    <div className="main-content" style={{ background: '#181b20', minHeight: '100vh', padding: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px' }}>
        <div style={{ borderBottom: '1.5px solid #23272f', padding: '1.2rem 0 1rem 0', width: '100%' }}>
          <h1 className="dashboard-title" style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Instructor Panel</h1>
          <p className="dashboard-subtitle" style={{ margin: '4px 0 0 2px', fontSize: 15, color: '#b0b8c1' }}>Manage your training program and modules</p>
        </div>
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem 1.5rem 1.2rem 1.5rem', marginTop: 24, width: '100%' }}>
        {error && <div className="error-message" style={{ margin: '0 1.5rem 1.5rem 1.5rem'}}>{error}</div>}

        {/* Card 1: Quick Actions */}
        <div className="dashboard-card">
          <h3 className="card-title">Quick Actions</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
              console.log('CREATE MODULE BUTTON CLICKED: Setting isCreateModalOpen to true.');
              setIsCreateModalOpen(true);
            }}>
              <FaPlus style={{ marginRight: '8px' }} /> Create Module
            </button>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/trainees')}>
              <FaUserCheck style={{ marginRight: '8px' }} /> Assign Trainees
            </button>
            <button className="btn btn-success" style={{ flex: 1 }} onClick={() => navigate('/modules')}>
              <FaChartBar style={{ marginRight: '8px' }} /> View/Manage Modules
            </button>
          </div>
        </div>

        {/* Card 2: Program Overview */}
        <div className="dashboard-card">
          <h3 className="card-title">Program Overview</h3>
          <div className="overview-stats">
            <div className="stat-item">
              <div className="stat-number">{stats?.total_trainees || 0}</div>
              <div className="stat-label">Total Trainees</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats?.total_modules || 0}</div>
              <div className="stat-label">Total Modules</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats?.avg_completion_rate || '0'}%</div>
              <div className="stat-label">Avg Completion</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{stats?.active_sessions || '0'}</div>
              <div className="stat-label">Active Sessions</div>
            </div>
          </div>
        </div>

        {/* Card 3: Recent Activity */}
        <div className="dashboard-card">
          <h3 className="card-title">Recent Activity</h3>
          {recentActivity.length > 0 ? (
            <div className="activity-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {recentActivity.map((activity, idx) => (
                <div className="activity-item" key={idx}>
                  <div className="activity-icon">{activity.icon || '📝'}</div>
                  <div className="activity-content">
                    <div className="activity-text">{activity.text}</div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">No Recent Activity</div>
              <div className="empty-state-text">New activities from your program will appear here.</div>
            </div>
            )}
          </div>
        </div>

        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '1.5rem', marginTop: 24 }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Inbox</h3>
          {messages.length === 0 ? (
            <div style={{ color: '#b0b8c1' }}>No messages yet.</div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #23272f' }}>
                <div style={{ color: '#fff', fontWeight: 600, fontSize: 16 }}>
                  From: {msg.sender && msg.sender.username ? msg.sender.username : 'Trainee'}
                  <span style={{ color: '#b0b8c1', fontWeight: 400, fontSize: 13, marginLeft: 8 }}>{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div style={{ color: '#e0e6ed', margin: '8px 0 12px 0' }}>{msg.content}</div>
                <form onSubmit={e => { e.preventDefault(); sendReply(msg.id); }}>
                  <textarea
                    value={replyText[msg.id] || ''}
                    onChange={e => handleReplyChange(msg.id, e.target.value)}
                    placeholder="Type your reply..."
                    style={{ width: '100%', minHeight: 40, borderRadius: 8, border: '1px solid #23272f', background: '#23272f', color: '#fff', marginBottom: 8, padding: 8 }}
                    required
                  />
                  <button type="submit" className="btn btn-primary" style={{ marginTop: 4 }}>Reply</button>
                  {replyStatus[msg.id] && <div style={{ marginTop: 6, color: replyStatus[msg.id] === 'Reply sent!' ? '#22c55e' : '#e74c3c' }}>{replyStatus[msg.id]}</div>}
                </form>
              </div>
            ))
          )}
        </div>
      </div>

      <CreateModuleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onModuleCreated={handleModuleCreated}
      />
    </div>
  );
}

export default InstructorPanel; 