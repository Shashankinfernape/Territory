import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import { getPropertyImageUrl, type Property } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import TextType from '../../components/TextType';

const TYPES = ['', 'Agricultural Land', 'Farm Land', 'Flat Plot', 'Residential Plot', 'Commercial Plot'];

export default function Home() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const isLoggedIn = !!getToken();

  const location = useLocation();
  const searchSectionRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinArea, setFilterMinArea] = useState('');
  const [filterMaxArea, setFilterMaxArea] = useState('');
  const [filterWaterSource, setFilterWaterSource] = useState('');
  const [filterRoadAccess, setFilterRoadAccess] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/auth/wishlist').then(r => setWishlist(r.data.wishlist)).catch(() => {});
  }, [isLoggedIn]);

  // Auto-scroll to search when landing via "Buy" action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'buy') {
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 600);
    }
  }, [location.search]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (filterType) params.type = filterType;
      if (filterDistrict) params.district = filterDistrict;
      if (filterMinPrice) params.min_price = filterMinPrice;
      if (filterMaxPrice) params.max_price = filterMaxPrice;
      if (filterMinArea) params.min_area = filterMinArea;
      if (filterMaxArea) params.max_area = filterMaxArea;
      if (filterWaterSource) params.water_source = filterWaterSource;
      if (filterRoadAccess) params.road_access = filterRoadAccess;
      const res = await api.get('/properties/', { params });
      setProperties(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [searchTerm, filterType, filterDistrict, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea, filterWaterSource, filterRoadAccess]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  const clearFilters = () => {
    setSearchTerm(''); setFilterType(''); setFilterDistrict('');
    setFilterMinPrice(''); setFilterMaxPrice('');
    setFilterMinArea(''); setFilterMaxArea('');
    setFilterWaterSource(''); setFilterRoadAccess('');
  };

  const hasActive = filterType || filterDistrict || filterMinPrice || filterMaxPrice
    || filterMinArea || filterMaxArea || filterWaterSource || filterRoadAccess;

  const toggleWishlist = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isLoggedIn) return;
    setTogglingId(id);
    try {
      const r = await api.post(`/auth/wishlist/${id}`);
      setWishlist(r.data.wishlist);
    } catch { /* silent */ }
    finally { setTogglingId(null); }
  };

  return (
    <div className="fade-in" style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', paddingBottom: '5rem' }}>

      {/* ── HERO ── */}
      <div className="hero-cinematic">
        <div className="hero-inner">

          <TextType
            as="h1"
            className="hero-title"
            text={"Land that's truly\nyours to own."}
            typingSpeed={40}
            pauseDuration={2000}
            showCursor={true}
            cursorCharacter="|"
            loop={false}
          />

          <p className="hero-sub">
            Every plot survey-certified, every seller verified.<br />No middlemen. No hidden fees. Just land.
          </p>

          {/* Search bar */}
          <div ref={searchSectionRef} id="search-section" className="search-bar" style={{ maxWidth: '680px', marginTop: '0.75rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#898989" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '0.75rem' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search city, district, village or survey number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ fontSize: '1rem', padding: '0.85rem 0.5rem' }}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-filter${hasActive ? ' active' : ''}`}
              style={{ borderRadius: '6px', fontSize: '0.9375rem', padding: '0.625rem 1.25rem' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
              Filters{hasActive ? ' •' : ''}
            </button>
            <button
              onClick={fetchProperties}
              className="btn-primary"
              style={{ borderRadius: '6px', fontSize: '0.9375rem', padding: '0.625rem 1.5rem' }}
            >
              Search
            </button>
          </div>

          {/* Type tabs — inside hero */}
          <div className="fast-filters-container">

            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  border: filterType === t ? '1px solid #101010' : '1px solid #e5e7eb',
                  background: filterType === t ? '#101010' : '#ffffff',
                  color: filterType === t ? '#ffffff' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: filterType === t ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.2px'
                }}
              >
                {t || 'All'}
              </button>
            ))}
          </div>
          <div className="fast-filters-hint">
            ← Swipe to see more land types →
          </div>

        </div>
      </div>







      {/* ── EXPANDABLE FILTERS ── */}
      {showFilters && (
        <div className="fade-in" style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
          padding: '1.75rem 2rem',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <span className="text-caption" style={{ fontWeight: 600, color: '#898989', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Filter Specifications
              </span>
              {hasActive && (
                <button onClick={clearFilters} style={{ fontSize: '0.875rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
                  Reset all
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>District</label>
                <input type="text" value={filterDistrict} onChange={e => setFilterDistrict(e.target.value)} placeholder="Coimbatore" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Min Price (₹)</label>
                <input type="number" value={filterMinPrice} onChange={e => setFilterMinPrice(e.target.value)} placeholder="0" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Max Price (₹)</label>
                <input type="number" value={filterMaxPrice} onChange={e => setFilterMaxPrice(e.target.value)} placeholder="Any" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Min Area</label>
                <input type="number" value={filterMinArea} onChange={e => setFilterMinArea(e.target.value)} placeholder="0" className="form-input" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Water Source</label>
                <select value={filterWaterSource} onChange={e => setFilterWaterSource(e.target.value)} className="form-input">
                  {['', 'Borewell', 'Open Well', 'Canal', 'River', 'Rainfed'].map(o => <option key={o} value={o}>{o || 'Any'}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#242424', marginBottom: '0.5rem', letterSpacing: '-0.2px' }}>Road Access</label>
                <select value={filterRoadAccess} onChange={e => setFilterRoadAccess(e.target.value)} className="form-input">
                  {['', 'National Highway', 'State Highway', 'District Road', 'Village Road'].map(o => <option key={o} value={o}>{o || 'Any'}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── LISTINGS GRID ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.9375rem', color: '#6b7280', fontWeight: 500, letterSpacing: '-0.2px' }}>
            {loading ? 'Loading...' : `${properties.length} listing${properties.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="property-card" style={{ height: '360px' }}>
                <div className="skeleton" style={{ height: '210px', borderRadius: '12px 12px 0 0' }} />
                <div style={{ padding: '1.25rem', flex: 1 }}>
                  <div className="skeleton" style={{ height: '20px', width: '55%', marginBottom: '0.6rem' }} />
                  <div className="skeleton" style={{ height: '14px', width: '38%', marginBottom: '1.25rem' }} />
                  <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '99px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '6rem 2rem', background: '#ffffff',
            borderRadius: '12px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: '1rem',
            boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px'
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '12px',
              background: '#f4f4f4', border: '1px solid #e5e7eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#898989" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.25rem', color: '#101010', letterSpacing: '0.01em' }}>No listings found</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', marginTop: '0.4rem', letterSpacing: '-0.2px' }}>Try adjusting your filters or search term.</p>
            </div>
            {hasActive && <button onClick={clearFilters} className="btn-primary" style={{ marginTop: '0.5rem' }}>Clear filters</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {properties.map(p => (
              <div key={p.id} className="property-card">
                <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>

                  {/* Image */}
                  <div className="card-img" style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#f4f4f4', flexShrink: 0 }}>
                    <img
                      src={getPropertyImageUrl(p)}
                      alt={p.type}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Gradient for text legibility */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)'
                    }} />

                    {/* Price sticker */}
                    <div style={{
                      position: 'absolute', bottom: '0.85rem', left: '0.85rem',
                      background: 'rgba(255,255,255,0.96)',
                      borderRadius: '6px',
                      padding: '0.35rem 0.8rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#101010', lineHeight: 1, margin: 0, fontFamily: "'Poppins', sans-serif" }}>
                        {formatPrice(p.price)}
                      </p>
                    </div>

                    {/* Type badge */}
                    <span className="badge-active" style={{ position: 'absolute', bottom: '0.85rem', right: '0.85rem', fontSize: '0.75rem' }}>
                      {p.type}
                    </span>

                    {/* Wishlist */}
                    {isLoggedIn && (
                      <button
                        onClick={e => toggleWishlist(e, p.id)}
                        disabled={togglingId === p.id}
                        style={{
                          position: 'absolute', top: '0.85rem', right: '0.85rem', zIndex: 10,
                          width: '34px', height: '34px', borderRadius: '50%',
                          background: 'rgba(255,255,255,0.95)', border: '1px solid #e5e7eb',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'transform 0.15s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24"
                          fill={wishlist.includes(p.id) ? '#101010' : 'none'}
                          stroke={wishlist.includes(p.id) ? '#101010' : '#6b7280'}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div>
                      <h4 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#101010', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif", letterSpacing: '0.01em' }}>
                        {p.city}{p.district ? `, ${p.district}` : ''}
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 400, letterSpacing: '-0.2px', marginTop: '0.2rem' }}>
                        {p.area} {p.area_unit} · Deed Verified
                      </p>
                    </div>

                    <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span className="badge-verified" style={{ fontSize: '0.75rem' }}>Active</span>
                      {p.water_source && (
                        <span style={{ fontSize: '0.8125rem', color: '#898989', fontWeight: 400 }}>
                          {p.water_source}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="card-action-bar">
                    <span className="btn-secondary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'center' }}>
                      View details &rarr;
                    </span>
                  </div>

                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
