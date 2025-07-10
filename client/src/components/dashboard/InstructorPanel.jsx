import React, { useState, useEffect, useRef } from 'react';
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
  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [msgStatus, setMsgStatus] = useState('');
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');
  const chatEndRef = useRef(null);

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
    fetchInbox();
  }, []);

  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatOpen, inbox]);

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

  const sendMessage = async (e) => {
    e.preventDefault();
    setMsgStatus('');
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: message,
      sender: { username: user.username },
      timestamp: new Date().toISOString(),
    };
    setInbox(prev => [...prev, tempMsg]);
    try {
      await axiosInstance.post('/messages/send/', { content: message });
      setMsgStatus('Message sent!');
      setMessage('');
      setTimeout(() => {
        fetchInbox();
      }, 1500);
    } catch (err) {
      setMsgStatus('Failed to send message.');
      setInbox(prev => prev.filter(m => m.id !== tempMsg.id));
    }
  };

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

        {/* Floating Chat Icon */}
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1000,
            background: '#23272f',
            borderRadius: '50%',
            width: 62,
            height: 62,
            boxShadow: '0 4px 24px #0004',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: '3px solid #eab308',
          }}
          onClick={() => setChatOpen(true)}
          title="Chat with User"
        >
          <span style={{ fontSize: 32, color: '#eab308' }}>💬</span>
        </div>
        {/* Chatbot Modal */}
        {chatOpen && (
          <div style={{
            position: 'fixed',
            bottom: 110,
            right: 32,
            width: 370,
            maxWidth: '95vw',
            height: 480,
            background: '#20232a',
            borderRadius: 18,
            boxShadow: '0 8px 32px #0007',
            zIndex: 1100,
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 18px',
              borderBottom: '1.5px solid #23272f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#23272f',
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
            }}>
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>User Chat</span>
              <button
                onClick={() => setChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#eab308', fontSize: 22, cursor: 'pointer', fontWeight: 700 }}
                title="Close Chat"
              >×</button>
            </div>
            {/* Chat History */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '18px 14px 0 14px', background: '#20232a' }}>
              {inboxLoading ? (
                <div style={{ color: '#b0b8c1' }}>Loading messages...</div>
              ) : inboxError ? (
                <div style={{ color: '#e74c3c' }}>{inboxError}</div>
              ) : inbox.length === 0 ? (
                <div style={{ color: '#b0b8c1' }}>No messages yet. Start the conversation!</div>
              ) : (
                inbox.map(msg => {
                  const isInstructor = msg.sender && msg.sender.username === user.username;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isInstructor ? 'flex-end' : 'flex-start',
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          background: isInstructor ? '#22c55e' : '#23272f',
                          color: isInstructor ? '#fff' : '#eab308',
                          borderRadius: 12,
                          padding: '10px 16px',
                          maxWidth: '80%',
                          fontSize: 15,
                          fontWeight: 500,
                          boxShadow: '0 2px 8px #0002',
                          position: 'relative',
                        }}
                      >
                        {msg.content}
                        <span style={{
                          position: 'absolute',
                          top: -18,
                          right: isInstructor ? 0 : 'unset',
                          left: isInstructor ? 'unset' : 0,
                          color: isInstructor ? '#22c55e' : '#eab308',
                          fontSize: 13,
                          fontWeight: 700,
                          background: 'transparent',
                          padding: '0 4px',
                        }}>
                          {isInstructor ? 'You' : (msg.sender && msg.sender.username) || 'User'}
                        </span>
                      </div>
                      <span style={{ color: '#b0b8c1', fontSize: 12, marginTop: 2 }}>
                        {new Date(msg.timestamp).toLocaleString()}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>
            {/* Message Input */}
            <form onSubmit={sendMessage} style={{ padding: '14px 16px', borderTop: '1.5px solid #23272f', background: '#23272f', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  style={{ flex: 1, borderRadius: 8, border: '1px solid #23272f', background: '#181b20', color: '#fff', padding: '10px 12px', fontSize: 15 }}
                  required
                />
                <button type="submit" className="btn btn-primary" style={{ borderRadius: 8, fontWeight: 600, fontSize: 15, padding: '10px 18px' }}>Send</button>
              </div>
              {msgStatus && <div style={{ marginTop: 8, color: msgStatus === 'Message sent!' ? '#22c55e' : '#e74c3c', fontSize: 14 }}>{msgStatus}</div>}
            </form>
          </div>
        )}
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