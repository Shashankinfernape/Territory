import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import { getPropertyImageUrl, type Property } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import TextType from '../../components/TextType';
import { useSettings } from '../../contexts/SettingsContext';
import GlareHover from '../../components/ui/GlareHover';

const TYPES = ['', 'Agricultural Land', 'Farm Land', 'Flat Plot', 'Residential Plot', 'Commercial Plot'];

export default function Home() {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { animationSetting } = useSettings();
  const [selectedType, _setSelectedType] = useState('');
  const isLoggedIn = !!getToken();
  const navigate = useNavigate();
  const location = useLocation();
  const searchSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/auth/wishlist').then(r => setWishlist(r.data.wishlist)).catch(() => {});
  }, [isLoggedIn]);

  // Load featured showcase (first 6 active listings)
  useEffect(() => {
    api.get('/properties/', { params: {} })
      .then(r => setFeatured((r.data as Property[]).slice(0, 6)))
      .catch(() => {});
  }, []);

  // Auto-scroll to search when landing via "Buy" action
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'buy') {
      setTimeout(() => {
        searchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 600);
    }
  }, [location.search]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('q', searchTerm);
    if (selectedType) params.set('type', selectedType);
    navigate(`/browse?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleTypeClick = (type: string) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    navigate(`/browse?${params.toString()}`);
  };

  const toggleWishlist = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!isLoggedIn) {
      window.location.href = '/login';
      return;
    }
    setTogglingId(id);
    try {
      const r = await api.post(`/auth/wishlist/${id}`);
      setWishlist(r.data.wishlist);
    } catch { /* silent */ }
    finally { setTogglingId(null); }
  };

  return (
    <div className="fade-in" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>

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

          {/* Search bar — navigates to Browse on submit */}
          <div ref={searchSectionRef} id="search-section" className="search-bar" style={{ maxWidth: '680px', marginTop: '0.75rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#898989" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '0.75rem' }}>
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search city, district, village..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ fontSize: '1rem', padding: '0.85rem 0.5rem' }}
            />
            <button
              onClick={handleSearch}
              className="btn-primary"
              style={{ borderRadius: '6px', fontSize: '0.9375rem', padding: '0.625rem 1.5rem' }}
            >
              Search
            </button>
          </div>

          {/* Type pills — navigate directly to Browse */}
          <div className="fast-filters-container">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => handleTypeClick(t)}
                style={{
                  padding: '0.45rem 1.1rem',
                  borderRadius: '9999px',
                  border: selectedType === t ? '1px solid #101010' : '1px solid #e5e7eb',
                  background: selectedType === t ? '#101010' : '#ffffff',
                  color: selectedType === t ? '#ffffff' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: selectedType === t ? 500 : 400,
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
          <div className="fast-filters-hint">← Swipe to see more land types →</div>

        </div>
      </div>

      {/* ── FEATURED SHOWCASE ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: '#101010', margin: 0, letterSpacing: '-0.01em' }}>
              Featured Listings
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.2rem', letterSpacing: '-0.2px' }}>
              Verified properties ready for your review
            </p>
          </div>
          <Link to="/browse" className="btn-secondary" style={{ textDecoration: 'none', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
            Browse all listings
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
          </Link>
        </div>

        {featured.length === 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {[1, 2, 3].map(i => (
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
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1.5rem' }}>
            {featured.map(p => (
              <GlareHover
                key={p.id}
                disabled={animationSetting === 'minimal'}
                glareColor="#ffffff"
                glareOpacity={0.25}
                glareSize={200}
                borderRadius="12px"
                className="property-card"
              >
                <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>

                  <div className="card-img" style={{ position: 'relative', height: '210px', overflow: 'hidden', background: '#f4f4f4', flexShrink: 0 }}>
                    <img src={getPropertyImageUrl(p)} alt={p.type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%)' }} />
                    <div style={{ position: 'absolute', bottom: '0.85rem', left: '0.85rem', background: 'rgba(255,255,255,0.96)', borderRadius: '6px', padding: '0.35rem 0.8rem', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '1rem', fontWeight: 600, color: '#101010', lineHeight: 1, margin: 0, fontFamily: "'Poppins', sans-serif" }}>{formatPrice(p.price)}</p>
                    </div>
                    <span className="badge-active" style={{ position: 'absolute', bottom: '0.85rem', right: '0.85rem', fontSize: '0.75rem' }}>{p.type}</span>

                    <button
                      onClick={e => toggleWishlist(e, p.id)}
                      disabled={togglingId === p.id}
                      style={{
                        position: 'absolute', top: '0.85rem', right: '0.85rem', zIndex: 10,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 0,
                        transition: 'transform 0.15s ease',
                        outline: 'none'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        style={{
                          filter: 'drop-shadow(0 1.5px 3.5px rgba(0,0,0,0.7))',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <path
                          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                          fill={wishlist.includes(p.id) ? '#101010' : 'none'}
                          stroke="#ffffff"
                          strokeWidth="2.2"
                        />
                      </svg>
                    </button>
                  </div>

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
                      {p.water_source && <span style={{ fontSize: '0.8125rem', color: '#898989', fontWeight: 400 }}>{p.water_source}</span>}
                    </div>
                  </div>

                  <div className="card-action-bar">
                    <span className="btn-secondary" style={{ width: '100%', fontSize: '0.875rem', padding: '0.55rem 1rem', display: 'flex', justifyContent: 'center' }}>
                      View details &rarr;
                    </span>
                  </div>
                </Link>
              </GlareHover>
            ))}
          </div>
        )}

        {/* CTA to Browse all */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/browse" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#101010', color: '#ffffff', padding: '0.85rem 2rem',
            borderRadius: '99px', fontSize: '0.9375rem', fontWeight: 500,
            textDecoration: 'none', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            Explore All Listings
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
