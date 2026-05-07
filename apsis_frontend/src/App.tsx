import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RequesterDashboard from './pages/RequesterDashboard';
import ITDashboard from './pages/ITDashboard';
import ViewerDashboard from './pages/ViewerDashboard';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import type { User } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('apsis_user');
    
    if (saved) {
      return JSON.parse(saved);
    }
    
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('apsis_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('apsis_user');
    }
  }, [user]);

  const getRedirectPath = (role: string) => {
    return `/${role.toLowerCase().replace('_', '')}`;
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={
            user ? (
              <Navigate to={getRedirectPath(user.role)} />
            ) : (
              <LoginPage onLoginSuccess={setUser} />
            )
          } 
        />
        
        <Route 
          path="/requester" 
          element={
            <ProtectedRoute allowedRoles={['REQUESTER']} user={user}>
              <RequesterDashboard user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']} user={user}>
              <AdminPanel user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ittechnician" 
          element={
            <ProtectedRoute allowedRoles={['IT_TECHNICIAN']} user={user}>
              <ITDashboard user={user} />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/viewer" 
          element={
            <ProtectedRoute allowedRoles={['VIEWER']} user={user}>
              <ViewerDashboard user={user} />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}
