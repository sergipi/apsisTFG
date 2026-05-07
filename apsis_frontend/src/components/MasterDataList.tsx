import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '../services/api';
import { exportToCSV } from '../utils/csvExport';

export default function MasterDataList({ endpoint, title }: { endpoint: string, title: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const ep = endpoint === 'technicians' ? 'users' : endpoint;
      const res = await api.get(ep, {
        params: endpoint === 'technicians' ? { role: 'IT_TECHNICIAN' } : {}
      });
      console.log(res.data);
      setItems(res.data);
      if (['users', 'technicians'].includes(endpoint)) {
        const [l, d, p] = await Promise.all([
          api.get('locations/'),
          api.get('departments/'),
          api.get('profiles/')
        ]);
        console.log(l.data, d.data, p.data);
        setLocations(l.data);
        setDepartments(d.data);
        setProfiles(p.data);
      } else if (endpoint === 'profiles') {
        const [d, p] = await Promise.all([
          api.get('departments/'),
          api.get('products/')
        ]);
        console.log(d.data, p.data);
        setDepartments(d.data);
        setProducts(p.data);
      } else if (endpoint === 'departments') {
        const [l] = await Promise.all([api.get('locations/')]);
        setLocations(l.data);
      }
    } catch (err: any) {
      setError(`Failed to load ${title}`);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [endpoint]);

  const exportCSV = () => {
    if (!items.length) return;
    exportToCSV(items, endpoint);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) {
      return;
    }

    try {
      const ep = endpoint === 'technicians' ? 'users' : endpoint;
      await api.delete(`${ep}/${id}/`);
      setItems(items.filter((i) => {
        return i.id !== id;
      }));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const ep = endpoint === 'technicians' ? 'users' : endpoint;
      if (editingItem) {
        await api.put(`${ep}/${editingItem.id}/`, formData);
      } else {
        await api.post(`${ep}/`, endpoint === 'technicians' ? { ...formData, role: 'IT_TECHNICIAN' } : formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert("Save failed");
    }
  };

  const filtered = items.filter(i => JSON.stringify(i).toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: '24px', marginTop: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h3 style={{ color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</h3>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input placeholder="Search..." className="input-field" style={{ width: '250px' }} value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-secondary" onClick={exportCSV}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => { setEditingItem(null); setFormData({}); setIsModalOpen(true); }}>+ Add New</button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>ID</th>
              <th style={{ padding: '12px' }}>Info</th>
              {['users', 'technicians'].includes(endpoint) && <th style={{ padding: '12px' }}>Contact</th>}
              <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(i => (
              <tr key={i.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px' }}>#{i.id}</td>
                <td style={{ padding: '12px' }}>
                  <div style={{ fontWeight: 600 }}>{i.name || i.username || `${i.first_name} ${i.last_name}`}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{i.description || i.department_name || ''}</div>
                </td>
                {['users', 'technicians'].includes(endpoint) && (
                  <td style={{ padding: '12px' }}>
                    <div>{i.email}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{i.role}</div>
                  </td>
                )}
                <td style={{ padding: '12px', textAlign: 'right' }}>
                  <button onClick={() => { setEditingItem(i); setFormData(i); setIsModalOpen(true); }} style={{ color: 'var(--primary)', border: 'none', background: 'none', cursor: 'pointer', marginRight: '10px' }}>Edit</button>
                  <button onClick={() => handleDelete(i.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'grid', placeItems: 'center', zIndex: 99999, backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ width: '90%', maxWidth: '550px', padding: '40px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--primary)', marginBottom: '24px' }}>{editingItem ? 'Edit' : 'Create'} {title}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {['users', 'technicians'].includes(endpoint) ? (
                <>
                  <div className="form-grid">
                    <div>
                      <label className="input-label">First Name</label>
                      <input className="input-field" placeholder="John" value={formData.first_name || ''} onChange={e => setFormData({ ...formData, first_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="input-label">Last Name</label>
                      <input className="input-field" placeholder="Doe" value={formData.last_name || ''} onChange={e => setFormData({ ...formData, last_name: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Username</label>
                    <input className="input-field" placeholder="j.doe" value={formData.username || ''} onChange={e => setFormData({ ...formData, username: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Email Address</label>
                    <input className="input-field" type="email" placeholder="email@company.com" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="form-grid">
                    <div>
                      <label className="input-label">Location</label>
                      <select className="input-field" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                        <option value="">Choose...</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="input-label">Department</label>
                      <select className="input-field" value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                        <option value="">Choose...</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Functional Profile</label>
                    <select className="input-field" value={formData.profile || ''} onChange={e => setFormData({ ...formData, profile: e.target.value })}>
                      <option value="">Select Profile</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  {!editingItem && (
                    <div>
                      <label className="input-label">Initial Password</label>
                      <input className="input-field" type="password" placeholder="••••••••" onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                  )}
                  {endpoint === 'users' && (
                    <div>
                      <label className="input-label">System Role</label>
                      <select className="input-field" value={formData.role || 'REQUESTER'} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                        {['ADMIN', 'IT_TECHNICIAN', 'REQUESTER', 'VIEWER'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : endpoint === 'profiles' ? (
                <>
                  <div>
                    <label className="input-label">Profile Name</label>
                    <input className="input-field" placeholder="Enter name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Associated Department</label>
                    <select className="input-field" value={formData.department || ''} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                      <option value="">Select Department...</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">Hardware & Software Templates</label>
                    <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      {products.map(p => (
                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            style={{ width: '16px', height: '16px' }}
                            checked={formData.products?.includes(p.id) || false}
                            onChange={(e) => {
                              const current = formData.products || [];
                              setFormData({
                                ...formData,
                                products: e.target.checked ? [...current, p.id] : current.filter((id: number) => id !== p.id)
                              });
                            }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 500 }}>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              ) : endpoint === 'departments' ? (
                <>
                  <div>
                    <label className="input-label">Department Name</label>
                    <input className="input-field" placeholder="Enter name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">Associated Location</label>
                    <select className="input-field" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                      <option value="">Select Location...</option>
                      {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                  </div>
                </>
              ) : (
                <div>
                  <label className="input-label">Name</label>
                  <input className="input-field" placeholder="Enter name" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
              )}
              {endpoint === 'products' && (
                <div>
                  <label className="input-label">Description</label>
                  <textarea className="input-field" style={{ minHeight: '100px' }} placeholder="Product details..." value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>CANCEL</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>SAVE CHANGES</button>
              </div>
            </form>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
