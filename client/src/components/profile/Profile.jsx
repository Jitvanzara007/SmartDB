import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

function Profile() {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile form state
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
    email: user?.email || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Password form state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);
    const result = await updateProfile(profileData);
    if (result.success) {
      setProfileSuccess('Profile updated successfully!');
    } else {
      setProfileError(result.error);
    }
    setProfileLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPasswordError('New passwords do not match');
    }
    if (passwordData.newPassword.length < 6) {
      return setPasswordError('New password must be at least 6 characters');
    }
    setPasswordLoading(true);
    const result = await changePassword(passwordData.oldPassword, passwordData.newPassword);
    if (result.success) {
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } else {
      setPasswordError(result.error);
    }
    setPasswordLoading(false);
  };

  return (
    <div className="main-content" style={{ minHeight: '100vh', background: '#181b20', padding: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px' }}>
        <div style={{ borderBottom: '1.5px solid #23272f', margin: 0, padding: '1.2rem 0 1rem 0', width: '100%' }}>
          <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 28, letterSpacing: -1, textAlign: 'left', margin: 0 }}>Profile Settings</h2>
        </div>
        <div style={{ width: '100%', background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '2rem', marginBottom: 32, display: 'block' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Profile Information</h3>
          {profileError && <div style={{ color: '#e74c3c', background: '#2d2323', border: '1px solid #e74c3c', borderRadius: 6, padding: '0.7rem 1rem', marginBottom: 10 }}>{profileError}</div>}
          {profileSuccess && <div style={{ color: '#22c55e', background: '#1e2d23', border: '1px solid #22c55e', borderRadius: 6, padding: '0.7rem 1rem', marginBottom: 10 }}>{profileSuccess}</div>}
          <form onSubmit={handleProfileSubmit} autoComplete="off">
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>First Name</label>
              <input
                type="text"
                name="first_name"
                value={profileData.first_name}
                onChange={handleProfileChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Last Name</label>
              <input
                type="text"
                name="last_name"
                value={profileData.last_name}
                onChange={handleProfileChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Username</label>
              <input
                type="text"
                name="username"
                value={profileData.username}
                onChange={handleProfileChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Email</label>
              <input
                type="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Role</label>
              <input
                type="text"
                value={user?.role}
                disabled
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#aaa', fontSize: 16 }}
              />
              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Role cannot be changed</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Member Since</label>
              <input
                type="text"
                value={new Date(user?.created_at).toLocaleDateString()}
                disabled
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#aaa', fontSize: 16 }}
              />
            </div>
            <button
              type="submit"
              disabled={profileLoading}
              style={{ background: '#4f8cff', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', borderRadius: 8, padding: '0.8rem 2rem', boxShadow: '0 2px 8px #4f8cff44', cursor: 'pointer', transition: 'background 0.2s', marginTop: 8 }}
            >
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>
        <div style={{ width: '100%', background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '2rem', marginBottom: 0, display: 'block' }}>
          <h3 style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Change Password</h3>
          {passwordError && <div style={{ color: '#e74c3c', background: '#2d2323', border: '1px solid #e74c3c', borderRadius: 6, padding: '0.7rem 1rem', marginBottom: 10 }}>{passwordError}</div>}
          {passwordSuccess && <div style={{ color: '#22c55e', background: '#1e2d23', border: '1px solid #22c55e', borderRadius: 6, padding: '0.7rem 1rem', marginBottom: 10 }}>{passwordSuccess}</div>}
          <form onSubmit={handlePasswordSubmit} autoComplete="off">
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Current Password</label>
              <input
                type="password"
                name="oldPassword"
                value={passwordData.oldPassword}
                onChange={handlePasswordChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
              <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Password must be at least 6 characters long</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ color: '#b0b8c1', fontWeight: 600, marginBottom: 4, display: 'block' }}>Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                style={{ width: '100%', padding: '10px 12px', borderRadius: 7, border: '1.5px solid #23272f', background: '#23272f', color: '#fff', fontSize: 16 }}
              />
            </div>
            <button
              type="submit"
              disabled={passwordLoading}
              style={{ background: '#fbbf24', color: '#23272f', fontWeight: 700, fontSize: 17, border: 'none', borderRadius: 8, padding: '0.8rem 2rem', boxShadow: '0 2px 8px #fbbf2444', cursor: 'pointer', transition: 'background 0.2s', marginTop: 8 }}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Profile; 