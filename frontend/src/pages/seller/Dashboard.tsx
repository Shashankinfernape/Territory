import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Property {
  id: string;
  city: string;
  district?: string;
  taluk?: string;
  status: string;
  view_count: number;
  type?: string;
  price?: number;
}

interface SellerStats {
  unlock_counts: Record<string, number>;
  total_unlocks: number;
  total_revenue: number;
}

const statusStyle = (status: string): React.CSSProperties => {
  if (status === 'ACTIVE') return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
  if (status === 'REJECTED') return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
  if (status === 'SOLD_OUT') return { background: '#f3e8ff', color: '#7c3aed', border: '1px solid #ddd6fe' };
  if (status === 'DELETE_REQUESTED') return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' };
  return { background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' };
};

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cancelDeleteConfirmId, setCancelDeleteConfirmId] = useState<string | null>(null);
  const displayName = localStorage.getItem('display_name') || 'Seller';

  const fetchAll = async () => {
    try {
      const [propsRes, statsRes] = await Promise.all([
        api.get<Property[]>('/properties/seller/me'),
        api.get<SellerStats>('/properties/seller/me/stats'),
      ]);
      setProperties(propsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch seller data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleToggleSoldOut = async (id: string) => {
    setActionLoading(id + '_sold');
    try {
      await api.patch(`/properties/${id}/sold-out`);
      await fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestDelete = async (id: string) => {
    setDeleteConfirmId(null);
    setActionLoading(id + '_del');
    try {
      await api.post(`/properties/${id}/request-delete`);
      await fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to request deletion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelDelete = async (id: string) => {
    setCancelDeleteConfirmId(null);
    setActionLoading(id + '_cancel');
    try {
      await api.delete(`/properties/${id}/request-delete`);
      await fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to cancel delete request');
    } finally {
      setActionLoading(null);
    }
  };

  const totalViews = properties.reduce((sum, p) => sum + p.view_count, 0);
  const totalUnlocks = stats?.total_unlocks ?? 0;
  const totalRevenue = stats?.total_revenue ?? 0;

  const statCards = [
    {
      label: 'Total Listings',
      value: loading ? '—' : properties.length,
      icon: (<svg width="20" height="20" fill="none" stroke="#1a6b45" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" /></svg>),
    },
    {
      label: 'Total Views',
      value: loading ? '—' : totalViews.toLocaleString('en-IN'),
      icon: (<svg width="20" height="20" fill="none" stroke="#1a6b45" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>),
    },
    {
      label: 'Contact Unlocks',
      value: loading ? '—' : totalUnlocks,
      sub: `₹${totalRevenue.toLocaleString('en-IN')} earned`,
      icon: (<svg width="20" height="20" fill="none" stroke="#1a6b45" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
    },
  ];

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.75rem', fontWeight: 600, border: '1.5px solid',
    borderRadius: '7px', padding: '0.3rem 0.7rem', cursor: 'pointer',
    transition: 'all 0.15s ease', fontFamily: 'inherit', background: 'transparent',
  };

  return (
    <div style={{ background: '#FDFBF7', minHeight: '100vh', padding: '2.5rem 1.5rem' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.6rem', fontWeight: 700, color: '#2C2C2C', margin: 0 }}>
              Seller Dashboard
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 400 }}>
              Welcome back, {displayName}
            </p>
          </div>
          <Link
            to="/dashboard/seller/upload"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: '#2C2C2C', color: '#ffffff',
              border: '2px solid #2C2C2C', borderRadius: '9999px',
              padding: '0.55rem 1.25rem',
              fontFamily: "'Inter', sans-serif", fontSize: '0.8rem',
              fontWeight: 700, textDecoration: 'none',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ fontSize: '1rem', fontWeight: 900, lineHeight: 1 }}>+</span>
            <span>List New Property</span>
          </Link>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {statCards.map((card) => (
            <div key={card.label} style={{
              background: '#ffffff', borderRadius: '14px', padding: '1.5rem',
              border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {card.label}
                </span>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(26,107,69,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {card.icon}
                </div>
              </div>
              <p style={{ fontSize: '2rem', fontWeight: 800, color: '#2C2C2C', margin: 0, lineHeight: 1 }}>{card.value}</p>
              {card.sub && (<p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem', fontWeight: 500 }}>{card.sub}</p>)}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)', padding: '0.75rem 1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status Guide:</span>
          {[
            { label: 'Active', bg: '#dcfce7', color: '#15803d' },
            { label: 'Pending Review', bg: '#fef9c3', color: '#a16207' },
            { label: 'Sold Out', bg: '#f3e8ff', color: '#7c3aed' },
            { label: 'Delete Requested', bg: '#fef2f2', color: '#b91c1c' },
            { label: 'Rejected', bg: '#fee2e2', color: '#dc2626' },
          ].map(s => (
            <span key={s.label} style={{ background: s.bg, color: s.color, borderRadius: '9999px', padding: '0.2rem 0.65rem', fontSize: '0.7rem', fontWeight: 700 }}>
              {s.label}
            </span>
          ))}
        </div>

        {/* Properties Table */}
        <div style={{ background: '#ffffff', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #FDFBF7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
              Your Properties
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>
              {properties.length} listing{properties.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.9rem' }}>Loading your listings…</div>
          ) : properties.length === 0 ? (
            <div style={{ padding: '3.5rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontWeight: 500, marginBottom: '0.5rem' }}>No properties listed yet.</p>
              <Link to="/dashboard/seller/upload" style={{ color: '#1a6b45', fontWeight: 600, fontSize: '0.875rem', textDecoration: 'none' }}>
                List your first property →
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                    {['Property', 'Status', 'Views / Unlocks', 'Actions'].map((col, i) => (
                      <th key={col} style={{
                        padding: '0.75rem 1.25rem',
                        textAlign: i === 2 ? 'center' : i === 3 ? 'right' : 'left',
                        fontSize: '0.7rem', fontWeight: 600, color: '#9ca3af',
                        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {properties.map((listing, idx) => (
                    <tr key={listing.id} style={{
                      borderBottom: idx < properties.length - 1 ? '1px solid #FDFBF7' : 'none',
                      transition: 'background 0.12s ease',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#fafafa'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      {/* Property */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#2C2C2C' }}>
                          {listing.city}{listing.taluk ? `, ${listing.taluk}` : ''}{listing.district ? `, ${listing.district}` : ''}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontFamily: 'monospace', marginTop: '0.15rem', letterSpacing: '0.05em' }}>
                          #{listing.id.slice(-8).toUpperCase()}
                          {listing.type && <span style={{ marginLeft: '0.5rem', fontFamily: 'inherit', fontSize: '0.68rem', color: '#b0b8c4' }}>· {listing.type}</span>}
                        </div>
                        {listing.status === 'DELETE_REQUESTED' && (
                          <div style={{ fontSize: '0.68rem', color: '#b91c1c', marginTop: '0.2rem', fontWeight: 600 }}>
                            ⏳ Awaiting admin approval for deletion
                          </div>
                        )}
                        {listing.status === 'PENDING_VERIFICATION' && (
                          <div style={{ fontSize: '0.68rem', color: '#a16207', marginTop: '0.2rem', fontWeight: 600 }}>
                            ⏳ Awaiting admin review
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle' }}>
                        <span style={{
                          ...statusStyle(listing.status),
                          borderRadius: '9999px', padding: '0.25rem 0.75rem',
                          fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
                          textTransform: 'uppercase', display: 'inline-block',
                        }}>
                          {listing.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Views / Unlocks */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C' }}>{listing.view_count}</span>
                        <span style={{ color: '#d1d5db', margin: '0 0.35rem', fontWeight: 300 }}>/</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1a6b45' }}>
                          {stats?.unlock_counts?.[listing.id] ?? 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* Edit — not allowed when delete pending or sold out in review */}
                          {listing.status !== 'DELETE_REQUESTED' && (
                            <Link
                              to={`/dashboard/seller/edit/${listing.id}`}
                              style={{
                                ...btnBase,
                                borderColor: '#e5e7eb', color: '#2C2C2C', textDecoration: 'none',
                              }}
                              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = '#2C2C2C'; el.style.background = '#2C2C2C'; el.style.color = '#ffffff'; }}
                              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = '#e5e7eb'; el.style.background = 'transparent'; el.style.color = '#2C2C2C'; }}
                            >
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </Link>
                          )}

                          {/* Sold Out Toggle — only for ACTIVE or SOLD_OUT */}
                          {(listing.status === 'ACTIVE' || listing.status === 'SOLD_OUT') && (
                            <button
                              onClick={() => handleToggleSoldOut(listing.id)}
                              disabled={actionLoading === listing.id + '_sold'}
                              style={{
                                ...btnBase,
                                borderColor: listing.status === 'SOLD_OUT' ? '#7c3aed' : '#9ca3af',
                                color: listing.status === 'SOLD_OUT' ? '#7c3aed' : '#6b7280',
                                opacity: actionLoading === listing.id + '_sold' ? 0.6 : 1,
                              }}
                              title={listing.status === 'SOLD_OUT' ? 'Mark as Active again' : 'Mark as Sold Out'}
                            >
                              {listing.status === 'SOLD_OUT' ? (
                                <>
                                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Relist
                                </>
                              ) : (
                                <>
                                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Sold Out
                                </>
                              )}
                            </button>
                          )}

                          {/* Delete Request */}
                          {listing.status === 'DELETE_REQUESTED' ? (
                            <button
                              onClick={() => setCancelDeleteConfirmId(listing.id)}
                              disabled={actionLoading === listing.id + '_cancel'}
                              style={{ ...btnBase, borderColor: '#f97316', color: '#f97316' }}
                            >
                              Cancel Request
                            </button>
                          ) : listing.status !== 'PENDING_VERIFICATION' ? (
                            <button
                              onClick={() => setDeleteConfirmId(listing.id)}
                              disabled={actionLoading === listing.id + '_del'}
                              style={{ ...btnBase, borderColor: '#fca5a5', color: '#dc2626' }}
                              title="Request admin to delete this property"
                            >
                              <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.75rem', maxWidth: '420px', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C2C2C', margin: '0 0 0.5rem 0' }}>Request Property Deletion?</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              This will send a deletion request to the admin. Your listing will be marked as <strong>"Delete Requested"</strong> and hidden from the marketplace. 
              The property will be permanently deleted only after admin approval. You can cancel this request anytime before approval.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteConfirmId(null)} style={{ ...btnBase, borderColor: '#e5e7eb', color: '#6b7280', padding: '0.5rem 1rem' }}>Cancel</button>
              <button
                onClick={() => handleRequestDelete(deleteConfirmId)}
                style={{ ...btnBase, background: '#dc2626', borderColor: '#dc2626', color: '#fff', padding: '0.5rem 1.25rem' }}
              >
                Yes, Request Deletion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Delete Confirm Modal */}
      {cancelDeleteConfirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.75rem', maxWidth: '420px', width: '100%', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C2C2C', margin: '0 0 0.5rem 0' }}>Cancel Delete Request?</h2>
            <p style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              This will cancel the pending deletion request and restore your property to <strong>Active</strong> status on the marketplace.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setCancelDeleteConfirmId(null)} style={{ ...btnBase, borderColor: '#e5e7eb', color: '#6b7280', padding: '0.5rem 1rem' }}>Go Back</button>
              <button
                onClick={() => handleCancelDelete(cancelDeleteConfirmId)}
                style={{ ...btnBase, background: '#f97316', borderColor: '#f97316', color: '#fff', padding: '0.5rem 1.25rem' }}
              >
                Yes, Cancel Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
