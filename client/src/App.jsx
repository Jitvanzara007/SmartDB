import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import TraineeDashboard from './components/dashboard/TraineeDashboard';
import TraineeModules from './components/dashboard/TraineeModules';
import InstructorDashboard from './components/dashboard/InstructorDashboard';
import InstructorPanel from './components/dashboard/InstructorPanel';
import ManageTrainingModules from './components/dashboard/ManageTrainingModules';
import ManageTrainees from './components/dashboard/ManageTrainees';
import Profile from './components/profile/Profile';
import Navigation from './components/layout/Navigation';
import ErrorBoundary from './components/utils/ErrorBoundary';
import EditModule from './components/dashboard/EditModule';

function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  
  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading...</div>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="d-flex">
        {user && <Navigation />}
        <div className="flex-grow-1">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/" 
              element={
                <PrivateRoute>
                  {user?.role === 'trainee' ? <TraineeDashboard /> : <InstructorDashboard />}
                </PrivateRoute>
              } 
            />
            <Route 
              path="/trainee" 
              element={
                <PrivateRoute allowedRoles={['trainee']}>
                  <TraineeModules />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/instructor" 
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <ErrorBoundary>
                    <InstructorPanel />
                  </ErrorBoundary>
                </PrivateRoute>
              } 
            />
            <Route 
              path="/modules" 
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <ManageTrainingModules />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/trainees" 
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <ManageTrainees />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/modules/:id/edit" 
              element={
                <PrivateRoute allowedRoles={['instructor']}>
                  <EditModule />
                </PrivateRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
