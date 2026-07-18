import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Property, User } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import { PROPERTY_IMAGES } from '../../lib/types';

interface SellerProperty {
  id: string;
  city: string;
  district?: string;
  taluk?: string;
  status: string;
  view_count: number;
  type?: string;
  price?: number;
  rejection_info?: {
    message: string;
    type: 'NEW_PROPERTY_REJECTION' | 'EDIT_REJECTION' | 'DELETE_REJECTION';
    timestamp: string;
    rejected_details?: Record<string, any>;
  };
}

interface SellerStats {
  unlock_counts: Record<string, number>;
  total_unlocks: number;
  total_revenue: number;
}

interface PurchasedItem {
  property: Property;
  status: 'SUCCESS' | 'PENDING' | 'REJECTED';
  transaction_id: string;
  payment_method: string;
}

function PurchasedPropertiesList({ title }: { title: string }) {
  const [items, setItems] = useState<PurchasedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<PurchasedItem[]>('/payments/purchased-properties')
      .then(res => setItems(res.data))
      .catch(() => setError('Failed to load purchased properties.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem', paddingBottom: '2rem' }}>
      <p style={{ color: 'rgba(15,23,42,0.6)', fontSize: '0.9rem', fontWeight: 600 }}>Loading registry list...</p>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.1rem', margin: 0 }}>{title}</h3>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b8963e', background: 'rgba(184, 150, 62, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {!error && items.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '3rem 1.5rem',
          background: 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '12px', border: '1px dashed rgba(15, 23, 42, 0.12)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🗺️</div>
          <h4 style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', margin: '0 0 0.25rem 0' }}>No Unlocked Properties Yet</h4>
          <p style={{ color: 'rgba(15,23,42,0.45)', fontSize: '0.8rem', margin: '0 0 1rem 0', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
            Properties you pay document fee for (to view surveyor details and blueprints) will appear in this registry list.
          </p>
          <Link to="/browse" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1.25rem', fontSize: '0.8rem' }}>
            Browse Catalog
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {items.map(({ property, status, transaction_id, payment_method }) => (
            <div key={property.id} className="property-card dashboard-card" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
              <div className="dashboard-card-img" style={{
                backgroundImage: `url(${PROPERTY_IMAGES[property.type] ?? PROPERTY_IMAGES.default})`
              }} />
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="badge-verified" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(15,23,42,0.05)', color: '#0f172a' }}>
                          {property.type}
                        </span>
                        
                        {status === 'SUCCESS' && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Unlocked
                          </span>
                        )}
                        {status === 'PENDING' && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', background: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Pending Review
                          </span>
                        )}
                        {status === 'REJECTED' && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Rejected
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0.25rem' }}>
                        {property.city}{property.district ? `, ${property.district}` : ''}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontWeight: 600, margin: 0 }}>
                        {property.area} {property.area_unit} · <span style={{ color: '#b8963e', fontWeight: 800 }}>{formatPrice(property.price)}</span>
                      </p>
                    </div>
                    <Link to={`/property/${property.id}`} className="btn-secondary" style={{
                      padding: '0.5rem 1rem', fontSize: '0.75rem', textDecoration: 'none', borderRadius: '6px'
                    }}>
                      View Listing
                    </Link>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  {status === 'SUCCESS' ? (
                    <>
                      <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                        UNLOCKED DEED ATTACHMENTS
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {property.documents && property.documents.length > 0 ? (
                          property.documents.map((doc, idx) => (
                            <Link key={idx} to={`/viewer/${property.id}/${idx}`} style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              padding: '0.45rem 0.85rem', border: '1px solid rgba(15,23,42,0.1)', borderRadius: '6px',
                              fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', textDecoration: 'none',
                              background: 'rgba(15,23,42,0.02)', transition: 'all 0.15s'
                            }}
                              onMouseEnter={e => { e.currentTarget.style.borderColor = '#0f2042'; e.currentTarget.style.background = 'rgba(15, 32, 66, 0.05)'; }}
                              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(15,23,42,0.1)'; e.currentTarget.style.background = 'rgba(15,23,42,0.02)'; }}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              {doc.type}
                            </Link>
                          ))
                        ) : (
                          <p style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)', fontStyle: 'italic', margin: 0 }}>No documents uploaded by seller yet.</p>
                        )}
                      </div>
                    </>
                  ) : status === 'PENDING' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(234, 179, 8, 0.04)', border: '1px solid rgba(234, 179, 8, 0.15)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>⏳</span>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#854d0e', fontWeight: 600 }}>
                        Verification Pending: Transaction <strong style={{ fontFamily: 'monospace' }}>{transaction_id}</strong> via <strong>{payment_method}</strong> is under review. Typically verified in 2–4 hours.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>❌</span>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>
                        Verification Rejected: Transaction <strong style={{ fontFamily: 'monospace' }}>{transaction_id}</strong> was rejected. Please contact support or re-submit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Buy Panel ──────────────────────────────────────────────────────────────────
function BuyPanel() {
  return <PurchasedPropertiesList title="My Unlocked Land Registry" />;
}

// ── Sell Panel ─────────────────────────────────────────────────────────────────
function SellPanel() {
  const [properties, setProperties] = useState<SellerProperty[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [cancelDeleteConfirmId, setCancelDeleteConfirmId] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      const [propsRes, statsRes] = await Promise.all([
        api.get<SellerProperty[]>('/properties/seller/me'),
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

  useEffect(() => {
    fetchAll();
  }, []);

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

  const handleDismissRejection = async (id: string) => {
    try {
      await api.patch(`/properties/${id}/dismiss-rejection`);
      await fetchAll();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to dismiss rejection alert');
    }
  };

  const totalViews = properties.reduce((sum, p) => sum + p.view_count, 0);
  const totalUnlocks = stats?.total_unlocks ?? 0;

  const statusStyle = (status: string): React.CSSProperties => {
    if (status === 'ACTIVE') return { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' };
    if (status === 'REJECTED') return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' };
    if (status === 'SOLD_OUT') return { background: '#f3e8ff', color: '#7c3aed', border: '1px solid #ddd6fe' };
    if (status === 'DELETE_REQUESTED') return { background: '#fef2f2', color: '#b91c1c', border: '1px solid #fca5a5' };
    return { background: '#fef9c3', color: '#a16207', border: '1px solid #fde68a' };
  };

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.75rem', fontWeight: 600, border: '1.5px solid',
    borderRadius: '7px', padding: '0.35rem 0.75rem', cursor: 'pointer',
    transition: 'all 0.15s ease', fontFamily: 'inherit', background: 'transparent',
  };

  return (
    <div className="fade-in">
      {/* CTA Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <Link to="/dashboard/seller/upload" className="btn-olx-sell">
          + Add New Listing
        </Link>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        {[
          { label: 'Active Listings', value: properties.length, color: '#0f172a' },
          { label: 'Views Generated', value: totalViews, color: '#0f2042' },
          { label: 'Document Unlocks', value: totalUnlocks, color: '#b8963e' },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '12px', padding: '1.25rem 1.5rem',
            border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)'
          }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>{stat.label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Rejection Banners */}
      {properties.filter(p => p.rejection_info).map(p => (
        <div key={p.id} style={{
          background: 'rgba(254, 242, 242, 0.85)',
          border: '1.5px solid #fca5a5',
          borderRadius: '12px',
          padding: '1.25rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 15px rgba(220, 38, 38, 0.03)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <span style={{ fontSize: '1.25rem' }}>⚠️</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#991b1b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Rejection Alert: 
                  <Link 
                    to={`/property/${p.id}`} 
                    style={{ 
                      color: '#3b82f6', 
                      textDecoration: 'underline', 
                      fontWeight: 800, 
                      fontSize: '0.85rem' 
                    }}
                  >
                    View Prop
                  </Link>
                </h4>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.72rem', color: '#b91c1c', fontWeight: 600 }}>
                  {p.rejection_info?.type === 'NEW_PROPERTY_REJECTION' && 'New listing verification was rejected.'}
                  {p.rejection_info?.type === 'EDIT_REJECTION' && 'Listing updates were rejected.'}
                  {p.rejection_info?.type === 'DELETE_REJECTION' && 'Delete request was rejected.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismissRejection(p.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#991b1b',
                fontWeight: 800,
                fontSize: '0.75rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: '0.2rem 0.5rem'
              }}
            >
              Dismiss
            </button>
          </div>

          <div style={{ background: '#fff', borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid rgba(220, 38, 38, 0.1)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#7f1d1d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Admin Feedback:</span>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', color: '#374151', lineHeight: 1.4, fontWeight: 500 }}>
              "{p.rejection_info?.message}"
            </p>
          </div>

          {p.rejection_info?.rejected_details && Object.keys(p.rejection_info.rejected_details).length > 0 && (
            <div style={{ fontSize: '0.78rem', color: '#7f1d1d' }}>
              <span style={{ fontWeight: 700 }}>Attempted changes that were rejected:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.5rem', marginTop: '0.4rem' }}>
                {Object.entries(p.rejection_info.rejected_details).map(([key, val]) => (
                  <div key={key} style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid rgba(220, 38, 38, 0.08)', borderRadius: '6px', padding: '0.4rem 0.6rem' }}>
                    <strong style={{ color: '#991b1b', fontSize: '0.7rem', textTransform: 'uppercase', display: 'block' }}>
                      {key.replace(/_/g, ' ')}
                    </strong>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4b5563' }}>
                      {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val || '-')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Listings Table */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)'
      }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
          <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>Property Listings</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(15, 23, 42, 0.02)' }}>
                {['Listing Detail', 'Status', 'Views / Unlocks', 'Manage'].map((h, i) => (
                  <th key={h} style={{
                    padding: '0.85rem 1.5rem', textAlign: i === 2 ? 'center' : i === 3 ? 'right' : 'left',
                    fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)', fontSize: '0.85rem' }}>Acquiring list...</td></tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍂</div>
                    <p style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>No Listings Added</p>
                    <p style={{ color: 'rgba(15,23,42,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>Create property listings to start selling land.</p>
                    <Link to="/dashboard/seller/upload" className="btn-primary" style={{ textDecoration: 'none', fontSize: '0.75rem' }}>
                      Add First Property
                    </Link>
                  </td>
                </tr>
              ) : properties.map((listing) => (
                <tr key={listing.id} style={{ borderTop: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                      {listing.city}{listing.district ? `, ${listing.district}` : ''}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(15, 23, 42, 0.45)', fontFamily: 'monospace', marginTop: '0.2rem' }}>
                      Ref ID: {listing.id.slice(-8).toUpperCase()}
                    </div>
                    {listing.status === 'DELETE_REQUESTED' && (
                      <div style={{ fontSize: '0.68rem', color: '#b91c1c', marginTop: '0.2rem', fontWeight: 600 }}>
                        ⏳ Awaiting admin approval for deletion
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{
                      ...statusStyle(listing.status),
                      borderRadius: '9999px', padding: '0.25rem 0.75rem',
                      fontSize: '0.68rem', fontWeight: 700, display: 'inline-block',
                      textTransform: 'uppercase'
                    }}>
                      {listing.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: '#0f172a' }}>{listing.view_count}</span>
                    <span style={{ color: 'rgba(15, 23, 42, 0.2)', margin: '0 0.4rem' }}>/</span>
                    <span style={{ color: '#b8963e' }}>{stats?.unlock_counts?.[listing.id] ?? 0}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {listing.status !== 'DELETE_REQUESTED' && (
                        <Link to={`/dashboard/seller/edit/${listing.id}`} className="btn-secondary" style={{
                          padding: '0.45rem 1rem', fontSize: '0.75rem', textDecoration: 'none'
                        }}>Edit</Link>
                      )}

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
                        >
                          {listing.status === 'SOLD_OUT' ? 'Relist' : 'Sold Out'}
                        </button>
                      )}

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
                        >
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
      </div>

      {/* Delete Confirm Modal */}
      {deleteConfirmId && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.75rem', maxWidth: '420px', width: '100%', border: '1px solid rgba(0, 0, 0, 0.15)' }}>
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
        </div>,
        document.body
      )}

      {/* Cancel Delete Confirm Modal */}
      {cancelDeleteConfirmId && createPortal(
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: '14px', padding: '1.75rem', maxWidth: '420px', width: '100%', border: '1px solid rgba(0, 0, 0, 0.15)' }}>
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
        </div>,
        document.body
      )}

      {/* Purchased properties for sellers who buy other seller properties */}
      <div style={{ marginTop: '3.5rem' }}>
        <PurchasedPropertiesList title="My Purchased Land Registry" />
      </div>
    </div>
  );
}

export default function UnifiedDashboard() {
  const location = useLocation();
  const isSeller = location.pathname.includes('seller');
  const [showPendingBanner, setShowPendingBanner] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    api.get<User>('/auth/me')
      .then(res => {
        setCurrentUser(res.data);
        if (res.data.phone_number) {
          setPhoneInput(res.data.phone_number);
        }
      })
      .catch(err => console.error('Failed to fetch user info', err));
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length !== 10) {
      setErrorMsg('Phone number must be exactly 10 digits.');
      return;
    }
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.post('/auth/become-seller', { phone_number: phoneInput });
      const res = await api.get<User>('/auth/me');
      setCurrentUser(res.data);
      setShowRequestModal(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem('show_seller_pending_msg') === 'true') {
      setShowPendingBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    localStorage.removeItem('show_seller_pending_msg');
    setShowPendingBanner(false);
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {showPendingBanner && (
          <div style={{
            background: 'rgba(184, 150, 62, 0.08)',
            border: '1px solid #b8963e',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            boxShadow: '0 4px 20px rgba(184, 150, 62, 0.05)'
          }}>
            <button onClick={handleDismissBanner} style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'none', border: 'none', color: '#b8963e',
              fontSize: '1.25rem', cursor: 'pointer', fontWeight: 'bold'
            }}>&times;</button>
            <h3 style={{ margin: 0, color: '#b8963e', fontSize: '1.05rem', fontWeight: 800 }}>Seller Verification Request Submitted!</h3>
            <p style={{ margin: 0, color: 'rgba(15, 23, 42, 0.7)', fontSize: '0.85rem', lineHeight: 1.4 }}>
              Our team will review your voter ID/Aadhaar/PAN details and approve your seller request soon. 
              Until then, you can browse through the catalog and use the platform as a buyer.
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              <Link to="/browse" className="btn-primary" style={{ textDecoration: 'none', padding: '0.4rem 1rem', fontSize: '0.75rem', background: '#b8963e', border: 'none' }} onClick={handleDismissBanner}>
                Browse Catalog
              </Link>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(15,23,42,0.06)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {isSeller ? 'My Listings Panel' : 'My Property Registry'}
          </h1>
          <p style={{ color: 'rgba(15,23,42,0.55)', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 600 }}>
            {isSeller ? 'Monitor active listings, views, and buyer payouts' : 'Manage purchased land survey deeds and certificates'}
          </p>
        </div>

        {/* Custom Seller Promotion Banner for normal Users */}
        {!isSeller && (currentUser?.role === 'USER' || currentUser?.role === 'BUYER') && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 8px 30px rgba(15, 23, 42, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ flex: '1 1 500px' }}>
              <span style={{
                background: '#b8963e',
                color: '#ffffff',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Become a Seller
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.75rem 0 0.5rem 0', fontFamily: 'inherit' }}>
                Start Selling Land on <span className="notranslate">Territory</span>
              </h2>
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Want to list your own properties and generate income? Upgrade your account to become a verified seller, list new lands, and track buyers.
              </p>
            </div>
            <div>
              {currentUser.is_seller_pending ? (
                <div style={{
                  background: 'rgba(184, 150, 62, 0.15)',
                  border: '1px solid #b8963e',
                  color: '#b8963e',
                  borderRadius: '8px',
                  padding: '0.75rem 1.25rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.1rem' }}>⏳</span> Request Pending Approval
                </div>
              ) : (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="btn-primary"
                  style={{
                    background: '#b8963e',
                    border: 'none',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(184, 150, 62, 0.3)',
                    cursor: 'pointer'
                  }}
                >
                  Become a Seller
                </button>
              )}
            </div>
          </div>
        )}

        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {isSeller ? <SellPanel /> : <BuyPanel />}
        </div>

        {/* Become a Seller Request Modal */}
        {showRequestModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', zIndex: 1000
          }}>
            <div className="fade-in" style={{
              background: '#ffffff',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              borderRadius: '16px',
              boxShadow: '0 24px 64px rgba(15, 23, 42, 0.15)',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              position: 'relative'
            }}>
              <button
                onClick={() => { setShowRequestModal(false); setErrorMsg(''); }}
                style={{
                  position: 'absolute', top: '1.25rem', right: '1.25rem',
                  background: 'none', border: 'none', color: 'rgba(15, 23, 42, 0.4)',
                  fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                &times;
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
                Become a Seller
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.6)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                Submit a request to become a verified seller. Our team will review your details and upgrade your role.
              </p>

              {errorMsg && (
                <div style={{
                  background: 'rgba(255, 59, 48, 0.06)',
                  border: '1px solid #ff3b30',
                  color: '#ff3b30',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}>
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleRequestSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(15, 23, 42, 0.6)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Gmail Account</label>
                  <input
                    type="text"
                    value={currentUser?.full_name || ''}
                    disabled
                    style={{
                      width: '100%', padding: '0.65rem 1rem', borderRadius: '8px',
                      border: '1px solid rgba(15, 23, 42, 0.08)', background: '#f8fafc',
                      color: 'rgba(15, 23, 42, 0.5)', fontSize: '0.85rem', fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(15, 23, 42, 0.6)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Gmail Email</label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    style={{
                      width: '100%', padding: '0.65rem 1rem', borderRadius: '8px',
                      border: '1px solid rgba(15, 23, 42, 0.08)', background: '#f8fafc',
                      color: 'rgba(15, 23, 42, 0.5)', fontSize: '0.85rem', fontWeight: 600,
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(15, 23, 42, 0.6)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Phone Number (10 digits)</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter 10-digit number"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{
                      width: '100%', padding: '0.65rem 1rem', borderRadius: '8px',
                      border: '1px solid rgba(15, 23, 42, 0.1)', background: '#ffffff',
                      color: '#0f172a', fontSize: '0.85rem', fontWeight: 600, outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                  style={{
                    width: '100%', marginTop: '0.5rem', background: '#b8963e',
                    border: 'none', height: '44px', fontWeight: 700, fontSize: '0.85rem',
                    boxShadow: '0 4px 12px rgba(184, 150, 62, 0.2)',
                    cursor: submitting ? 'wait' : 'pointer'
                  }}
                >
                  {submitting ? 'Submitting Request...' : 'Send Promotion Request'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
