import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import axiosInstance from '../../utils/axios';
import { CircularProgressbarWithChildren, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { useNavigate } from 'react-router-dom';

function TraineeDashboard() {
  const { user, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [msgStatus, setMsgStatus] = useState('');
  const [inbox, setInbox] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');
  // Chatbot-style chat UI state
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const navigate = useNavigate();
  // Scroll to bottom when chat opens or messages update
  useEffect(() => {
    if (chatOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatOpen, inbox]);

  useEffect(() => {
    fetchDashboardData();
    fetchInbox();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
      setInbox(prev => {
        // Keep optimistic messages (id starts with 'temp') that are not in backend yet
        const backendMsgs = response.data;
        const optimisticMsgs = prev.filter(m => m.id && String(m.id).startsWith('temp'));
        // Only keep optimistic messages not present in backend (by content and timestamp)
        const merged = [
          ...backendMsgs,
          ...optimisticMsgs.filter(tempMsg =>
            !backendMsgs.some(
              m => m.content === tempMsg.content && Math.abs(new Date(m.timestamp) - new Date(tempMsg.timestamp)) < 60000 // within 1 min
            )
          )
        ];
        return merged;
      });
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
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: message,
      sender: { username: user.username },
      timestamp: new Date().toISOString(),
    };
    setInbox(prev => [...prev, tempMsg]); // Optimistically add message
    try {
      await axiosInstance.post('/messages/send/', { content: message });
      setMsgStatus('Message sent!');
      setMessage('');
      setTimeout(() => {
        fetchInbox(); // Refresh with real data after delay
      }, 1500);
    } catch (err) {
      setMsgStatus('Failed to send message.');
      // Optionally remove the temp message if failed
      setInbox(prev => prev.filter(m => m.id !== tempMsg.id));
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
  // Gradient for completed arc
  const gradientId = 'progress-gradient';
  const completedColor = 'url(#' + gradientId + ')';
  const trailColor = '#2d323b';
  // Minimal legend
  const legend = [
    { label: 'Completed', value: progress.completed, color: '#22c55e' },
    { label: 'Pending', value: progress.pending, color: '#eab308' },
    { label: 'Total', value: progress.total_assigned, color: '#b0b8c1' },
  ];

  return (
    <div className="main-content" style={{ background: '#181b20', minHeight: '100vh', padding: 0 }}>
      {/* Mobile Topbar and Menu */}
      {isMobile && (
        <>
          <div className="trainee-topbar-mobile" style={{position:'fixed',top:0,left:0,right:0,width:'100vw',zIndex:2000,background:'#23272f',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0.7rem 1rem',boxShadow:'0 2px 8px #0003'}}>
            <div className="trainee-topbar-title" style={{fontWeight:700,fontSize:'1.2rem'}}>SmartDB</div>
            <button className="trainee-menu-btn" style={{background:'none',border:'none',color:'#eab308',fontSize:'2rem',cursor:'pointer'}} onClick={()=>setMenuOpen(true)}>
              <span className="trainee-menu-icon">☰</span>
            </button>
          </div>
          {menuOpen && (
            <div className="trainee-mobile-menu" style={{position:'fixed',top:0,right:0,left:0,width:'100vw',height:'100vh',background:'rgba(24,27,32,0.85)',zIndex:2100,display:'flex',justifyContent:'flex-end'}} onClick={()=>setMenuOpen(false)}>
              <div className="trainee-mobile-menu-content" style={{width:'80vw',maxWidth:320,height:'100vh',background:'#23272f',boxShadow:'-2px 0 16px #0007',display:'flex',flexDirection:'column',padding:'1.2rem 1rem'}} onClick={e=>e.stopPropagation()}>
                <div className="trainee-mobile-menu-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1.2rem',fontWeight:700,color:'#fff'}}>
                  <span>Menu</span>
                  <button className="trainee-menu-close" style={{background:'none',border:'none',color:'#eab308',fontSize:'2rem',cursor:'pointer'}} onClick={()=>setMenuOpen(false)}>×</button>
                </div>
                <nav className="trainee-mobile-nav" style={{display:'flex',flexDirection:'column',gap:'1.2rem',alignItems:'flex-start'}}>
                  <a href="/trainee" style={{color:'#fff',textDecoration:'none',fontSize:'1.1rem',fontWeight:500}} onClick={e=>{e.preventDefault();navigate('/trainee');setMenuOpen(false);}}>Dashboard</a>
                  <a href="/trainee" style={{color:'#fff',textDecoration:'none',fontSize:'1.1rem',fontWeight:500}} onClick={e=>{e.preventDefault();navigate('/trainee');setMenuOpen(false);}}>My Training Modules</a>
                  <a href="/profile" style={{color:'#fff',textDecoration:'none',fontSize:'1.1rem',fontWeight:500}} onClick={e=>{e.preventDefault();navigate('/profile');setMenuOpen(false);}}>My Profile</a>
                  <button className="trainee-mobile-logout" style={{background:'#eab308',color:'#23272f',border:'none',borderRadius:6,padding:'0.7rem 0',fontSize:'1.1rem',fontWeight:600,marginTop:'1.5rem',cursor:'pointer',width:'100%'}} onClick={async()=>{await logout();navigate('/login');}}>Logout</button>
                </nav>
              </div>
            </div>
          )}
        </>
      )}
      <div style={{ maxWidth: isMobile ? '100vw' : 1200, margin: '0 auto', padding: isMobile ? '70px 8px 0 8px' : '0 8px', boxSizing: 'border-box', overflowX: isMobile ? 'hidden' : undefined }}>
        <div style={{ borderBottom: '1.5px solid #23272f', padding: isMobile ? '1.2rem 0 0.7rem 0' : '1.2rem 0 1rem 0', width: '100%' }}>
          <h1 className="dashboard-title" style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Welcome back, {user?.username}!</h1>
          <p className="dashboard-subtitle" style={{ margin: isMobile ? '8px 0 0 2px' : '4px 0 0 2px', fontSize: isMobile ? 13 : 15, color: '#b0b8c1' }}>Here's your training progress overview</p>
        </div>
        {/* Progress Overview */}
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: isMobile ? '1.2rem 0.7rem' : '2rem 1.5rem 2rem 1.5rem', marginTop: 24, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 18px 0', fontWeight: 700, fontSize: isMobile ? '1rem' : '1.2rem', color: '#fff', textAlign: 'center' }}>Training Progress</h3>
          <div style={{ width: isMobile ? 140 : 220, height: isMobile ? 140 : 220, position: 'relative', marginBottom: isMobile ? 20 : 40 }}>
            <svg style={{ height: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
            </svg>
            <CircularProgressbarWithChildren
              value={progress.completion_percentage}
              strokeWidth={18}
              styles={buildStyles({
                pathColor: completedColor,
                trailColor: trailColor,
                strokeLinecap: 'round',
                pathTransitionDuration: 1.2,
              })}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 22 : 34, lineHeight: 1 }}>{progress.completion_percentage}%</div>
                <div style={{ color: '#b0b8c1', fontSize: isMobile ? 11 : 15, marginTop: 4, letterSpacing: 0.5 }}>Completed</div>
              </div>
            </CircularProgressbarWithChildren>
          </div>
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: isMobile ? 12 : 32, marginTop: 0, width: '100%' }}>
            <div style={{ background: '#23272f', borderRadius: 999, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px #0001' }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#22c55e' }}></span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 19 }}>{progress.completed}</span>
              <span style={{ color: '#b0b8c1', fontSize: 16, marginLeft: 4, fontWeight: 500 }}>Modules Completed</span>
            </div>
            <div style={{ background: '#23272f', borderRadius: 999, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px #0001' }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#eab308' }}></span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 19 }}>{progress.pending}</span>
              <span style={{ color: '#b0b8c1', fontSize: 16, marginLeft: 4, fontWeight: 500 }}>Modules Pending</span>
            </div>
            <div style={{ background: '#23272f', borderRadius: 999, padding: '12px 32px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 8px #0001' }}>
              <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', background: '#b0b8c1' }}></span>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 19 }}>{progress.total_assigned}</span>
              <span style={{ color: '#b0b8c1', fontSize: 16, marginLeft: 4, fontWeight: 500 }}>Total Modules Assigned</span>
            </div>
          </div>
        </div>
        {/* Pending Modules Grid - modern card layout */}
        <div style={{ background: '#20232a', borderRadius: 14, padding: isMobile ? '0.7rem 0.7rem' : '1.2rem', marginTop: 32, width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: isMobile ? 18 : 22, color: '#eab308' }}>⏳</span>
            <h3 style={{ color: '#fff', fontWeight: 700, fontSize: isMobile ? 16 : 20, margin: 0 }}>Pending Modules</h3>
          </div>
          {assigned_modules.filter(m => !m.is_completed).length === 0 ? (
            <div style={{ color: '#b0b8c1', fontSize: isMobile ? 13 : 16 }}>No pending modules. Great job!</div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: isMobile ? '12px' : '22px',
              marginTop: 8,
              paddingLeft: isMobile ? 2 : 0,
              paddingRight: isMobile ? 2 : 0,
              boxSizing: 'border-box',
            }}>
              {assigned_modules.filter(m => !m.is_completed).map(m => (
                <div key={m.id} style={{
                  background: '#181b20',
                  borderRadius: 12,
                  boxShadow: '0 2px 12px #0002',
                  padding: '22px 20px 18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  minHeight: 120
                }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{m.module.title}</div>
                  <div style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 18 }}>Assigned: {new Date(m.assigned_at).toLocaleDateString()}</div>
                  <button
                    className="btn btn-primary"
                    style={{ padding: '8px 20px', fontSize: 15, borderRadius: 7, fontWeight: 600, alignSelf: 'flex-end', marginTop: 'auto' }}
                    onClick={() => markModuleCompleted(m.id)}
                  >
                    Mark as Completed
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Floating Chat Icon */}
        <div
          style={{
            position: 'fixed',
            bottom: isMobile ? 16 : 32,
            right: isMobile ? 16 : 32,
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
          title="Chat with Instructor"
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
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>Instructor Chat</span>
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
                  const isTrainee = msg.sender && msg.sender.username === user.username;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isTrainee ? 'flex-end' : 'flex-start',
                        marginBottom: 18,
                      }}
                    >
                      <div
                        style={{
                          background: isTrainee ? '#22c55e' : '#23272f',
                          color: isTrainee ? '#fff' : '#eab308',
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
                          right: isTrainee ? 0 : 'unset',
                          left: isTrainee ? 'unset' : 0,
                          color: isTrainee ? '#22c55e' : '#eab308',
                          fontSize: 13,
                          fontWeight: 700,
                          background: 'transparent',
                          padding: '0 4px',
                        }}>
                          {isTrainee ? 'You' : (msg.sender && msg.sender.username) || 'Instructor'}
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
    </div>
  );
}

export default TraineeDashboard; 