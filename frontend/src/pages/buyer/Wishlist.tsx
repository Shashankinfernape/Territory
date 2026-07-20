import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import type { Property } from '../../lib/types';
import { useSettings } from '../../contexts/SettingsContext';
import { PropertyCard } from '../../components/ui/PropertyCard';
import { CustomSelect } from '../../components/ui/CustomSelect';

export default function Wishlist() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [filterType, setFilterType] = useState('');
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

  const displayedProperties = properties.filter(p => !filterType || p.type === filterType);

  return (
    <div className="fade-in" style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem clamp(1rem, 5vw, 2.5rem)', minHeight: '80vh' }}>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '1.5rem', 
          marginBottom: '0.5rem'
        }}>
          {/* Icon, Title, and Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', zIndex: 10 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))' }}>
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ffffff" stroke="#2C2C2C" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.9rem', fontWeight: 600, color: 'inherit', margin: 0, letterSpacing: '-0.01em', marginRight: '0.75rem' }}>
              Saved Properties
            </h1>
            
            {/* Filters Drop Section - Map View Style */}
            <div className="map-search-filters" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 100 }}>
              <CustomSelect
                value={filterType}
                onChange={(val) => setFilterType(val)}
                placeholder="Types"
                options={[
                  { label: 'Types', value: '' },
                  { label: 'Agricultural Land', value: 'Agricultural Land' },
                  { label: 'Flat Plot', value: 'Flat Plot' },
                  { label: 'Farm Land', value: 'Farm Land' },
                  { label: 'Residential Plot', value: 'Residential Plot' },
                  { label: 'Commercial Plot', value: 'Commercial Plot' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {!isLoggedIn ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px', border: '1px dashed rgba(44, 44, 44, 0.15)'
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1.25rem' }}>🔒</div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#2C2C2C', fontSize: '1.6rem', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Secure Profile Required</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#6b7280', fontSize: '0.95rem', maxWidth: '320px', margin: '0 auto 2rem', lineHeight: 1.6, letterSpacing: '-0.2px' }}>Please sign in to your registry profile to monitor saved properties.</p>
          <Link to="/login" style={{ 
            textDecoration: 'none', background: '#2C2C2C', color: '#ffffff', 
            padding: '0.8rem 2rem', borderRadius: '30px', fontWeight: 600, 
            fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(44, 44, 44, 0.2)', transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            Sign In
          </Link>
        </div>
      ) : properties.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '24px', border: '1px dashed rgba(44, 44, 44, 0.15)'
        }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(44, 44, 44, 0.04)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="none" stroke="#2C2C2C" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: '#2C2C2C', fontSize: '1.6rem', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Your watchlist is empty</h3>
          <p style={{ fontFamily: "'Inter', sans-serif", color: '#6b7280', fontSize: '0.95rem', maxWidth: '320px', margin: '0 auto 2rem', lineHeight: 1.6, letterSpacing: '-0.2px' }}>Tap the heart outline on listed properties to follow price changes.</p>
          <Link to="/" style={{ 
            textDecoration: 'none', background: '#2C2C2C', color: '#ffffff', 
            padding: '0.8rem 2rem', borderRadius: '30px', fontWeight: 600, 
            fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(44, 44, 44, 0.2)', transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
            Browse Properties
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
          {displayedProperties.map(prop => (
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
