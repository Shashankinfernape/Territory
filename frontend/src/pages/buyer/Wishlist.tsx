import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import type { Property } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import { getPropertyImageUrl } from '../../lib/types';

export default function Wishlist() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const isLoggedIn = !!getToken();

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    api.get<Property[]>('/wishlist/properties')
      .then(res => setProperties(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await api.post(`/auth/wishlist/${id}`);
      setProperties(properties.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 400, letterSpacing: '-0.2px' }}>Consulting land ledger...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem', minHeight: '80vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #e5e7eb',
            boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#101010" stroke="#101010" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2rem', fontWeight: 600, color: '#101010', margin: 0, letterSpacing: '0.01em' }}>
            Saved Properties
          </h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 400, letterSpacing: '-0.2px' }}>
          {properties.length > 0 ? `You have highlighted ${properties.length} land asset${properties.length > 1 ? 's' : ''} for monitoring.` : 'Properties you mark as favorite will appear here.'}
        </p>
      </div>

      {!isLoggedIn ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#ffffff', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#101010', fontSize: '1.125rem', marginBottom: '0.5rem', letterSpacing: '0.01em' }}>Secure Profile Required</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.5, letterSpacing: '-0.2px' }}>Please sign in to your registry profile to monitor saved properties.</p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Sign In</Link>
        </div>
      ) : properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#ffffff', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', border: '1px solid #e5e7eb' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#f4f4f4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', border: '1px solid #e5e7eb'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#101010', fontSize: '1.125rem', marginBottom: '0.5rem', letterSpacing: '0.01em' }}>Your watchlist is empty</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.5, letterSpacing: '-0.2px' }}>Tap the heart outline on listed properties to follow price changes.</p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Browse Properties</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {properties.map(prop => (
            <div key={prop.id} className="property-card" style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Image */}
              <div className="card-img" style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                <img src={getPropertyImageUrl(prop)} alt={prop.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {/* Remove heart button */}
                <button
                  onClick={() => handleRemove(prop.id)}
                  disabled={removing === prop.id}
                  style={{
                    position: 'absolute', top: '0.85rem', right: '0.85rem',
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e5e7eb',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  title="Remove from wishlist"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff3b30" stroke="#ff3b30" strokeWidth="0">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </button>
                {/* Type badge */}
                <span className="badge-active" style={{ position: 'absolute', bottom: '0.85rem', right: '0.85rem' }}>
                  {prop.type}
                </span>
              </div>

              {/* Info */}
              <div style={{ padding: '1.5rem', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#101010', margin: '0 0 0.25rem', letterSpacing: '0.01em' }}>
                    {prop.city}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 400, marginBottom: '1.25rem', letterSpacing: '-0.2px' }}>
                    {prop.district}, {prop.state}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500, letterSpacing: '-0.2px' }}>
                      {prop.area} {prop.area_unit}
                    </span>
                    <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#101010', fontFamily: "'Poppins', sans-serif" }}>
                      {formatPrice(prop.price)}
                    </span>
                  </div>
                </div>
                <Link to={`/property/${prop.id}`} className="btn-secondary" style={{
                  display: 'block', textAlign: 'center', padding: '0.625rem',
                  fontSize: '0.875rem', textDecoration: 'none'
                }}>View Details</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
