import React from 'react';
import type { User } from '../types';

interface CardProps {
  children: React.ReactNode;
  title?: string;
}

export const DashboardCard = ({ children, title }: CardProps) => {
  return (
    <div className="glass-card" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      {title && <DashboardTitle text={title} />}
      {children}
    </div>
  );
};

export const DashboardTitle = ({ text }: { text: string }) => {
  return (
    <h3 style={{ 
      fontSize: '15px', 
      fontWeight: 800, 
      color: 'var(--primary)', 
      textTransform: 'uppercase', 
      marginBottom: '20px', 
      letterSpacing: '0.5px', 
      textAlign: 'center' 
    }}>
      {text}
    </h3>
  );
};

interface BtnProps {
  text: string;
  onClick: () => void;
  color?: 'yellow' | 'blue';
  style?: React.CSSProperties;
}

export const DashboardBtn = ({ text, onClick, color, style }: BtnProps) => {
  return (
    <button 
      className="btn" 
      onClick={onClick} 
      style={{ 
        width: '100%', 
        background: color === 'yellow' ? '#fff200' : color === 'blue' ? 'var(--primary)' : 'white', 
        color: color === 'blue' ? 'white' : '#1f2937', 
        border: color ? 'none' : '1px solid #cbd5e1', 
        marginBottom: '10px',
        ...style
      }}
    >
      {text}
    </button>
  );
};

export const DashboardHeader = ({ user, roleName, onLogoClick, onLogout }: { 
  user: User | null; 
  roleName?: string; 
  onLogoClick: () => void; 
  onLogout: () => void 
}) => {
  return (
    <header className="dashboard-header">
      <h1 className="brand-title" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        Apsis
      </h1>
      <div className="user-info">
        {roleName && <span className="user-role">{roleName}</span>}
        <div className="user-avatar">{user?.username?.[0]?.toUpperCase() || 'U'}</div>
        <button 
          onClick={onLogout} 
          className="btn-primary" 
          style={{ padding: '8px 16px', background: 'transparent', color: '#6b7280', boxShadow: 'none' }}
        >
          Log Out
        </button>
      </div>
    </header>
  );
};

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="dashboard-layout">
      {children}
    </div>
  );
};

export const DashboardContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="dashboard-content">
      {children}
    </main>
  );
};

export const DashboardGrid = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="dashboard-grid">
      {children}
    </div>
  );
};

export const DashboardBtnGroup = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {children}
    </div>
  );
};
