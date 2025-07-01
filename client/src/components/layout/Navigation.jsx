import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Navigation() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="brand">
          <h2>SmartDB</h2>
          <p>Training Platform</p>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <h6 className="nav-section-title">MAIN NAVIGATION</h6>
          
          <a 
            href="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
          >
            <i className="nav-icon">📊</i>
            <span>Dashboard</span>
          </a>
          
          {user?.role === 'trainee' && (
            <a 
              href="/trainee" 
              className={`nav-link ${isActive('/trainee') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/trainee');
              }}
            >
              <i className="nav-icon">📚</i>
              <span>My Training Modules</span>
            </a>
          )}
          
          {user?.role === 'instructor' && (
            <>
              <a 
                href="/instructor" 
                className={`nav-link ${isActive('/instructor') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/instructor');
                }}
              >
                <i className="nav-icon">👨‍🏫</i>
                <span>Instructor Panel</span>
              </a>
              <a 
                href="/modules" 
                className={`nav-link ${isActive('/modules') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/modules');
                }}
              >
                <i className="nav-icon">📝</i>
                <span>Manage Training Modules</span>
              </a>
              <a 
                href="/trainees" 
                className={`nav-link ${isActive('/trainees') ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/trainees');
                }}
              >
                <i className="nav-icon">👥</i>
                <span>Manage Trainees</span>
              </a>
            </>
          )}
        </div>
        
        <div className="nav-section">
          <h6 className="nav-section-title">ACCOUNT</h6>
          
          <a 
            href="/profile" 
            className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              navigate('/profile');
            }}
          >
            <i className="nav-icon">👤</i>
            <span>My Profile</span>
          </a>
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.username}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="nav-icon">🚪</i>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

export default Navigation; 