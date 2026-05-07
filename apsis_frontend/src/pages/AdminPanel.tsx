import { useState } from 'react';
import type { User } from '../types';
import '../styles/Dashboard.css';
import RequestList from '../components/RequestList';
import MasterDataList from '../components/MasterDataList';
import RequestDetail from '../components/RequestDetail';
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
import AnalyticsDashboard from '../components/AnalyticsDashboard';

type ViewType =
  | 'menu'
  | 'pending'
  | 'all'
  | 'detail'
  | 'analytics'
  | 'm_profiles'
  | 'm_products'
  | 'm_technicians'
  | 'm_users'
  | 'm_departments';

export default function AdminPanel({ user }: { user: User | null }) {
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
        roleName="Administrator" 
        onLogoClick={() => setView('menu')} 
        onLogout={logout} 
      />

      <DashboardContent>
        {view === 'menu' && (
          <HeroBanner
            title="Admin Panel "
            subtitle="Manage Apsis requests and the Masterdata."
          />
        )}

        {view === 'pending' && (
          <HeroBanner
            title="Pending Authorizations"
            subtitle="Approve or reject requests."
            onBack={() => {
              setView('menu');
            }}
          />
        )}

        {view === 'all' && (
          <HeroBanner
            title="System History"
            subtitle="View or export all the apsis requests."
            onBack={() => {
              setView('menu');
            }}
          />
        )}

        {view === 'analytics' && (
          <HeroBanner
            title="System Analytics"
            subtitle="KPIs and SLA health tracking (Last 7 Days)."
            onBack={() => {
              setView('menu');
            }}
          />
        )}

        {view.startsWith('m_') && (
          <HeroBanner
            title={`Master Data: ${view.split('_')[1].toUpperCase()}`}
            subtitle={`Manage the ${view.split('_')[1]} in the system`}
            onBack={() => {
              setView('menu');
            }}
          />
        )}

        {view === 'menu' ? (
          <DashboardGrid>
            <DashboardCard>
              <DashboardTitle text="MANAGE APSIS REQUESTS" />
              <DashboardBtn text="Authorize Requests" onClick={() => setView('pending')} color="blue" />
              <DashboardBtn text="View All Apsis" onClick={() => setView('all')} color="yellow" />
              <DashboardBtn text="View Analytics" onClick={() => setView('analytics')} />
            </DashboardCard>

            <DashboardCard>
              <DashboardTitle text="Master Data Management" />
              <DashboardBtnGroup>
                {['users', 'technicians', 'profiles', 'products', 'departments'].map((m, index) => {
                  const color = index === 0 ? 'blue' : index === 1 ? 'yellow' : undefined;
                  return (
                    <DashboardBtn
                      key={m}
                      text={`Manage ${m.charAt(0).toUpperCase() + m.slice(1)}`}
                      color={color}
                      onClick={() => {
                        setView(`m_${m}` as ViewType);
                      }}
                    />
                  );
                })}
              </DashboardBtnGroup>
            </DashboardCard>
          </DashboardGrid>
        ) : (
          <div>
            {view === 'detail' && selectedRequestId ? (
              <RequestDetail
                requestId={selectedRequestId}
                userRole="ADMIN"
                onUpdate={() => { }}
                onBack={() => {
                  setView(returnView);
                  setSelectedRequestId(null);
                }}
              />
            ) : view === 'analytics' ? (
              <AnalyticsDashboard />
            ) : view.startsWith('m_') ? (
              <MasterDataList
                endpoint={view.split('_')[1] as any}
                title={view.split('_')[1]}
              />
            ) : (
              <RequestList
                title={view === 'pending' ? "Pending Auth" : "Full System History"}
                statusFilter={view === 'pending' ? "PENDING_AUTH" : ""}
                showFilters={true}
                onSelectRequest={(id) => {
                  console.log(id);
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
