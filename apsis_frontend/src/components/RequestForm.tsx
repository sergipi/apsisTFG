import { useState, useEffect } from 'react';
import api from '../services/api';
import type { User } from '../types';
import HeroBanner from './HeroBanner';

export default function RequestForm({ user, onSuccess, onCancel }: { user: User | null; onSuccess: () => void; onCancel: () => void }) {
  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState('ONBOARD');
  const [targetName, setTargetName] = useState('');
  const [targetEmail, setTargetEmail] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [selectedDept, setSelectedDept] = useState(user?.role !== 'ADMIN' ? user?.department?.toString() || '' : '');
  const [selectedLoc, setSelectedLoc] = useState(user?.role !== 'ADMIN' ? user?.location?.toString() || '' : '');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [gpsNumber, setGpsNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [createdId, setCreatedId] = useState<number | null>(null);

  useEffect(() => {
    api.get('profiles/').then((r) => {
      console.log(r.data);
      setProfiles(r.data);
    });
    api.get('users/').then((r) => {
      console.log(r.data);
      setUsers(r.data);
    });
    api.get('departments/').then((r) => {
      console.log(r.data);
      setDepartments(r.data);
    });
    api.get('locations/').then((r) => {
      console.log(r.data);
      setLocations(r.data);
    });
    api.get('products/').then((r) => {
      console.log(r.data);
      setAllProducts(r.data);
    });
  }, []);

  const handleNext = () => {
    if (requestType === 'ONBOARD' && selectedBeneficiary) {
      alert("This GPS already exists in Apsis.");
      return;
    }
    setSelectedProductIds([]);
    setStep(2);
  };

  useEffect(() => {
    const cleanGps = gpsNumber.trim().toUpperCase();
    if (!cleanGps) {
      setSelectedBeneficiary('');
      if (requestType !== 'ONBOARD') {
        setTargetName('');
        setTargetEmail('');
      }
      return;
    }

    const u = users.find(x => {
      const dbGps = x.gps_number ? String(x.gps_number).trim().toUpperCase() : '';
      return dbGps === cleanGps;
    });

    if (requestType === 'ONBOARD') {
      if (u) {
        setSelectedBeneficiary(u.id.toString());
      } else {
        setSelectedBeneficiary('');
      }
      return;
    }

    if (u) {
      console.log(u);
      setSelectedBeneficiary(u.id.toString());
      setTargetName(`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username);
      setTargetEmail(u.email);
      const shouldAutoSelectProfile = (user?.role === 'ADMIN') || ['OFFBOARD', 'NEW_HW_SW'].includes(requestType);

      if (u.profile && requestType !== 'TRANSFER' && shouldAutoSelectProfile) {
        setSelectedProfile(u.profile.toString());
        const pr = profiles.find((p) => {
          return p.id === u.profile;
        });

        if (pr) {
          setSelectedDept(pr.department?.toString() || '');
          const d = departments.find((x) => {
            return x.id === pr.department;
          });

          if (d && d.location) {
            setSelectedLoc(d.location.toString());
          }
        }
      }
    } else {
      setSelectedBeneficiary('');
      setTargetName('');
      setTargetEmail('');
    }
  }, [gpsNumber, users, requestType, profiles, departments]);

  useEffect(() => {
    if (user?.role !== 'ADMIN' && requestType !== 'TRANSFER') {
      if (user?.location) {
        setSelectedLoc(user.location.toString());
      }

      if (user?.department) {
        setSelectedDept(user.department.toString());
      }
    }
  }, [requestType, user, departments, locations]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const prof = profiles.find(pr => pr.id === Number(selectedProfile));
      const profileProducts = prof?.products || [];

      const payload = {
        request_type: requestType,
        target_user_name: targetName,
        target_user_email: targetEmail,
        target_gps_number: gpsNumber,
        beneficiary: selectedBeneficiary || null,
        profile: selectedProfile || null,
        department: (user?.role !== 'ADMIN' && requestType === 'ONBOARD') ? user?.department : (selectedDept || null),
        location: (user?.role !== 'ADMIN' && requestType === 'ONBOARD') ? user?.location : (selectedLoc || null),
        items: selectedProductIds.map((id) => {
          let action = 'ADD';
          if (requestType === 'OFFBOARD') action = 'REMOVE';
          else if (requestType === 'TRANSFER') {
            const has = allocated.includes(id);
            const needs = profileProducts.includes(id);
            if (has && needs) action = 'MAINTAIN';
            else if (has && !needs) action = 'REMOVE';
            else action = 'ADD';
          }
          return { product: id, action };
        })
      };
      console.log(payload);
      const res = await api.post('requests/', payload);
      console.log(res.data);
      setCreatedId(res.data.id);
    } catch (e: any) {
      console.error("Failed to create request:", e);
      const errMsg = e.response?.data ? JSON.stringify(e.response.data) : e.message;
      alert(`Failed to create request: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const effectiveLoc = (user?.role !== 'ADMIN' && requestType === 'ONBOARD')
    ? (user?.location?.toString() || '')
    : selectedLoc;

  const effectiveDept = (user?.role !== 'ADMIN' && requestType === 'ONBOARD')
    ? (user?.department?.toString() || '')
    : selectedDept;

  const filteredProfiles = profiles.filter((p) => {
    if (effectiveDept) {
      return Number(p.department) === Number(effectiveDept);
    }
    return true;
  });

  const filteredDepartments = departments.filter((d) => {
    if (user?.role !== 'ADMIN' && requestType !== 'TRANSFER') {
      return Number(d.id) === Number(user?.department);
    }

    if (effectiveLoc) {
      return Number(d.location) === Number(effectiveLoc);
    }

    return true;
  });
  const filteredUsers = users.filter(u => {
    if (user?.role === 'ADMIN') return true;
    if (requestType === 'OFFBOARD') {
      const uDeptName = departments.find(d => d.id === Number(u.department))?.name;
      const myDeptName = departments.find(d => d.id === Number(user?.department))?.name;
      return uDeptName === myDeptName;
    }
    return true;
  });
  const allocated = users.find(u => u.id === Number(selectedBeneficiary))?.allocated_products || [];

  if (createdId) {
    return (
      <>
        <HeroBanner
          title="Apsis Created Successfully"
          subtitle="Your request has been registered in the system."
        />
        <div className="glass-card" style={{ textAlign: 'center', padding: '48px 32px' }}>

          <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Apsis created with id: #{createdId}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px', fontSize: '15px' }}>
            Apsis set to pending authorization, wait for admin approval.
          </p>
          <button className="btn btn-primary" onClick={onSuccess} style={{ minWidth: '200px' }}>
            RETURN TO DASHBOARD
          </button>
        </div>
      </>
    );
  }

  if (step === 2) {
    const prof = profiles.find(pr => pr.id === Number(selectedProfile));
    const profileProducts = prof?.products || [];

    const products = allProducts.filter(p => {
      if (requestType === 'OFFBOARD') return allocated.includes(p.id);
      if (['ONBOARD', 'TRANSFER'].includes(requestType) && selectedProfile) return profileProducts.includes(p.id);
      if (requestType === 'NEW_HW_SW' && selectedProfile) return profileProducts.includes(p.id) && !allocated.includes(p.id);
      return true;
    }).filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));

    const getAction = (pid: number) => {
      if (requestType === 'OFFBOARD') return 'REMOVE';
      if (requestType === 'TRANSFER') {
        const has = allocated.includes(pid);
        const needs = profileProducts.includes(pid);
        if (has && needs) return 'KEEP';
        if (has && !needs) return 'REMOVE';
        if (!has && needs) return 'ADD';
      }
      return 'ADD';
    };

    const renderProductTable = (title: string, items: any[]) => {
      if (items.length === 0) return null;
      return (
        <div style={{ marginBottom: '24px' }}>
          <h4 className="product-table-header">{title} ({items.length})</h4>
          <div className="product-table-container">
            {items.map(p => (
              <div key={p.id} className="product-row">
                <input type="checkbox" className="product-checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => setSelectedProductIds(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} />
                <div className="product-name">{p.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <>
        <HeroBanner
          title="Create New Apsis"
          subtitle={`Complete the final step to submit your new ${requestType.replace('_', ' ')} request.`}
          onBack={onCancel}
          steps={[
            { label: 'Details', isActive: false, isCompleted: true },
            { label: 'Products', isActive: true, isCompleted: false },
          ]}
        />
        <div className="glass-card step-card">
          <h3 className="step-title">Step 2: Products</h3>
          <p className="step-description">Select the products to include in this Apsis.</p>
          <input placeholder="Search products..." className="input-field search-input" value={search} onChange={e => setSearch(e.target.value)} />

          <div className="scrollable-list">
            {renderProductTable("Available Products", products)}
            {products.length === 0 && <div className="empty-state">No products found matching your search.</div>}
          </div>

          <div className="button-group">
            <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>BACK</button>
            <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }} disabled={loading}>{loading ? 'CREATING...' : 'FINISH & SUBMIT'}</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeroBanner
        title="Create New Apsis"
        subtitle="Start a new Apsis request providing the required details."
        onBack={onCancel}
        steps={[
          { label: 'Details', isActive: true, isCompleted: false },
          { label: 'Products', isActive: false, isCompleted: false },
        ]}
      />
      <div className="glass-card step-card">
        <h3 className="step-title">Step 1: Details</h3>
        <form onSubmit={e => { e.preventDefault(); handleNext(); }} className="form-group">
          <div>
            <label className="input-label">Request Type</label>
            <select className="input-field" value={requestType} onChange={e => setRequestType(e.target.value)}>
              <option value="ONBOARD">Onboard</option><option value="OFFBOARD">Offboard</option>
              <option value="TRANSFER">Transfer</option><option value="NEW_HW_SW">New HW/SW</option>
            </select>
          </div>

          <div className="form-group">
            <div>
              <label className="input-label">{requestType === 'ONBOARD' ? 'GPS Number (New)' : 'Beneficiary GPS Number'}</label>
              <input className="input-field" placeholder={requestType === 'ONBOARD' ? "Enter new GPS Number" : "Search by GPS Number..."} value={gpsNumber} onChange={e => setGpsNumber(e.target.value)} required />
            </div>

            {requestType === 'ONBOARD' && selectedBeneficiary && gpsNumber && (
              <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>
                This GPS Number already exists. Please enter a unique GPS.
              </div>
            )}

            {requestType !== 'ONBOARD' && !selectedBeneficiary && gpsNumber && (
              <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', color: '#b91c1c', fontSize: '14px', fontWeight: 500 }}>
                No beneficiary found with this GPS number.
              </div>
            )}

            <div className="form-grid">
              <div>
                <label className="input-label">Full Name</label>
                <input className="input-field" placeholder="Target User Name" value={targetName} onChange={e => setTargetName(e.target.value)} required disabled={requestType !== 'ONBOARD'} />
              </div>

              <div>
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" placeholder="email@company.com" value={targetEmail} onChange={e => setTargetEmail(e.target.value)} disabled={requestType !== 'ONBOARD'} />
              </div>
            </div>

            <div className="form-grid">
              <div>
                <label className="input-label">{requestType === 'TRANSFER' ? 'Destination Location' : 'Location'}</label>
                <select
                  className="input-field"
                  value={effectiveLoc}
                  onChange={(e) => {
                    setSelectedLoc(e.target.value);
                    setSelectedDept('');
                    setSelectedProfile('');
                  }}
                  required
                  disabled={user?.role !== 'ADMIN' && requestType !== 'TRANSFER'}
                >
                  <option value="">Select Location</option>
                  {locations.map((l) => {
                    return (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="input-label">{requestType === 'TRANSFER' ? 'Destination Department' : 'Department'}</label>
                <select
                  className="input-field"
                  value={effectiveDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedProfile('');
                  }}
                  required
                  disabled={user?.role !== 'ADMIN' && requestType !== 'TRANSFER'}
                >
                  <option value="">Select Department</option>
                  {filteredDepartments.map((d) => {
                    return (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">{requestType === 'TRANSFER' ? 'Destination Profile' : 'Profile'}</label>
              <select className="input-field" value={selectedProfile} onChange={e => {
                setSelectedProfile(e.target.value);
                const pr = profiles.find(p => p.id === Number(e.target.value));
                if (pr) {
                  if (pr.department) setSelectedDept(pr.department.toString());
                  const d = departments.find(x => x.id === pr.department);
                  if (d && d.location) setSelectedLoc(d.location.toString());
                }
              }} required disabled={user?.role !== 'ADMIN' && ['OFFBOARD', 'NEW_HW_SW'].includes(requestType)}>
                <option value="">Select Profile</option>
                {filteredProfiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="button-group">
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>NEXT STEP</button>
          </div>
        </form>
      </div>
    </>
  );
}
