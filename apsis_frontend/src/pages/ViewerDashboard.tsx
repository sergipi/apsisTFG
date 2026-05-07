import { useState } from 'react';
import type { User } from '../types';
import RequestList from '../components/RequestList';
import RequestDetail from '../components/RequestDetail';
import HeroBanner from '../components/HeroBanner';
import { 
  DashboardHeader, 
  DashboardLayout, 
  DashboardContent 
} from '../components/DashboardUI';
import '../styles/Dashboard.css';

export default function ViewerDashboard({ user }: { user: User | null }) {
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <DashboardLayout>
      <DashboardHeader 
        user={user} 
        roleName="Viewer / Auditor" 
        onLogoClick={() => setSelectedRequestId(null)} 
        onLogout={handleLogout} 
      />

      <DashboardContent>
        {!selectedRequestId && (
          <HeroBanner
            title="Auditor Panel"
            subtitle="Review or export all completed Apsis."
          />
        )}

        {selectedRequestId ? (
          <div>
            <RequestDetail
              requestId={selectedRequestId}
              userRole={user?.role || 'VIEWER'}
              onUpdate={() => { }}
              onBack={() => setSelectedRequestId(null)}
            />
          </div>
        ) : (
          <RequestList
            title="Completed Apsis Records"
            statusFilter="COMPLETED"
            showFilters={true}
            onSelectRequest={setSelectedRequestId}
          />
        )}
      </DashboardContent>
    </DashboardLayout>
  );
}
