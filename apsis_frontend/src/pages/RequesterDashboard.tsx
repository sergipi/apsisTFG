import { useState } from "react";
import type { User } from '../types';
import '../styles/Dashboard.css';
import RequestList from "../components/RequestList";
import RequestForm from "../components/RequestForm";
import RequestDetail from "../components/RequestDetail";
import HeroBanner from "../components/HeroBanner";
import { 
  DashboardCard, 
  DashboardBtn, 
  DashboardHeader, 
  DashboardLayout, 
  DashboardContent, 
  DashboardGrid 
} from '../components/DashboardUI';

export default function RequesterDashboard({ user }: { user: User | null }) {
  const [view, setView] = useState<'menu' | 'active' | 'history' | 'new' | 'detail'>('menu');
  const [returnView, setReturnView] = useState<'menu' | 'active' | 'history' | 'new' | 'detail'>('menu');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user} 
        onLogoClick={() => setView('menu')} 
        onLogout={logout} 
      />

      <DashboardContent>
        {view === 'menu' && (
          <HeroBanner
            title={`Welcome back, ${user?.username || 'User'}`}
            subtitle="Request a new Apsis or track you requests."
          />
        )}
        {view === 'active' && <HeroBanner title="Active Requests" subtitle="Your currently ongoing Apsis requests." onBack={() => setView('menu')} />}
        {view === 'history' && <HeroBanner title="Request History" subtitle="Your previously completed or rejected Apsis." onBack={() => setView('menu')} />}

        {view === 'menu' ? (
          <DashboardGrid>
            <DashboardCard title="My Apsis">
              <DashboardBtn text="View active Apsis" onClick={() => setView('active')} color="blue" />
              <DashboardBtn text="Request history" onClick={() => setView('history')} color="yellow" />
            </DashboardCard>
            <DashboardCard title="New Apsis">
              <DashboardBtn text="Create new request" onClick={() => setView('new')} color="blue" />
            </DashboardCard>
          </DashboardGrid>
        ) : (
          <div>
            {view === 'new' ? (
              <RequestForm user={user} onSuccess={() => setView('menu')} onCancel={() => setView('menu')} />
            ) : view === 'detail' && selectedId ? (
              <RequestDetail 
                requestId={selectedId} 
                userRole="REQUESTER" 
                onUpdate={() => { }} 
                onBack={() => {
                  setView(returnView);
                  setSelectedId(null);
                }} 
              />
            ) : (
              <RequestList
                title={view === 'active' ? "Active Requests" : "History"}
                statusFilter={view === 'active' ? "PENDING_AUTH,ASSIGNED,IN_PROGRESS" : "COMPLETED,REJECTED"}
                onSelectRequest={id => { 
                  console.log(id);
                  setReturnView(view);
                  setSelectedId(id); 
                  setView('detail'); 
                }}
              />
            )}
          </div>
        )}
      </DashboardContent>
    </DashboardLayout>
  );
}