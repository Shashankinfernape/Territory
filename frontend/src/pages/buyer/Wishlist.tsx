import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import type { Property } from '../../lib/types';
import { useSettings } from '../../contexts/SettingsContext';
import { PropertyCard } from '../../components/ui/PropertyCard';
export default function Wishlist() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const isLoggedIn = !!getToken();
  const { animationSetting } = useSettings();

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }

    api.get<Property[]>('/auth/wishlist/properties')
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
      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '3.5rem 0.75rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 400, letterSpacing: '-0.2px' }}>Consulting land ledger...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: '100%', margin: '0 auto', padding: '3.5rem 0.75rem', minHeight: '80vh' }}>

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#2C2C2C" stroke="#2C2C2C" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2rem', fontWeight: 600, color: '#2C2C2C', margin: 0, letterSpacing: '0.01em' }}>
            Saved Properties
          </h1>
        </div>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 400, letterSpacing: '-0.2px' }}>
          {properties.length > 0 ? `You have highlighted ${properties.length} land asset${properties.length > 1 ? 's' : ''} for monitoring.` : 'Properties you mark as favorite will appear here.'}
        </p>
      </div>

      {!isLoggedIn ? (
        <div style={{
          textAlign: 'center', padding: '5rem 2rem',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2C2C2C', fontSize: '1.125rem', marginBottom: '0.5rem', letterSpacing: '0.01em' }}>Secure Profile Required</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.5, letterSpacing: '-0.2px' }}>Please sign in to your registry profile to monitor saved properties.</p>
          <Link to="/login" className="btn-primary" style={{ textDecoration: 'none' }}>Sign In</Link>
        </div>
      ) : properties.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '5rem 2rem',
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', border: '1px solid #e5e7eb'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#FDFBF7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', border: '1px solid #e5e7eb'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 0 0 6.364L12 20.364l7.682-7.682a4.5 4.5 0 0 0-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 0 0-6.364 0z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, color: '#2C2C2C', fontSize: '1.125rem', marginBottom: '0.5rem', letterSpacing: '0.01em' }}>Your watchlist is empty</h3>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', maxWidth: '300px', margin: '0 auto 1.5rem', lineHeight: 1.5, letterSpacing: '-0.2px' }}>Tap the heart outline on listed properties to follow price changes.</p>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none' }}>Browse Properties</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {properties.map(prop => (
            <PropertyCard 
              key={prop.id} 
              property={prop} 
              isWishlisted={true} 
              onToggleWishlist={(e) => {
                e.preventDefault();
                handleRemove(prop.id);
              }}
              isTogglingWishlist={removing === prop.id}
              animationSetting={animationSetting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
