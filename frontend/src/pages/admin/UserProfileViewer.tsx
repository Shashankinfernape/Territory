import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { PROPERTY_IMAGES } from '../../lib/types';
import GlareHover from '../../components/ui/GlareHover';
import { Link } from 'react-router-dom';

interface UserProfileViewerProps {
  userId: string;
  onClose: () => void;
}

const formatPrice = (price: number) => {
  if (!price) return '—';
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

// Reusable cinematic land deck — same design as the rest of the site
const AdminLandDeck = ({ property, badge }: { property: any; badge?: string }) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hovering, setHovering] = useState(false);

  const images: string[] = (() => {
    if (property.images && property.images.length > 0) {
      const rootUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace('/api/v1', '');
      return property.images.map((img: string) => img.startsWith('http') ? img : `${rootUrl}${img}`);
    }
    return [PROPERTY_IMAGES[property.type] ?? PROPERTY_IMAGES.default];
  })();

  return (
    <GlareHover background="#ffffff" glareColor="#ffffff" glareOpacity={0.25} glareSize={200} borderRadius="12px" className="property-card" style={{ height: '100%' }}>
      <Link to={`/property/${property.id}`} target="_blank" rel="noopener noreferrer"
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
        onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
        <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#f5f5f5', flex: '0 0 auto' }}>
          <img src={images[activeIdx]} alt={property.type} draggable={false}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hovering ? 'scale(1.04)' : 'scale(1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)', pointerEvents: 'none' }} />

          {hovering && images.length > 1 && (
            <>
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveIdx(p => (p - 1 + images.length) % images.length); }}
                style={{ position: 'absolute', top: '50%', left: '0.5rem', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button onClick={e => { e.preventDefault(); e.stopPropagation(); setActiveIdx(p => (p + 1) % images.length); }}
                style={{ position: 'absolute', top: '50%', right: '0.5rem', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 20 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '2.8rem', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4, zIndex: 20, pointerEvents: 'none' }}>
              {images.map((_: string, i: number) => (
                <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s', transform: i === activeIdx ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          )}

          {badge && (
            <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem', zIndex: 10, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', color: '#fff', padding: '0.28rem 0.65rem', borderRadius: 5, fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {badge}
            </div>
          )}

          <div className="cinematic-details-overlay" style={{ bottom: '1.25rem' }}>
            <h4 className="cinematic-card-title">{formatPrice(property.price)}</h4>
            <div className="cinematic-title-line" />
            <div className="cinematic-meta-row">
              <span className="cinematic-meta-count">{property.area} {property.area_unit}</span>
              <div className="cinematic-meta-divider" />
              <span className="cinematic-meta-ratio">{property.type}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.9rem 1.25rem' }}>
          <h4 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif", letterSpacing: '0.01em' }}>
            {property.city}{property.district ? `, ${property.district}` : ''}
          </h4>
          <p style={{ fontSize: '0.875rem', color: '#767676', fontWeight: 400, marginTop: '0.2rem' }}>A Deed Verified</p>
          {property.transaction_amount && (
            <p style={{ fontSize: '0.8rem', color: '#1a1a1a', fontWeight: 600, marginTop: '0.3rem' }}>Paid: {formatPrice(property.transaction_amount)}</p>
          )}
        </div>
      </Link>
    </GlareHover>
  );
};

// ─── Data row — Samsung underline style (Contact details form style) ────────
const DataRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginBottom: '0.5rem' }}>
    <span style={{ fontSize: '13px', fontWeight: 400, color: '#7A7A7A', letterSpacing: '0.025em', marginBottom: '6px' }}>{label}</span>
    <div style={{ position: 'relative', width: '100%' }}>
      <div style={{ fontSize: '17px', fontWeight: 400, color: value ? '#000' : '#b8b8b8', paddingBottom: '8px', wordBreak: 'break-word', minHeight: '26px' }}>
        {value || 'Not provided'}
      </div>
      <div style={{ width: '100%', height: '1px', background: '#BDBDBD' }} />
    </div>
  </div>
);

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="upv-card" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e8e8' }}>
    <div style={{ padding: '1.1rem 0 0.6rem', borderBottom: '1px solid #e8e8e8' }}>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
    </div>
    <div>{children}</div>
  </div>
);

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ msg }: { msg: string }) => (
  <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
    <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b8b8b8" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="9" x2="15" y2="15"/><line x1="15" y1="9" x2="9" y2="15"/></svg>
    </div>
    <p style={{ fontSize: '0.875rem', color: '#9a9a9a', fontWeight: 400 }}>{msg}</p>
  </div>
);

// ─── Tab button — clean Samsung underline style ───────────────────────────────
const TabBtn = ({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) => (
  <button onClick={onClick} style={{ position: 'relative', padding: '1rem 1.1rem 0.85rem', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: active ? 700 : 400, color: active ? '#1a1a1a' : '#767676', transition: 'color 0.18s', whiteSpace: 'nowrap' }}>
    {label}
    {count > 0 && (
      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: active ? '#1a1a1a' : '#ababab', marginLeft: '0.3rem' }}>({count})</span>
    )}
    {active && (
      <motion.div layoutId="samsungTabLine" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#1a1a1a' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
    )}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════════════
export default function UserProfileViewer({ userId, onClose }: UserProfileViewerProps) {
  const [tab, setTab] = useState<'profile' | 'listed' | 'bought' | 'wishlist'>('profile');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/admin/users/${userId}/full-profile`);
        setData(res.data);
      } catch (err) {
        console.error('Failed to fetch user profile', err);
        alert('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div style={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ width: 32, height: 32, borderRadius: '50%', border: '2.5px solid #e0e0e0', borderTopColor: '#1a1a1a' }} />
      </div>
    );
  }

  if (!data) return null;

  const { profile, listed_properties, bought_properties, wishlist_properties } = data;
  const initial = (profile.full_name || profile.email || '?').charAt(0).toUpperCase();
  const avatarSrc = profile.photo_url || profile.photoURL || profile.profile_picture || profile.avatar_url || profile.picture;
  const addr = profile.address;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ width: '100%', minHeight: '100%', background: '#f7f7f7', fontFamily: "'Inter', 'SamsungOne', sans-serif", paddingBottom: '5rem' }}>
      <style>{`
        .upv-container { padding: 0.5rem 1.25rem 0; }
        .upv-hero { padding: 2rem 2rem 1.5rem; margin-bottom: 1rem; }
        .upv-card { padding: 0 1.5rem; }
        @media (max-width: 600px) {
          .upv-container { padding: 0.25rem 0.5rem 0; }
          .upv-hero { padding: 1.25rem 1rem 1rem; margin-bottom: 0.75rem; }
          .upv-card { padding: 0 1rem; }
        }
      `}</style>
      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={onClose}
          style={{ 
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
            width: '40px', height: '40px', borderRadius: '50%', 
            border: '1.5px solid #2C2C2C', background: '#f0f0f0', 
            cursor: 'pointer', color: '#2C2C2C', fontWeight: 'bold', fontSize: '1rem', 
            transition: 'background-color 0.15s ease' 
          }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#e4e4e4')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
          title="Back to Control panel"
        >
          &larr;
        </button>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a', margin: 0, letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif" }}>
          Back to Control panel
        </h1>
      </div>

      <div className="upv-container" style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="upv-hero" style={{ background: '#fff', borderRadius: 16, border: '1px solid #e8e8e8' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0, marginRight: '1rem' }}>
              <div style={{ width: 120, height: 120, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', overflow: 'hidden' }}>
                {avatarSrc ? (
                  <img src={avatarSrc} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                ) : initial}
              </div>
            </div>

            {/* Profile Info (Instagram Style) */}
            <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: '0.4rem', justifyContent: 'center' }}>
              
              {/* Row 1: Username & Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1a1a1a', margin: 0, letterSpacing: '-0.01em' }}>
                  {profile.full_name || 'Unnamed User'}
                </h2>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#1a1a1a', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.15rem 0.45rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {profile.role}
                </span>
                {profile.created_at && (
                  <span style={{ fontSize: '0.75rem', color: '#767676', marginLeft: '0.5rem' }}>
                    Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              {/* Row 2: Secondary Text (Phone) */}
              <div style={{ fontSize: '0.95rem', color: '#1a1a1a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {profile.phone_number || 'No phone number'}
                {profile.phone_number && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(profile.phone_number);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: copied ? '#16a34a' : '#767676', transition: 'color 0.2s', padding: 0 }}
                    title="Copy phone number"
                  >
                    {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={2} />}
                  </button>
                )}
              </div>

              {/* Row 3: Stats */}
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem' }}>
                <div style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>
                  <span style={{ fontWeight: 700 }}>{listed_properties.length}</span> listed
                </div>
                <div style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>
                  <span style={{ fontWeight: 700 }}>{bought_properties.length}</span> bought
                </div>
                <div style={{ fontSize: '0.95rem', color: '#1a1a1a' }}>
                  <span style={{ fontWeight: 700 }}>{(wishlist_properties || []).length}</span> wishlisted
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab bar ──────────────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e8e8e8', borderRadius: '12px 12px 0 0', display: 'flex', gap: 0, overflowX: 'auto', marginBottom: 0 }}>
          <TabBtn active={tab === 'profile'} label="Profile" count={0} onClick={() => setTab('profile')} />
          <TabBtn active={tab === 'listed'} label="Listed Lands" count={listed_properties.length} onClick={() => setTab('listed')} />
          <TabBtn active={tab === 'bought'} label="Bought" count={bought_properties.length} onClick={() => setTab('bought')} />
          <TabBtn active={tab === 'wishlist'} label="Wishlist" count={(wishlist_properties || []).length} onClick={() => setTab('wishlist')} />
        </div>

        {/* ── Tab content ──────────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid #e8e8e8' }}>
          <AnimatePresence mode="wait">

            {/* PROFILE TAB */}
            {tab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ paddingTop: '1rem', maxWidth: 840 }}>

                <SectionCard title="User Details">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 3rem', paddingTop: '0.5rem' }}>
                  {/* Identity */}
                  <DataRow label="Full Name" value={profile.full_name} />
                  <DataRow label="Role" value={profile.role} />
                  <DataRow label="Member Since" value={profile.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} />

                  {/* Contact */}
                  <DataRow label="Email" value={profile.email} />
                  <DataRow label="Alternate Phone" value={profile.alternate_number} />

                  {/* Address */}
                  {addr && (
                    <>
                      <DataRow label="Street / Locality" value={addr.street_locality} />
                      <DataRow label="Flat / House No." value={addr.flat_house_no} />
                      <DataRow label="Floor" value={addr.floor} />
                      <DataRow label="City" value={addr.city} />
                      <DataRow label="District" value={addr.district} />
                      <DataRow label="Pincode" value={addr.pincode} />
                      <DataRow label="State" value={addr.state} />
                    </>
                  )}


                  {/* System */}
                  <DataRow label="User ID" value={profile.id} />
                  </div>
                </SectionCard>
              </motion.div>
            )}


            {/* LISTED TAB */}
            {tab === 'listed' && (
              <motion.div key="listed" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ paddingTop: '1.25rem' }}>
                {listed_properties.length === 0
                  ? <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8' }}><EmptyState msg="No listed properties." /></div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
                      {listed_properties.map((p: any) => <AdminLandDeck key={p.id} property={p} badge={p.status === 'SOLD_OUT' ? 'Sold Out' : p.status} />)}
                    </div>
                }
              </motion.div>
            )}

            {/* BOUGHT TAB */}
            {tab === 'bought' && (
              <motion.div key="bought" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ paddingTop: '1.25rem' }}>
                {bought_properties.length === 0
                  ? <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8' }}><EmptyState msg="No purchased properties." /></div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
                      {bought_properties.map((p: any) => <AdminLandDeck key={p.id} property={p} badge="Purchased" />)}
                    </div>
                }
              </motion.div>
            )}

            {/* WISHLIST TAB */}
            {tab === 'wishlist' && (
              <motion.div key="wishlist" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ paddingTop: '1.25rem' }}>
                {(wishlist_properties || []).length === 0
                  ? <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e8e8e8' }}><EmptyState msg="No wishlisted properties." /></div>
                  : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1.25rem' }}>
                      {(wishlist_properties || []).map((p: any) => <AdminLandDeck key={p.id} property={p} badge="Wishlisted" />)}
                    </div>
                }
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
