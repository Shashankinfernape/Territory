import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import { getPropertyImageUrl, type Property } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import TAMIL_NADU_CITY_DIVISIONS from '../../components/common/tamilnadu_city_divisions.json';

const TAMIL_NADU_DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
  "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanniyakumari", "Karur",
  "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris",
  "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivagangai",
  "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli (Trichy)", "Tirunelveli",
  "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
  "Viluppuram", "Virudhunagar"
];

const normalizeName = (name: string): string => {
  return name.trim().toLowerCase()
    .replace(/\s+/g, '')
    .replace(/\(.*\)/g, '')
    .replace(/h/g, '')
    .replace(/ee/g, 'i')
    .replace(/pp/g, 'p')
    .replace(/tt/g, 't')
    .replace(/ll/g, 'l')
    .replace(/ch/g, 'c')
    .replace(/ai$/g, 'a')
    .replace(/y/g, 'i');
};

const TYPES = ['', 'Agricultural Land', 'Farm Land', 'Flat Plot', 'Residential Plot', 'Commercial Plot'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Most Viewed', value: 'views' },
];

function PropertyCard({
  p, wishlist, togglingId, toggleWishlist
}: {
  p: Property;
  wishlist: string[];
  togglingId: string | null;
  toggleWishlist: (e: React.MouseEvent, id: string) => void;
}) {
  return (
    <div className="property-card" style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden'
    }}>
      <Link to={`/property/${p.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Image Container with overlays */}
        <div style={{ width: '100%', position: 'relative', aspectRatio: '16/9', background: '#f3f4f6', overflow: 'hidden' }}>
          <img
            src={getPropertyImageUrl(p)}
            alt="land"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          
          {/* Status badge */}
          <div style={{
            position: 'absolute', top: '0.625rem', left: '0.625rem',
            background: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
            borderRadius: '4px', padding: '3px 8px',
            fontSize: '0.625rem', fontWeight: 800, color: '#111827',
            letterSpacing: '0.03em', textTransform: 'uppercase'
          }}>
            Active
          </div>

          {/* Wishlist Heart Overlay */}
          <button
            onClick={(e) => toggleWishlist(e, p.id)}
            disabled={togglingId === p.id}
            style={{
              position: 'absolute', top: '0.625rem', right: '0.625rem',
              background: 'transparent',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0,
              transition: 'transform 0.15s ease',
              outline: 'none',
              zIndex: 10
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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

          {/* Zillow style pagination dots */}
          <div style={{
            position: 'absolute', bottom: '0.625rem', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.22)', padding: '3px 6px', borderRadius: '99px'
          }}>
            {[1, 2, 3, 4, 5].map((dot, i) => (
              <div key={dot} style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.5)'
              }} />
            ))}
          </div>
        </div>

        {/* Details Body */}
        <div style={{ padding: '0.45rem 0.65rem 0.55rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', background: 'transparent', minHeight: '85px' }}>
          <div>
            {/* Price & Options row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 800, color: '#111827', fontFamily: "'Poppins', sans-serif" }}>
                {formatPrice(p.price)}
              </p>
              {/* Three dots icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer' }}>
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </div>

            {/* Property specs row */}
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#1f2937', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.area} {p.area_unit.replace('_', ' ')} <span style={{ color: '#d1d5db', margin: '0 3px' }}>|</span> {p.type.replace(' Land', '').replace(' Plot', '')} <span style={{ color: '#d1d5db', margin: '0 3px' }}>|</span> <span style={{ color: '#16a34a' }}>Deed</span>
            </p>

            {/* Address row */}
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#4b5563', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {p.city}{p.district ? `, ${p.district}` : ''}
            </p>
          </div>

          {/* Broker/Seller name */}
          <div style={{ marginTop: '0.28rem' }}>
            <p style={{ margin: 0, fontSize: '0.6rem', color: '#9ca3af', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Territory Premium
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [recommendations, setRecommendations] = useState<Property[]>([]);
  const [recLabel, setRecLabel] = useState<string>('Recommended for You');
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const isLoggedIn = !!getToken();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [filterType, setFilterType] = useState(searchParams.get('type') || '');
  const [filterDistrict, setFilterDistrict] = useState(searchParams.get('district') || '');
  const [filterTaluk, setFilterTaluk] = useState(searchParams.get('taluk') || '');
  const [filterMinPrice, setFilterMinPrice] = useState(searchParams.get('min_price') || '');
  const [filterMaxPrice, setFilterMaxPrice] = useState(searchParams.get('max_price') || '');
  const [filterMinArea, setFilterMinArea] = useState(searchParams.get('min_area') || '');
  const [filterMaxArea, setFilterMaxArea] = useState(searchParams.get('max_area') || '');
  const [filterWaterSource, setFilterWaterSource] = useState(searchParams.get('water_source') || '');
  const [filterRoadAccess, setFilterRoadAccess] = useState(searchParams.get('road_access') || '');

  const sortedTaluks = useMemo(() => {
    if (!filterDistrict) return [];
    const keys = Object.keys(TAMIL_NADU_CITY_DIVISIONS);
    const matchedKey = keys.find(k => normalizeName(k) === normalizeName(filterDistrict)) || filterDistrict;
    const divisions = (TAMIL_NADU_CITY_DIVISIONS as any)[matchedKey] || [];
    return divisions.map((d: any) => d.name).sort((a: string, b: string) => a.localeCompare(b));
  }, [filterDistrict]);

  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setFilterTaluk('');
  }, [filterDistrict]);

  useEffect(() => {
    if (!isLoggedIn) return;
    api.get('/auth/wishlist').then(r => setWishlist(r.data.wishlist)).catch(() => {});
  }, [isLoggedIn]);

  useEffect(() => {
    setTimeout(() => searchInputRef.current?.focus(), 200);
  }, []);

  // Fetch recommendations using browser geolocation
  useEffect(() => {
    const fetchRecs = async (district?: string, city?: string) => {
      try {
        const params: Record<string, string | number> = { limit: 8 };
        if (district) params.district = district;
        if (city) params.city = city;
        const res = await api.get('/properties/recommendations', { params });
        setRecommendations(res.data as Property[]);
        if (district || city) {
          setRecLabel(`Popular near ${district || city}`);
        } else {
          setRecLabel('Most Popular Listings');
        }
      } catch { /* silent */ }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const { latitude, longitude } = pos.coords;
            const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
            const geo = await r.json();
            const district = geo.address?.county || geo.address?.state_district || '';
            const city = geo.address?.city || geo.address?.town || geo.address?.village || '';
            await fetchRecs(district, city);
          } catch {
            await fetchRecs();
          }
        },
        async () => { await fetchRecs(); },
        { timeout: 5000 }
      );
    } else {
      fetchRecs();
    }
  }, []);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (filterType) params.type = filterType;
      if (filterDistrict) params.district = filterDistrict;
      if (filterTaluk) params.taluk = filterTaluk;
      if (filterMinPrice) params.min_price = filterMinPrice;
      if (filterMaxPrice) params.max_price = filterMaxPrice;
      if (filterMinArea) params.min_area = filterMinArea;
      if (filterMaxArea) params.max_area = filterMaxArea;
      if (filterWaterSource) params.water_source = filterWaterSource;
      if (filterRoadAccess) params.road_access = filterRoadAccess;
      const res = await api.get('/properties/', { params });
      let data: Property[] = res.data;
      if (sortBy === 'price_asc') data = [...data].sort((a, b) => a.price - b.price);
      else if (sortBy === 'price_desc') data = [...data].sort((a, b) => b.price - a.price);
      else if (sortBy === 'views') data = [...data].sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0));
      setProperties(data);
      setVisibleCount(12);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [searchTerm, filterType, filterDistrict, filterTaluk, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea, filterWaterSource, filterRoadAccess, sortBy]);

  useEffect(() => {
    const t = setTimeout(fetchProperties, 300);
    return () => clearTimeout(t);
  }, [fetchProperties]);

  useEffect(() => {
    const p: Record<string, string> = {};
    if (searchTerm) p.q = searchTerm;
    if (filterType) p.type = filterType;
    if (filterDistrict) p.district = filterDistrict;
    if (filterTaluk) p.taluk = filterTaluk;
    if (filterMinPrice) p.min_price = filterMinPrice;
    if (filterMaxPrice) p.max_price = filterMaxPrice;
    if (filterMinArea) p.min_area = filterMinArea;
    if (filterMaxArea) p.max_area = filterMaxArea;
    if (filterWaterSource) p.water_source = filterWaterSource;
    if (filterRoadAccess) p.road_access = filterRoadAccess;
    setSearchParams(p, { replace: true });
  }, [searchTerm, filterType, filterDistrict, filterTaluk, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea, filterWaterSource, filterRoadAccess, setSearchParams]);

  const clearFilters = () => {
    setSearchTerm(''); setFilterType(''); setFilterDistrict(''); setFilterTaluk('');
    setFilterMinPrice(''); setFilterMaxPrice('');
    setFilterMinArea(''); setFilterMaxArea('');
    setFilterWaterSource(''); setFilterRoadAccess('');
  };

  const hasActive = !!(filterType || filterDistrict || filterTaluk || filterMinPrice || filterMaxPrice
    || filterMinArea || filterMaxArea || filterWaterSource || filterRoadAccess);

  const activeCount = [filterType, filterDistrict, filterTaluk, filterMinPrice, filterMaxPrice, filterMinArea, filterMaxArea, filterWaterSource, filterRoadAccess].filter(Boolean).length;

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

  const cardProps = { wishlist, togglingId, isLoggedIn, toggleWishlist };

  return (
    <div className="fade-in" style={{ minHeight: '100vh' }}>

      {/* ── SEARCH HEADER ── */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
      }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '0.75rem 1rem' }}>

          {/* Row 1: search + sort */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', minWidth: 0 }}>
            {/* Search */}
            <div
              style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.4)', border: '1.5px solid #e5e7eb', borderRadius: '10px', padding: '0.5rem 0.75rem', transition: 'border-color 0.2s' }}
              onFocusCapture={e => (e.currentTarget.style.borderColor = '#101010')}
              onBlurCapture={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#898989" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search city, district, village..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ flex: 1, minWidth: 0, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.9375rem', color: '#242424', fontFamily: 'inherit' }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#898989', lineHeight: 1, padding: '0.1rem', flexShrink: 0 }}>✕</button>
              )}
            </div>

            {/* Sort */}
            <select
              className="browse-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{ flexShrink: 0, padding: '0.5rem 0.75rem', borderRadius: '10px', border: '1.5px solid #e5e7eb', background: 'rgba(255, 255, 255, 0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', color: '#242424', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#fff' }}>{o.label}</option>)}
            </select>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.35rem',
                padding: '0.5rem 0.85rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit',
                border: hasActive ? '1.5px solid #101010' : '1.5px solid #e5e7eb',
                background: hasActive ? '#101010' : 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
                color: hasActive ? '#fff' : '#242424',
                fontSize: '0.875rem', fontWeight: 500, transition: 'all 0.2s ease', whiteSpace: 'nowrap'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
              <span className="browse-filter-btn-text">Filters{hasActive ? ` (${activeCount})` : ''}</span>
              {hasActive && <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{activeCount}</span>}
            </button>
          </div>

          {/* Row 2: Type pills */}
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: '2px' }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setFilterType(filterType === t ? '' : t)} style={{
                padding: '0.28rem 0.85rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
                background: filterType === t ? '#101010' : '#f0f0f0',
                color: filterType === t ? '#fff' : '#6b7280',
                fontSize: '0.8rem', fontWeight: filterType === t ? 500 : 400,
                transition: 'all 0.15s ease', fontFamily: 'inherit', whiteSpace: 'nowrap'
              }}>
                {t || 'All Types'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE FILTERS PANEL ── */}
      {showFilters && (
        <div className="fade-in" style={{
          background: 'rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
        }}>
          <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#898989', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Filter Specifications</span>
              {hasActive && (
                <button onClick={clearFilters} style={{ fontSize: '0.8125rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontFamily: 'inherit' }}>
                  Reset all
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#242424', marginBottom: '0.35rem' }}>District</label>
                <select
                  value={filterDistrict}
                  onChange={e => setFilterDistrict(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.875rem', width: '100%' }}
                >
                  <option value="">Any District</option>
                  {TAMIL_NADU_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#242424', marginBottom: '0.35rem' }}>Taluk</label>
                <select
                  disabled={!filterDistrict}
                  value={filterTaluk}
                  onChange={e => setFilterTaluk(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '0.875rem', width: '100%' }}
                >
                  <option value="">Any Taluk</option>
                  {sortedTaluks.map((t: string) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {[
                { label: 'Min Price (₹)', value: filterMinPrice, setter: setFilterMinPrice, placeholder: '0', type: 'number' },
                { label: 'Max Price (₹)', value: filterMaxPrice, setter: setFilterMaxPrice, placeholder: 'Any', type: 'number' },
                { label: 'Min Area', value: filterMinArea, setter: setFilterMinArea, placeholder: '0', type: 'number' },
                { label: 'Max Area', value: filterMaxArea, setter: setFilterMaxArea, placeholder: 'Any', type: 'number' },
              ].map(({ label, value, setter, placeholder, type }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#242424', marginBottom: '0.35rem' }}>{label}</label>
                  <input type={type} value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} className="form-input" style={{ fontSize: '0.875rem' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#242424', marginBottom: '0.35rem' }}>Water Source</label>
                <select value={filterWaterSource} onChange={e => setFilterWaterSource(e.target.value)} className="form-input" style={{ fontSize: '0.875rem' }}>
                  {['', 'Borewell', 'Open Well', 'Canal', 'River', 'Rainfed'].map(o => <option key={o} value={o}>{o || 'Any'}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#242424', marginBottom: '0.35rem' }}>Road Access</label>
                <select value={filterRoadAccess} onChange={e => setFilterRoadAccess(e.target.value)} className="form-input" style={{ fontSize: '0.875rem' }}>
                  {['', 'National Highway', 'State Highway', 'District Road', 'Village Road'].map(o => <option key={o} value={o}>{o || 'Any'}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div style={{ maxWidth: '1380px', margin: '0 auto', padding: '1.5rem' }}>

        {/* ── RECOMMENDATIONS SECTION (shown when no active search/filter) ── */}
        {!searchTerm && !hasActive && recommendations.length > 0 && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div style={{ width: '3px', height: '20px', background: '#101010', borderRadius: '2px' }} />
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: '#101010', margin: 0 }}>
                {recLabel}
              </h2>
              <span style={{ fontSize: '0.75rem', background: '#101010', color: '#fff', borderRadius: '99px', padding: '0.15rem 0.6rem', fontWeight: 500 }}>
                ✦ For You
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {recommendations.map(p => <PropertyCard key={p.id} p={p} {...cardProps} />)}
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '2rem 0 1.5rem' }}>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              <span style={{ fontSize: '0.8rem', color: '#898989', fontWeight: 500, whiteSpace: 'nowrap' }}>All Listings</span>
              <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
            </div>
          </div>
        )}

        {/* Results header */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', fontWeight: 500 }}>
            {loading ? 'Searching…' : `${properties.length} listing${properties.length !== 1 ? 's' : ''} found`}
          </p>
          {hasActive && (
            <button onClick={clearFilters} style={{ fontSize: '0.8rem', color: '#4b5563', background: 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.3rem 0.75rem', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
              Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="property-card" style={{ height: '340px' }}>
                <div className="skeleton" style={{ height: '200px', borderRadius: '12px 12px 0 0' }} />
                <div style={{ padding: '1rem' }}>
                  <div className="skeleton" style={{ height: '18px', width: '55%', marginBottom: '0.5rem' }} />
                  <div className="skeleton" style={{ height: '13px', width: '38%', marginBottom: '1rem' }} />
                  <div className="skeleton" style={{ height: '34px', width: '100%', borderRadius: '99px' }} />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'rgba(255, 255, 255, 0.75)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 8px rgba(36,36,36,0.05)'
          }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '12px', background: '#f4f4f4', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#898989" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.1rem', color: '#101010' }}>No listings found</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.3rem' }}>Try adjusting your filters or search a different location.</p>
            </div>
            {hasActive && <button onClick={clearFilters} className="btn-primary" style={{ fontSize: '0.875rem' }}>Clear filters</button>}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {properties.slice(0, visibleCount).map(p => <PropertyCard key={p.id} p={p} {...cardProps} />)}
            </div>
            {visibleCount < properties.length && (
              <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <button 
                  onClick={() => setVisibleCount(prev => prev + 12)}
                  style={{
                    padding: '0.6rem 1.5rem',
                    background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '99px',
                    color: '#101010',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                  }}
                >
                  Load More Lands
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
