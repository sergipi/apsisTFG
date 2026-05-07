import { useState, useEffect } from 'react';
import api from '../services/api';
import type { ApsisRequest, User } from '../types';
import HeroBanner from './HeroBanner';

export default function RequestDetail({ requestId, userRole, onUpdate, onBack }: { requestId: number; userRole: string; onUpdate: () => void; onBack: () => void }) {
  const [request, setRequest] = useState<ApsisRequest | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTech, setSelectedTech] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const [r, t] = await Promise.all([
        api.get(`requests/${requestId}/`),
        userRole === 'ADMIN' ? api.get('users/?role=IT_TECHNICIAN') : Promise.resolve({ data: [] })
      ]);

      setRequest(r.data);
      console.log(r.data);
      setTechnicians(t.data);
      console.log(t.data);
    } catch (e) {
      alert('Load failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [requestId]);

  const patch = async (data: any) => {
    try {
      console.log(data);
      await api.patch(`requests/${requestId}/`, data);
      fetch();
      onUpdate();
    } catch (e) {
      alert('Update failed');
    }
  };

  if (loading || !request) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <>
      <HeroBanner
        title={`Request #${request.id}${request.status === 'REJECTED' ? ' - Canceled' : ''}`}
        subtitle={request.status === 'REJECTED' 
          ? `This request for ${request.target_user_name} has been canceled and is no longer active.`
          : `Viewing details for ${request.request_type.replace('_', ' ')} request for ${request.target_user_name}.`
        }
        steps={request.status === 'REJECTED' ? [
          { label: 'Created', isActive: false, isCompleted: true },
          { label: 'Canceled', isActive: true, isCompleted: true }
        ] : [
          { label: 'Created', isActive: false, isCompleted: true },
          { label: 'Authorized', isActive: request.status === 'PENDING_AUTH', isCompleted: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(request.status) },
          { label: 'In Progress', isActive: ['ASSIGNED', 'IN_PROGRESS'].includes(request.status), isCompleted: request.status === 'COMPLETED' },
          { label: 'Completed', isActive: false, isCompleted: request.status === 'COMPLETED' }
        ]}
      />
      <div className="glass-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 24px' }}>Back to List</button>
        </div>

        <div className="form-grid" style={{ marginBottom: '32px' }}>
          <div>
            <p><strong>Target:</strong> {request.target_user_name}</p>
            <p><strong>Status:</strong> <span style={{ color: 'var(--primary)' }}>{request.status.replace('_', ' ')}</span></p>
            <p><strong>Due:</strong> <span style={{ color: request.is_overdue ? 'red' : 'inherit' }}>{request.due_date ? new Date(request.due_date).toLocaleDateString() : 'N/A'}</span></p>
            {request.is_overdue && <span style={{ color: 'red', fontWeight: 800 }}>OVERDUE</span>}
          </div>
          <div>
            <p><strong>Progress:</strong> {request.progress_percentage}%</p>
            <div style={{ width: '100%', height: '8px', background: '#eee', borderRadius: '4px' }}>
              <div style={{ width: `${request.progress_percentage}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px' }} />
            </div>
          </div>
        </div>

        {userRole === 'ADMIN' && (request.status === 'PENDING_AUTH' || !request.technician) && (
          <div style={{ marginBottom: '32px', padding: '16px', background: '#f8fafc', borderRadius: '8px' }}>
            <h4>Assign & Approve</h4>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <select className="input-field" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }} onChange={e => setSelectedTech(parseInt(e.target.value))}>
                <option value="">Select Technician...</option>
                {technicians.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.first_name || t.last_name ? `${t.first_name} ${t.last_name}` : t.username}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary" style={{ padding: '10px 24px', width: 'auto' }} disabled={!selectedTech} onClick={() => patch({ technician: selectedTech, status: 'IN_PROGRESS' })}>Assign</button>
              <button className="btn btn-primary" style={{ padding: '10px 24px', width: 'auto', background: 'var(--danger)' }} onClick={() => patch({ status: 'REJECTED' })}>Reject</button>
            </div>
          </div>
        )}

        {userRole === 'REQUESTER' && request.status === 'PENDING_AUTH' && (
          <div>
            <button
              className="btn btn-primary"
              style={{ background: 'var(--danger)', padding: '10px 24px', width: 'auto' }}
              onClick={() => {
                if (window.confirm("Are you sure you want to cancel this request?")) {
                  patch({ status: 'REJECTED' });
                }
              }}
            >
              Cancel Request
            </button>
          </div>
        )}

        <div style={{ marginTop: '32px' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--primary)', marginBottom: '16px' }}>Request Items</h3>

          {(() => {
            const items = [...((request as any).items || [])].sort((a, b) => a.id - b.id);
            const renderTable = (title: string, filteredItems: any[], color: string) => {
              if (filteredItems.length === 0) return null;
              return (
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, color, textTransform: 'uppercase', marginBottom: '8px', borderBottom: `2px solid ${color}22`, paddingBottom: '4px' }}>{title}</h4>
                  <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    {filteredItems.map(i => (
                      <div key={i.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #edf2f7' }}>
                        <input
                          type="checkbox"
                          checked={i.is_completed}
                          disabled={userRole !== 'IT_TECHNICIAN' || request.status !== 'IN_PROGRESS'}
                          onChange={async (e) => {
                            await api.patch(`requests/${requestId}/items/${i.id}/`, {
                              is_completed: e.target.checked
                            });
                            fetch();
                          }}
                          style={{ width: '18px', height: '18px', cursor: (userRole === 'IT_TECHNICIAN' && request.status === 'IN_PROGRESS') ? 'pointer' : 'default' }}
                        />
                        <span style={{ marginLeft: '16px', flex: 1, fontWeight: 500 }}>{i.product_name}</span>
                        {i.is_completed && <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontSize: '10px' }}>Fulfilled</span>}
                      </div>
                    ))}
                  </div>
                </div>
              );
            };

            const toAdd = items.filter((i: any) => i.action === 'ADD');
            const toRemove = items.filter((i: any) => i.action === 'REMOVE');
            const toMaintain = items.filter((i: any) => i.action === 'MAINTAIN');

            return (
              <>
                {renderTable("Products to Add", toAdd, "#0369a1")}
                {renderTable("Products to Remove", toRemove, "#b91c1c")}
                {renderTable("Products to Maintain (Keep)", toMaintain, "#166534")}
                {items.length === 0 && <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No items found for this request.</div>}
              </>
            );
          })()}
        </div>

        {userRole === 'IT_TECHNICIAN' && request.status === 'IN_PROGRESS' && request.progress_percentage === 100 && (
          <button className="btn btn-primary" style={{ marginTop: '24px', width: '100%', background: 'var(--success)' }} onClick={() => patch({ status: 'COMPLETED' })}>Complete Request</button>
        )}
      </div>
    </>
  );
}
