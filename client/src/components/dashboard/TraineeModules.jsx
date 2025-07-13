import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';

function TraineeModules() {
  const { user } = useAuth();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchModules();
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchModules = async () => {
    try {
      const response = await axiosInstance.get('trainee/modules/');
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
      await axiosInstance.post(`trainee/complete/${assignmentId}/`);
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
    <div className="main-content pt-2" style={{ background: '#181b20', minHeight: '100vh', padding: isMobile ? '0 6px' : '0 26px', boxSizing: 'border-box', overflowX: isMobile ? 'hidden' : undefined }}>
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
                  <button className="trainee-mobile-logout" style={{background:'#eab308',color:'#23272f',border:'none',borderRadius:6,padding:'0.7rem 0',fontSize:'1.1rem',fontWeight:600,marginTop:'1.5rem',cursor:'pointer',width:'100%'}} onClick={async()=>{window.localStorage.clear();navigate('/login');}}>Logout</button>
                </nav>
              </div>
            </div>
          )}
        </>
      )}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '70px 2px 0 2px' : '0 8px', boxSizing: 'border-box' }}>
        <div className="dashboard-header" style={{ borderBottom: '1.5px solid #23272f', padding: isMobile ? '1rem 0 0.7rem 0' : '1.2rem 0 1rem 0', width: '100%' }}>
          <h1 className="dashboard-title" style={{ margin: 0, fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>My Training Modules</h1>
          <p className="dashboard-subtitle" style={{ margin: isMobile ? '8px 0 0 2px' : '4px 0 0 2px', fontSize: isMobile ? 13 : 15, color: '#b0b8c1' }}>Complete your assigned training modules to track your progress</p>
        </div>
        
        {/* Module Progress Overview */}
        <div style={{ background: '#20232a', borderRadius: 14, color: '#fff', boxShadow: '0 4px 24px #0002', padding: isMobile ? '1.2rem 0.7rem' : '2rem 1.5rem 2rem 1.5rem', marginTop: 24, width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 18px 0', fontWeight: 700, fontSize: isMobile ? '1rem' : '1.2rem', color: '#fff', textAlign: 'left' }}>Module Progress</h3>
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 18, marginBottom: isMobile ? 10 : 18 }}>
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
          <div className="progress-container" style={{ marginTop: isMobile ? 10 : 18 }}>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="progress-text" style={{ fontSize: isMobile ? 12 : 15 }}>
              {completedModules} of {totalModules} modules completed
            </div>
          </div>
        </div>

        {/* Module List */}
        <div style={{ background: '#20232a', borderRadius: 14, color: '#fff', boxShadow: '0 4px 24px #0002', padding: isMobile ? '1.2rem 0.7rem' : '2rem 1.5rem 2rem 1.5rem', marginTop: isMobile ? 18 : 32, width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 18px 0', fontWeight: 700, fontSize: isMobile ? 15 : '1.2rem', color: '#fff', textAlign: 'left' }}>Your Training Modules</h3>
          {modules.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📚</div>
              <div className="empty-state-title">No Modules Assigned</div>
              <div className="empty-state-text">You haven't been assigned any training modules yet. Contact your instructor to get started with your training program.</div>
            </div>
          ) : (
            <div className="module-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(340px, 1fr))', gap: isMobile ? 10 : 18 }}>
              {modules.map((assignment) => (
                <div key={assignment.id} className="module-card" style={{ background: '#23272f', borderRadius: 12, color: '#fff', marginBottom: isMobile ? 12 : 18, padding: isMobile ? '1rem 0.7rem' : '1.2rem 1rem' }}>
                  <div className="module-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 className="module-title" style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{assignment.module.title}</h4>
                    <span className={`module-status ${assignment.is_completed ? 'status-completed' : 'status-pending'}`} style={{ fontWeight: 600, fontSize: 14 }}>
                      {assignment.is_completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>
                  <p className="module-description" style={{ color: '#b0b8c1', fontSize: 15, margin: '10px 0 14px 0' }}>
                    {assignment.module.description}
                  </p>
                  <div className="module-details" style={{ color: '#b0b8c1', fontSize: 14, marginBottom: 10 }}>
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
                    <div className="module-actions" style={{ marginTop: 10 }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => markModuleCompleted(assignment.id)}
                        style={{ marginRight: 10 }}
                      >
                        Mark as Complete
                      </button>
                      <button className="btn btn-secondary">
                        View Content
                      </button>
                    </div>
                  )}
                  {assignment.is_completed && (
                    <div className="module-actions" style={{ marginTop: 10 }}>
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
    </div>
  );
}

export default TraineeModules; 