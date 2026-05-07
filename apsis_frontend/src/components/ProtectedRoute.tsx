import React from 'react';
import { Navigate } from 'react-router-dom';
import type { User } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  user: User | null;
}

export default function ProtectedRoute({ children, allowedRoles, user }: ProtectedRouteProps) {
  if (!user) {
    return <Navigate to="/" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          gap: '16px' 
        }}
      >
        <h2 style={{ margin: 0 }}>Unauthorized Access</h2>
        <p style={{ color: '#ed1c24' }}>You do not have access to this page.</p>
        <button 
          className="btn-primary" 
          onClick={() => {
            window.location.href = '/';
          }}
        >
          Return
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
