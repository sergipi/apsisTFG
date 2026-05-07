import { useState } from 'react';
import type { User } from '../types';
import '../styles/Dashboard.css';
import RequestList from '../components/RequestList';
import RequestDetail from '../components/RequestDetail';
import MasterDataList from '../components/MasterDataList';
import HeroBanner from '../components/HeroBanner';
import { 
  DashboardCard, 
  DashboardTitle, 
  DashboardBtn, 
  DashboardHeader, 
  DashboardLayout, 
  DashboardContent, 
  DashboardGrid, 
  DashboardBtnGroup 
} from '../components/DashboardUI';

type ViewType = 'menu' | 'assigned' | 'in_progress' | 'history_me' | 'history_all' | 'detail' |
  'm_profiles' | 'm_products' | 'm_technicians' | 'm_users' | 'm_departments';

export default function ITDashboard({ user }: { user: User | null }) {
  const [view, setView] = useState<ViewType>('menu');
  const [returnView, setReturnView] = useState<ViewType>('menu');
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const logout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user} 
        roleName={user?.role === 'ADMIN' ? 'Administrator' : 'IT Technician'} 
        onLogoClick={() => setView('menu')} 
        onLogout={logout} 
      />

      <DashboardContent>
        {view === 'menu' && (
          <HeroBanner
            title="IT Technician Dasboard"
            subtitle="Manage your apsis requests."
          />
        )}
        {view === 'assigned' && (
          <HeroBanner title="My Tasks" subtitle="Apsis requests currently assigned to you for execution." onBack={() => setView('menu')} />
        )}
        {view === 'in_progress' && (
          <HeroBanner title="All In-Progress Apsis" subtitle="Global view of all Apsis currently being executed by the IT team." onBack={() => setView('menu')} />
        )}
        {view === 'history_me' && (
          <HeroBanner title="My Completed Apsis" subtitle="View your completed assignments." onBack={() => setView('menu')} />
        )}
        {view === 'history_all' && (
          <HeroBanner title="Apsis History" subtitle="Full system history." onBack={() => setView('menu')} />
        )}
        {view.startsWith('m_') && (
          <HeroBanner title={`Master Data: ${view.split('_')[1].toUpperCase()}`} subtitle="Management interface." onBack={() => setView('menu')} />
        )}

        {view === 'menu' ? (
          <DashboardGrid>
            <DashboardCard>
              <DashboardTitle text="My Tasks" />
              <DashboardBtn text="Assigned to Me" onClick={() => setView('assigned')} color="blue" />
              <DashboardBtn text="My Completed Apsis" onClick={() => setView('history_me')} color="yellow" />
            </DashboardCard>

            <DashboardCard>
              <DashboardTitle text="Apsis Operations" />
              <DashboardBtn text="View All In-Progress Apsis" onClick={() => setView('in_progress')} color="blue" />
              <DashboardBtn text="Search Apsis History" onClick={() => setView('history_all')} color="yellow" />
            </DashboardCard>

            {user?.role === 'ADMIN' && (
              <DashboardCard>
                <DashboardTitle text="Administration" />
                <DashboardBtnGroup>
                  {['users', 'technicians', 'profiles', 'products', 'departments'].map((m, index) => {
                    const color = index === 0 ? 'blue' : index === 1 ? 'yellow' : undefined;
                    return (
                      <DashboardBtn key={m} text={`Manage ${m.charAt(0).toUpperCase() + m.slice(1)}`} onClick={() => setView(`m_${m}` as ViewType)} color={color} />
                    );
                  })}
                </DashboardBtnGroup>
              </DashboardCard>
            )}
          </DashboardGrid>
        ) : (
          <div>
            {view === 'detail' && selectedRequestId ? (
              <RequestDetail 
                requestId={selectedRequestId} 
                userRole={user?.role || ''} 
                onUpdate={() => { }} 
                onBack={() => {
                  setView(returnView);
                  setSelectedRequestId(null);
                }} 
              />
            ) : view.startsWith('m_') ? (
              <MasterDataList endpoint={view.split('_')[1] as any} title={view.split('_')[1]} />
            ) : (
              <RequestList
                title={view === 'assigned' ? "Assigned to Me" : view === 'in_progress' ? "All In-Progress" : view === 'history_me' ? "My History" : "Full History"}
                statusFilter={['assigned', 'in_progress'].includes(view) ? "IN_PROGRESS" : view === 'history_me' ? "COMPLETED" : "COMPLETED,REJECTED"}
                technicianFilter={['assigned', 'history_me'].includes(view) ? user?.id : undefined}
                onSelectRequest={(id) => { 
                  setReturnView(view);
                  setSelectedRequestId(id); 
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