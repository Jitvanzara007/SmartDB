import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axiosInstance from '../../utils/axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

function InstructorDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('dashboard/instructor/');
      setDashboardData(response.data);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading instructor dashboard...</div>
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
        <div className="empty-state-text">Unable to load your instructor dashboard information.</div>
      </div>
    );
  }

  const { total_trainees, total_modules, trainees, modules } = dashboardData;

  // Chart Data
  const barData = {
    labels: trainees.slice(0, 6).map(t => t.username),
    datasets: [
      {
        label: 'Modules Completed',
        data: trainees.slice(0, 6).map(t => t.completed_modules || Math.floor(Math.random() * total_modules)),
        backgroundColor: '#4f46e5',
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Module Completions by Trainee', color: '#fff', font: { size: 16 } },
    },
    scales: {
      x: {
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  const doughnutData = {
    labels: ['Active', 'Inactive'],
    datasets: [
      {
        data: [modules.filter(m => m.is_active).length, modules.filter(m => !m.is_active).length],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 2,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#fff' } },
      title: { display: true, text: 'Active vs Inactive Modules', color: '#fff', font: { size: 16 } },
    },
  };

  return (
    <div className="main-content" style={{ background: '#181b20', minHeight: '100vh', padding: 0 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 8px' }}>
        <div style={{ borderBottom: '1.5px solid #23272f', padding: '1.2rem 0 1rem 0', width: '100%' }}>
          <h1 className="dashboard-title" style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>Instructor Dashboard</h1>
          <p className="dashboard-subtitle" style={{ margin: '4px 0 0 2px', fontSize: 15, color: '#b0b8c1' }}>Manage your training program and monitor trainee progress</p>
        </div>
        {/* Overview Stats Row */}
        <div style={{ background: '#20232a', borderRadius: 14, boxShadow: '0 4px 24px #0002', padding: '2rem 1.5rem 1.5rem 1.5rem', marginTop: 32, marginBottom: 24, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 32, width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{total_trainees}</div>
              <div style={{ color: '#b0b8c1', fontSize: 15, marginTop: 4 }}>Total Trainees</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{total_modules}</div>
              <div style={{ color: '#b0b8c1', fontSize: 15, marginTop: 4 }}>Training Modules</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{modules.filter(m => m.is_active).length}</div>
              <div style={{ color: '#b0b8c1', fontSize: 15, marginTop: 4 }}>Active Modules</div>
            </div>
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>75%</div>
              <div style={{ color: '#b0b8c1', fontSize: 15, marginTop: 4 }}>Avg Completion</div>
            </div>
          </div>
        </div>

        {/* Analytics & Insights */}
        <div className="dashboard-card" style={{ padding: '32px 24px' }}>
          <h3 className="card-title" style={{ marginBottom: 24 }}>Analytics & Insights</h3>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {/* Pie Chart: Assignment Status (Completed vs Not Completed, Red) */}
            <div style={{ flex: 1, minWidth: 260, maxWidth: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Doughnut
                data={{
                  labels: ['Completed', 'Not Completed'],
                  datasets: [
                    {
                      data: [
                        dashboardData.assignment_status_summary.completed,
                        dashboardData.assignment_status_summary.total - dashboardData.assignment_status_summary.completed,
                      ],
                      backgroundColor: [
                        '#10b981', // Completed (green)
                        '#ef4444', // Not Completed (red)
                      ],
                      borderWidth: 6,
                      borderColor: ['#10b981', '#ef4444'],
                      hoverOffset: 12,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  cutout: '68%',
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: { color: '#fff', font: { weight: 'bold' }, boxWidth: 18 },
                    },
                    title: {
                      display: true,
                      text: 'Assignment Status',
                      color: '#fff',
                      font: { size: 16, weight: 'bold' },
                      padding: { bottom: 16 },
                    },
                    tooltip: {
                      callbacks: {
                        label: ctx => {
                          const total = dashboardData.assignment_status_summary.total;
                          const value = ctx.parsed;
                          const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                          return ` ${ctx.label}: ${value} assignments (${percent}%)`;
                        },
                      },
                      backgroundColor: '#22223b',
                      titleColor: '#fff',
                      bodyColor: '#fff',
                    },
                    datalabels: {
                      color: '#fff',
                      font: { weight: 'bold', size: 14 },
                      formatter: (value, ctx) => {
                        const total = dashboardData.assignment_status_summary.total;
                        if (!total) return '';
                        const percent = ((value / total) * 100).toFixed(0);
                        return percent > 0 ? percent + '%' : '';
                      },
                    },
                  },
                }}
                height={240}
              />
              {/* Center label (manual, for now) */}
              <div style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                textAlign: 'center',
                color: '#10b981',
                fontWeight: 700,
                fontSize: 22,
                textShadow: '0 2px 8px rgba(0,0,0,0.18)',
              }}>
                {dashboardData.assignment_status_summary.completed} / {dashboardData.assignment_status_summary.total}
                <div style={{ color: '#fff', fontWeight: 400, fontSize: 13 }}>Completed</div>
              </div>
            </div>
            {/* Leaderboard: Top Trainee Progress */}
            <div style={{ flex: 1, minWidth: 260, maxWidth: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ color: '#fff', fontWeight: 700, marginBottom: 16 }}>Top Trainee Progress</h4>
              {dashboardData.trainees
                .sort((a, b) => b.completion_percentage - a.completion_percentage)
                .slice(0, 5)
                .map((trainee, idx) => (
                  <div key={trainee.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 18, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, marginRight: 16
                    }}>{trainee.username.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>{trainee.username}</div>
                      <div style={{ background: '#22223b', borderRadius: 6, height: 10, marginTop: 6, marginBottom: 2, overflow: 'hidden' }}>
                        <div style={{ width: `${trainee.completion_percentage}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #4f46e5)' }}></div>
                      </div>
                      <span style={{ color: '#a5b4fc', fontSize: 12 }}>{trainee.completion_percentage}% Complete</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="dashboard-card">
          <h3 className="card-title">Recent Activity</h3>
          <div className="activity-list">
            <div className="activity-item">
              <div className="activity-icon">👤</div>
              <div className="activity-content">
                <div className="activity-text">New trainee registered</div>
                <div className="activity-time">2 minutes ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">✅</div>
              <div className="activity-content">
                <div className="activity-text">Module completed by trainee</div>
                <div className="activity-time">5 minutes ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <div className="activity-text">New training module created</div>
                <div className="activity-time">1 hour ago</div>
              </div>
            </div>
            <div className="activity-item">
              <div className="activity-icon">🔄</div>
              <div className="activity-content">
                <div className="activity-text">Assignment updated</div>
                <div className="activity-time">2 hours ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Trainees List */}
        <div className="dashboard-card">
          <h3 className="card-title">Recent Trainees</h3>
          {trainees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👥</div>
              <div className="empty-state-title">No Trainees Yet</div>
              <div className="empty-state-text">No trainees have registered yet. They will appear here once they sign up.</div>
            </div>
          ) : (
            <div className="trainees-table">
              <div className="table-header">
                <div className="table-cell">Username</div>
                <div className="table-cell">Email</div>
                <div className="table-cell">Status</div>
                <div className="table-cell">Joined</div>
                <div className="table-cell">Actions</div>
              </div>
              {trainees.slice(0, 10).map((trainee) => (
                <div key={trainee.id} className="table-row">
                  <div className="table-cell">
                    <div className="user-info">
                      <div className="user-avatar small">
                        {trainee.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{trainee.username}</span>
                    </div>
                  </div>
                  <div className="table-cell">{trainee.email}</div>
                  <div className="table-cell">
                    <span className="module-status status-completed">Active</span>
                  </div>
                  <div className="table-cell">
                    {new Date(trainee.created_at).toLocaleDateString()}
                  </div>
                  <div className="table-cell">
                    <button className="btn btn-primary btn-sm">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorDashboard; 