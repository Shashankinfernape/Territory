import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Property } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import { PROPERTY_IMAGES } from '../../lib/types';

interface SellerProperty {
  id: string;
  city: string;
  district?: string;
  status: string;
  view_count: number;
}

interface SellerStats {
  unlock_counts: Record<string, number>;
  total_unlocks: number;
  total_revenue: number;
}

// ── Buy Panel ──────────────────────────────────────────────────────────────────
function BuyPanel() {
  const [unlockedProps, setUnlockedProps] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Property[]>('/payments/unlocked-properties')
      .then(res => setUnlockedProps(res.data))
      .catch(() => setError('Failed to load your unlocked properties.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
      <p style={{ color: 'rgba(15,23,42,0.6)', fontSize: '0.9rem', fontWeight: 600 }}>Loading unlock list...</p>
    </div>
  );

  return (
    <div className="fade-in">
      {error && <div className="error-box" style={{ marginBottom: '1.5rem' }}>{error}</div>}

      {!error && unlockedProps.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 1.5rem', background: '#ffffff',
          borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗺️</div>
          <h3 style={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>No Unlocked Properties</h3>
          <p style={{ color: 'rgba(15,23,42,0.5)', fontSize: '0.88rem', margin: '0.5rem 0 1.5rem' }}>
            Lands you verify and pay for contact information will appear in this registry panel.
          </p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>
            Browse Properties
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {unlockedProps.map((prop) => (
            <div key={prop.id} className="property-card dashboard-card">
              <div className="dashboard-card-img" style={{
                backgroundImage: `url(${PROPERTY_IMAGES[prop.type] ?? PROPERTY_IMAGES.default})`
              }} />
              <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge-verified" style={{ fontSize: '0.65rem' }}>
                        {prop.type}
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0.25rem' }}>
                        {prop.city}{prop.district ? `, ${prop.district}` : ''}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontWeight: 600 }}>
                        {prop.area} {prop.area_unit} · <span style={{ color: '#b8963e', fontWeight: 800 }}>{formatPrice(prop.price)}</span>
                      </p>
                    </div>
                    <Link to={`/property/${prop.id}`} className="btn-secondary" style={{
                      padding: '0.5rem 1rem', fontSize: '0.75rem', textDecoration: 'none'
                    }}>
                      View Listing
                    </Link>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(15,23,42,0.06)' }}>
                  <h4 style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                    UNLOCKED DEED ATTACHMENTS
                  </h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {prop.documents && prop.documents.length > 0 ? (
                      prop.documents.map((doc, idx) => (
                        <Link key={idx} to={`/viewer/${prop.id}/${idx}`} style={{
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
                      <p style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.4)', fontStyle: 'italic' }}>No documents uploaded by seller yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Sell Panel ─────────────────────────────────────────────────────────────────
function SellPanel() {
  const [properties, setProperties] = useState<SellerProperty[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchAll();
  }, []);

  const totalViews = properties.reduce((sum, p) => sum + p.view_count, 0);
  const totalUnlocks = stats?.total_unlocks ?? 0;

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
            background: '#ffffff', borderRadius: '12px', padding: '1.25rem 1.5rem',
            border: '1px solid rgba(15, 23, 42, 0.06)', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)'
          }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>{stat.label}</p>
            <p style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color, lineHeight: 1.1 }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Listings Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
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
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className="badge-verified" style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem', fontWeight: 700 }}>
                      {listing.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700 }}>
                    <span style={{ color: '#0f172a' }}>{listing.view_count}</span>
                    <span style={{ color: 'rgba(15, 23, 42, 0.2)', margin: '0 0.4rem' }}>/</span>
                    <span style={{ color: '#b8963e' }}>{stats?.unlock_counts?.[listing.id] ?? 0}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                    <Link to={`/dashboard/seller/edit/${listing.id}`} className="btn-secondary" style={{
                      padding: '0.45rem 1rem', fontSize: '0.75rem', textDecoration: 'none'
                    }}>Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Buy Dashboard ──────────────────────────────────────────────────────────────
export default function UnifiedDashboard() {
  const location = useLocation();
  const isSeller = location.pathname.includes('seller');

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid rgba(15,23,42,0.06)', paddingBottom: '1rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {isSeller ? 'My Listings Panel' : 'My Property Registry'}
          </h1>
          <p style={{ color: 'rgba(15,23,42,0.55)', fontSize: '0.85rem', marginTop: '0.25rem', fontWeight: 600 }}>
            {isSeller ? 'Monitor active listings, views, and buyer payouts' : 'Manage purchased land survey deeds and certificates'}
          </p>
        </div>

        <div style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {isSeller ? <SellPanel /> : <BuyPanel />}
        </div>
      </div>
    </div>
  );
}
