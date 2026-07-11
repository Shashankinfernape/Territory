import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Property } from '../../lib/types';

type Tab = 'overview' | 'users' | 'properties' | 'transactions' | 'trending';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  users: 'Registered Users',
  properties: 'Land Listings',
  transactions: 'Payments History',
  trending: 'Trending Listings',
};

interface User {
  id: string;
  phone_number: string;
  role: string;
  full_name?: string;
  created_at?: string;
}

interface Transaction {
  id: string;
  buyer_phone: string;
  property_city: string;
  property_district?: string;
  amount: number;
  status: string;
  created_at?: string;
}

interface AdminStats {
  total_users: number;
  active_properties: number;
  pending_properties: number;
  total_transactions: number;
  total_revenue: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewDocsFor, setViewDocsFor] = useState<Property | null>(null);
  const navigate = useNavigate();

  const BACKEND_ROOT = import.meta.env.VITE_API_ROOT || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const [statsRes, usersRes, propsRes, txsRes] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<User[]>('/admin/users'),
        api.get<Property[]>('/admin/properties'),
        api.get<Transaction[]>('/admin/transactions'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
      setTransactions(txsRes.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Access forbidden. Admin verification failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const shortId = (id: string) => id.slice(-8).toUpperCase();

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/admin/properties/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete property');
    }
  };

  const handleVerify = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      await api.put(`/admin/properties/${id}/verify`, { status });
      setViewDocsFor(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update property status');
    }
  };

  const handleEditProperty = (id: string) => {
    navigate(`/dashboard/seller/edit/${id}`);
  };

  if (loading && !stats) return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(15, 23, 42, 0.6)', fontSize: '0.9rem', fontWeight: 600 }}>Loading admin control panel...</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: '#ff3b30', fontWeight: 700 }}>
      {error}
    </div>
  );



  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', padding: '1rem 1.5rem 3rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Admin Control Panel</h1>
          <span className="badge-premium" style={{ border: '1px solid #ff3b30', color: '#ff3b30', background: 'rgba(255,59,48,0.06)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', textTransform: 'uppercase' }}>Admin Control</span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.08)', paddingBottom: '0.5rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', whiteSpace: 'nowrap' }}>
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === tab ? '#101010' : 'transparent',
                color: activeTab === tab ? '#ffffff' : 'rgba(15, 23, 42, 0.55)',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                if (activeTab !== tab) {
                  e.currentTarget.style.background = 'rgba(15, 23, 42, 0.05)';
                  e.currentTarget.style.color = '#101010';
                }
              }}
              onMouseLeave={e => {
                if (activeTab !== tab) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(15, 23, 42, 0.55)';
                }
              }}
            >
              {TAB_LABELS[tab]}
              {tab === 'properties' && stats?.pending_properties ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '4px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  background: activeTab === tab ? '#ffffff' : '#b8963e',
                  color: activeTab === tab ? '#101010' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}>
                  {stats.pending_properties}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="admin-overview-grid">
            {/* Left Column: Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.25rem'
              }}>
                {[
                  { label: 'Total Users', value: stats.total_users, color: '#0f172a' },
                  { label: 'Active Properties', value: stats.active_properties, color: '#0f172a' },
                  { label: 'Pending Review', value: stats.pending_properties, color: '#b8963e' },
                  { label: 'Total Transactions', value: stats.total_transactions, color: '#0f172a' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '85px'
                  }}>
                    <h3 style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{label}</h3>
                    <p style={{ marginTop: '0.5rem', fontSize: '1.6rem', fontWeight: 900, color: color, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Platform Revenue Card */}
              <div style={{
                background: '#ffffff',
                padding: '1.25rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(15, 23, 42, 0.06)',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Total Platform Revenue</h3>
                  <p style={{ marginTop: '0.35rem', fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0, letterSpacing: '-0.5px' }}>
                    ₹{(stats.total_revenue ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: '#10b981',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  userSelect: 'none'
                }}>
                  ₹
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions */}
            <div style={{
              background: '#ffffff',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '0.75rem'
            }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '0.5rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('properties')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  Review Land Listings ({stats.pending_properties} pending)
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  Manage Registered Users ({stats.total_users})
                </button>
                <button
                  onClick={() => setActiveTab('trending')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  View Trending Listings (by views)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRENDING TAB */}
        {activeTab === 'trending' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Trending Properties</h2>
                <p style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.5)', marginTop: '0.2rem' }}>Listings ordered by total views count</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Rank', 'City / Type', 'Seller ID', 'Views Count', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...properties]
                    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
                    .length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No listings found.</td></tr>
                    ) : [...properties]
                      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
                      .map((p, index) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: index === 0 ? '#b8963e' : index === 1 ? '#64748b' : index === 2 ? '#b45309' : '#0f172a' }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.city}{p.district ? `, ${p.district}` : ''}</div>
                            {p.type && <div style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.4)' }}>{p.type}</div>}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'monospace' }}>
                            <span style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {shortId(p.seller_id)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#b8963e' }}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              {p.view_count ?? 0}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <span className="badge-verified" style={{
                              border: p.status === 'ACTIVE' ? '1px solid #10b981' : p.status === 'REJECTED' ? '1px solid #ff3b30' : '1px solid #b8963e',
                              color: p.status === 'ACTIVE' ? '#10b981' : p.status === 'REJECTED' ? '#ff3b30' : '#b8963e',
                              background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.04)' : p.status === 'REJECTED' ? 'rgba(255, 59, 48, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                            }}>{p.status}</span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleEditProperty(p.id)}
                                style={{
                                  background: 'rgba(0, 122, 255, 0.08)',
                                  border: 'none',
                                  color: '#007aff',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setViewDocsFor(p)}
                                style={{
                                  background: 'rgba(184, 150, 62, 0.08)',
                                  border: 'none',
                                  color: '#b8963e',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                              >
                                Docs
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Phone', 'Role', 'Full Name', 'Registered', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No users found.</td></tr>
                  ) : users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace' }}>{u.phone_number}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: u.role === 'ADMIN' ? '1px solid #ff3b30' : u.role === 'SELLER' ? '1px solid #007aff' : '1px solid #0f2042',
                          color: u.role === 'ADMIN' ? '#ff3b30' : u.role === 'SELLER' ? '#007aff' : '#0f2042',
                          background: u.role === 'ADMIN' ? 'rgba(255,59,48,0.04)' : u.role === 'SELLER' ? 'rgba(0,122,255,0.04)' : 'rgba(15, 32, 66, 0.05)'
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.7)' }}>{u.full_name ?? '-'}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        {u.role !== 'ADMIN' && (
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === 'properties' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['City / Type', 'Seller ID', 'Status', 'Views', 'Docs', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No properties found.</td></tr>
                  ) : properties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.city}{p.district ? `, ${p.district}` : ''}</div>
                        {p.type && <div style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.4)' }}>{p.type}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'monospace' }}>
                        <span style={{ background: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {shortId(p.seller_id)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: p.status === 'ACTIVE' ? '1px solid #10b981' : p.status === 'REJECTED' ? '1px solid #ff3b30' : '1px solid #b8963e',
                          color: p.status === 'ACTIVE' ? '#10b981' : p.status === 'REJECTED' ? '#ff3b30' : '#b8963e',
                          background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.04)' : p.status === 'REJECTED' ? 'rgba(255, 59, 48, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                        }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{p.view_count}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <button
                          onClick={() => setViewDocsFor(p)}
                          style={{
                            background: 'rgba(184, 150, 62, 0.08)',
                            border: 'none',
                            color: '#b8963e',
                            fontWeight: 600,
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                        >
                          {p.documents?.length || 0} Docs
                        </button>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {p.status === 'PENDING_VERIFICATION' && (
                            <>
                              <button
                                onClick={() => handleVerify(p.id, 'ACTIVE')}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  border: 'none',
                                  color: '#10b981',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleVerify(p.id, 'REJECTED')}
                                style={{
                                  background: 'rgba(255, 59, 48, 0.08)',
                                  border: 'none',
                                  color: '#ff3b30',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditProperty(p.id)}
                            style={{
                              background: 'rgba(0, 122, 255, 0.08)',
                              border: 'none',
                              color: '#007aff',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProperty(p.id)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Buyer', 'Property', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No transactions yet.</td></tr>
                  ) : transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace' }}>{tx.buyer_phone}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.7)' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{tx.property_city}</div>
                        {tx.property_district && <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.4)' }}>{tx.property_district}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: tx.status === 'COMPLETED' ? '1px solid #10b981' : '1px solid #b8963e',
                          color: tx.status === 'COMPLETED' ? '#10b981' : '#b8963e',
                          background: tx.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                        }}>{tx.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.5)' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Docs Verification Modal */}
        {viewDocsFor && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', maxWidth: '600px', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Verify Property Documents</h2>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(15, 23, 42, 0.55)', marginTop: '0.25rem' }}>{viewDocsFor.city}{viewDocsFor.district ? `, ${viewDocsFor.district}` : ''}</p>
                </div>
                <button onClick={() => setViewDocsFor(null)} style={{ background: 'none', border: 'none', color: 'rgba(15, 23, 42, 0.5)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {viewDocsFor.documents && viewDocsFor.documents.length > 0 ? (
                  viewDocsFor.documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '6px' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{doc.type}</span>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.45)', fontFamily: 'monospace', marginTop: '0.2rem', wordBreak: 'break-all' }}>{doc.url}</p>
                      </div>
                      <a
                        href={`${BACKEND_ROOT}${doc.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="badge-verified"
                        style={{
                          textDecoration: 'none',
                          border: '1px solid #101010',
                          color: '#ffffff',
                          background: '#101010',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#333333'}
                        onMouseLeave={e => e.currentTarget.style.background = '#101010'}
                      >
                        Open
                      </a>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(15,23,42,0.45)', fontStyle: 'italic', padding: '1rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '6px' }}>No documents uploaded by seller.</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '1.25rem' }}>
                {viewDocsFor.status === 'PENDING_VERIFICATION' ? (
                  <>
                    <button
                      onClick={() => handleVerify(viewDocsFor.id, 'REJECTED')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '6px',
                        border: '1px solid #ff3b30',
                        background: 'rgba(255,59,48,0.05)',
                        color: '#ff3b30',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.05)'}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerify(viewDocsFor.id, 'ACTIVE')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                    >
                      Approve &amp; Activate
                    </button>
                  </>
                ) : (
                  <div style={{ color: 'rgba(15,23,42,0.55)', fontStyle: 'italic', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                    Property is already <span style={{ fontWeight: 700, margin: '0 0.25rem', color: '#0f172a' }}>{viewDocsFor.status}</span>.
                    <button
                      onClick={() => handleVerify(viewDocsFor.id, viewDocsFor.status === 'ACTIVE' ? 'REJECTED' : 'ACTIVE')}
                      style={{
                        marginLeft: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: '#b8963e',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'inherit'
                      }}
                    >
                      Change to {viewDocsFor.status === 'ACTIVE' ? 'REJECTED' : 'ACTIVE'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
