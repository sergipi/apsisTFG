import { useEffect, useState } from 'react';
import api from '../services/api';
import type { ApsisRequest } from '../types';
import { exportToCSV } from '../utils/csvExport';

type SortKey = 'id' | 'request_type' | 'target_user_name' | 'status' | 'progress_percentage' | 'created_at';

export default function RequestList({ statusFilter: initialStatusFilter, technicianFilter, overdueOnly, title, onSelectRequest, showFilters = false }: { statusFilter?: string; technicianFilter?: number; overdueOnly?: boolean; title: string; onSelectRequest?: (id: number) => void; showFilters?: boolean }) {
  const [requests, setRequests] = useState<ApsisRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentStatus, setCurrentStatus] = useState(initialStatusFilter || '');
  const [currentType, setCurrentType] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'id', dir: 'desc' });

  useEffect(() => {
    api.get('requests/', {
      params: {
        status: currentStatus || undefined,
        technician: technicianFilter,
        is_overdue: overdueOnly || undefined
      }
    })
      .then((res) => {
        console.log(res.data);
        setRequests(res.data);
      })
      .catch(() => {
        alert('Failed to load requests');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentStatus, technicianFilter, overdueOnly]);

  const sorted = [...requests]
    .filter(r => {
      const searchStr = `${r.id} ${r.request_type} ${r.target_user_name || ''}`.toLowerCase();
      return searchStr.includes(searchTerm.toLowerCase());
    })
    .filter((r) => {
      if (currentType) {
        return r.request_type === currentType;
      }
      return true;
    })
    .sort((a, b) => {
      const vA = a[sort.key] ?? '', vB = b[sort.key] ?? '';
      if (sort.dir === 'asc') {
        return vA < vB ? -1 : 1;
      } else {
        return vA < vB ? 1 : -1;
      }
    });

  const exportCSV = () => {
    const headers = ['ID', 'Type', 'Target User', 'Status', 'Progress', 'Created At', 'Due Date'];
    const data = sorted.map(r => [
      r.id,
      r.request_type,
      r.target_user_name || 'N/A',
      r.status,
      `${r.progress_percentage}%`,
      new Date(r.created_at).toLocaleDateString(),
      r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A'
    ]);
    exportToCSV(data, 'apsis_export', headers);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Loading {title}...
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ color: 'var(--primary)', margin: 0 }}>{title}</h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          {showFilters && (
            <>
              <select className="input-field" style={{ marginBottom: 0, minWidth: '150px' }} value={currentStatus} onChange={e => setCurrentStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="PENDING_AUTH">Pending Auth</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>
              <select className="input-field" style={{ marginBottom: 0, minWidth: '150px' }} value={currentType} onChange={e => setCurrentType(e.target.value)}>
                <option value="">All Types</option>
                <option value="ONBOARD">Onboard</option>
                <option value="OFFBOARD">Offboard</option>
                <option value="TRANSFER">Transfer</option>
                <option value="NEW_HW_SW">New HW/SW</option>
              </select>
            </>
          )}
          <input placeholder="Search..." className="input-field" style={{ maxWidth: '200px', marginBottom: 0 }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <button className="btn btn-secondary" onClick={exportCSV} style={{ padding: '10px 16px' }}>Export CSV</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              {['id', 'request_type', 'target_user_name', 'status', 'progress_percentage', 'created_at'].map(k => (
                <th key={k} style={{ padding: '12px', cursor: 'pointer' }} onClick={() => setSort({ key: k as SortKey, dir: sort.key === k && sort.dir === 'asc' ? 'desc' : 'asc' })}>
                  {k.replace('_', ' ').toUpperCase()} {sort.key === k ? (sort.dir === 'asc' ? '(ASC)' : '(DESC)') : ''}
                </th>
              ))}
              <th style={{ padding: '12px' }}>DUE DATE</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid var(--border)', cursor: onSelectRequest ? 'pointer' : 'default' }} onClick={() => onSelectRequest?.(r.id)}>
                <td style={{ padding: '12px' }}>#{r.id}</td>
                <td style={{ padding: '12px' }}>
                  {r.request_type.replace('_', ' ')}
                  {r.is_overdue && <span className="badge" style={{ marginLeft: '8px', background: '#fee2e2', color: '#b91c1c' }}>OVERDUE</span>}
                </td>
                <td style={{ padding: '12px' }}>{r.target_user_name || 'N/A'}</td>
                <td style={{ padding: '12px' }}>
                  <span className="badge" style={{
                    background: r.status === 'COMPLETED' ? '#dcfce7' : '#fef9c3',
                    color: r.status === 'COMPLETED' ? '#166534' : '#854d0e'
                  }}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>{r.progress_percentage}%</td>
                <td style={{ padding: '12px' }}>{new Date(r.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '12px', color: r.is_overdue ? '#b91c1c' : 'inherit', fontWeight: r.is_overdue ? 600 : 400 }}>
                  {r.due_date ? new Date(r.due_date).toLocaleDateString() : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
