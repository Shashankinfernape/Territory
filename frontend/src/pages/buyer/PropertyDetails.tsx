import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import type { Property } from '../../lib/types';
import { formatPrice } from '../../lib/utils';
import { PROPERTY_IMAGES } from '../../lib/types';

interface DetailedProperty extends Property {
  unlocked?: boolean;
  owner_name?: string;
  owner_phone?: string;
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const [prop, setProp] = useState<DetailedProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchProperty = async () => {
      setLoading(true);
      setError('');
      try {
        const propRes = await api.get<DetailedProperty>(`/properties/${id}`);
        let propData = propRes.data;

        // If logged in, check if already unlocked
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const checkRes = await api.get(`/payments/check-unlock/${id}`);
            if (checkRes.data.unlocked) {
              propData = {
                ...propData,
                unlocked: true,
                owner_name: checkRes.data.owner_name,
                owner_phone: checkRes.data.owner_phone
              };
            }
          } catch (err) {
            console.error('Failed to check unlock status', err);
          }
        }

        setProp(propData);
      } catch (err) {
        console.error(err);
        setError('Listing could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const handleMockUnlock = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Please sign in first to unlock owner contact information.');
      return;
    }
    setUnlocking(true);
    setError('');
    try {
      const res = await api.post('/payments/mock-unlock', { property_id: id });
      setProp(prev => prev ? { ...prev, unlocked: true, owner_name: res.data.owner_name, owner_phone: res.data.owner_phone } : null);
    } catch (err: any) {
      console.error(err);
      setError('Transaction validation failed. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3.5rem 1.5rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', fontWeight: 400, letterSpacing: '-0.2px' }}>Loading registry records...</p>
    </div>
  );

  if (!prop) return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: '#dc2626', fontWeight: 600 }}>
      Listing not found.
    </div>
  );

  // Parse all gallery images (with fallback to default categories)
  const rootUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
    : 'http://localhost:8000';
  const galleryImages = prop.images && prop.images.length > 0
    ? prop.images.map(img => img.startsWith('http') ? img : `${rootUrl}${img}`)
    : [PROPERTY_IMAGES[prop.type] ?? PROPERTY_IMAGES.default];

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0];

  return (
    <div className="fade-in" style={{ backgroundColor: '#f4f4f4', minHeight: '100vh', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        <Link to="/" style={{
          color: '#101010', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem',
          display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1.5rem',
          letterSpacing: '-0.2px'
        }}>
          &larr; Back to listings
        </Link>

        {/* Two-Column Classified Layout */}
        <div className="details-grid">
          
          {/* Main Content Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Interactive Image Gallery */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{
                background: '#ffffff', borderRadius: '12px', overflow: 'hidden',
                position: 'relative', height: '400px',
                boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px'
              }}>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage: `url(${activeImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.9)',
                  transition: 'background-image 0.25s ease'
                }} />

                {/* Left/Right Carousel Controls */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === 0 ? galleryImages.length - 1 : prev - 1));
                      }}
                      style={{
                        position: 'absolute',
                        left: '1.25rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1.5px solid rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        transition: 'all 0.15s ease',
                        color: '#101010'
                      }}
                      onMouseEnter={el => {
                        el.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                        el.currentTarget.style.background = '#ffffff';
                      }}
                      onMouseLeave={el => {
                        el.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        el.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      }}
                      title="Previous Image"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveImageIndex(prev => (prev === galleryImages.length - 1 ? 0 : prev + 1));
                      }}
                      style={{
                        position: 'absolute',
                        right: '1.25rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.9)',
                        border: '1.5px solid rgba(0, 0, 0, 0.05)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                        transition: 'all 0.15s ease',
                        color: '#101010'
                      }}
                      onMouseEnter={el => {
                        el.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
                        el.currentTarget.style.background = '#ffffff';
                      }}
                      onMouseLeave={el => {
                        el.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                        el.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                      }}
                      title="Next Image"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </button>
                  </>
                )}

                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '2rem', background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
                  color: '#ffffff',
                  pointerEvents: 'none' // allow clicking buttons behind the overlay text if needed
                }}>
                  <span className="badge-active" style={{ alignSelf: 'flex-start', marginBottom: '0.75rem' }}>
                    {prop.type}
                  </span>
                  <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2rem', fontWeight: 600, margin: 0, letterSpacing: '0.01em' }}>
                    {prop.city}
                  </h1>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem', marginTop: '0.25rem', fontWeight: 400, letterSpacing: '-0.2px' }}>
                    {prop.district ? `${prop.district}, ` : ''}{prop.state}
                  </p>
                </div>
              </div>

              {/* Thumbnails Row */}
              {galleryImages.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      style={{
                        width: '72px', height: '54px', borderRadius: '6px',
                        overflow: 'hidden', padding: 0, cursor: 'pointer',
                        border: activeImageIndex === idx ? '2.5px solid #101010' : '1px solid #e5e7eb',
                        opacity: activeImageIndex === idx ? 1 : 0.72,
                        transition: 'all 0.15s ease',
                        background: '#ffffff'
                      }}
                      onMouseEnter={e => { if (activeImageIndex !== idx) e.currentTarget.style.opacity = '1'; }}
                      onMouseLeave={e => { if (activeImageIndex !== idx) e.currentTarget.style.opacity = '0.72'; }}
                    >
                      <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="thumb" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Land Specs & Overview */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px' }}>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1.25rem', letterSpacing: '0.01em' }}>
                Property Specifications
              </h2>

              <div className="specs-grid">
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Land Area</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#242424', marginTop: '0.2rem', letterSpacing: '-0.2px' }}>{prop.area} {prop.area_unit}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Asking Price</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#101010', marginTop: '0.2rem', letterSpacing: '-0.2px' }}>{formatPrice(prop.price)}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 500, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Verification</p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#101010', marginTop: '0.2rem', letterSpacing: '-0.2px' }}>Deed Verified</p>
                </div>
              </div>

              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1rem', fontWeight: 600, color: '#101010', marginBottom: '0.5rem', letterSpacing: '0.01em' }}>Overview</h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5, letterSpacing: '-0.19px' }}>
                {prop.description || "No description provided by the seller."}
              </p>
            </div>

            {/* Feature Attributes List */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px' }}>
              <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1.25rem', letterSpacing: '0.01em' }}>
                Attributes & Highlights
              </h2>
              <div className="attributes-grid">
                {[
                  { label: 'Soil Type', val: prop.soil_type || 'Unspecified' },
                  { label: 'Water Source', val: prop.water_source ? prop.water_source : 'None' },
                  { label: 'Road Access', val: prop.road_access ? prop.road_access : 'Unspecified' },
                  { label: 'Electricity Grid', val: prop.electricity ? 'Connected' : 'Not Connected' },
                  { label: 'Irrigation Setup', val: prop.irrigation ? 'Configured' : 'Not Configured' },
                  { label: 'Nearest Town', val: prop.nearby_town ? `${prop.nearby_town} (${prop.distance_from_town_km || 0} km)` : 'Unspecified' },
                ].map(attr => (
                  <div key={attr.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid #e5e7eb' }}>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 400, letterSpacing: '-0.2px' }}>{attr.label}</span>
                    <span style={{ fontSize: '0.875rem', color: '#242424', fontWeight: 500, letterSpacing: '-0.2px' }}>{attr.val}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Action Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '90px' }}>
            
            {/* Price Box */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#898989', textTransform: 'uppercase', letterSpacing: '0.04em' }}>TOTAL COST</span>
              <p style={{ fontSize: '1.75rem', fontWeight: 600, color: '#101010', marginTop: '0.2rem', fontFamily: "'Poppins', sans-serif" }}>
                {formatPrice(prop.price)}
              </p>
              <div style={{ height: '1px', background: '#e5e7eb', margin: '1rem 0' }} />
              <p style={{ fontSize: '0.8125rem', color: '#6b7280', fontWeight: 400, letterSpacing: '-0.2px', lineHeight: 1.4 }}>
                Owner listings have 0% broker commission.
              </p>
            </div>

            {/* Unlock Contact Verification Box */}
            <div style={{ background: '#ffffff', borderRadius: '12px', padding: '1.75rem', color: '#242424', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', border: '1px solid #e5e7eb' }}>
              
              {prop.unlocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <span className="badge-verified" style={{ alignSelf: 'flex-start' }}>OWNER CONTACT</span>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Landowner Name</p>
                    <p style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#101010', letterSpacing: '-0.2px' }}>{prop.owner_name || 'Landowner'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.02em' }}>Contact Number</p>
                    <p style={{ fontSize: '1.125rem', fontWeight: 600, color: '#101010', letterSpacing: '0.02em' }}>{prop.owner_phone || '+91 XXXXX XXXXX'}</p>
                  </div>
                  <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }} />
                  <p style={{ fontSize: '0.8125rem', color: '#6b7280', lineHeight: 1.4, letterSpacing: '-0.2px' }}>
                    Deed survey sketches and FMB diagrams have been unlocked for download in your secure vault.
                  </p>
                </div>
              ) : (
                <>
                  <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem', color: '#101010', letterSpacing: '0.01em' }}>
                    Unlock Owner Contact
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: 1.4, marginBottom: '1.5rem', letterSpacing: '-0.2px' }}>
                    Pay a refundable UPI processing fee of ₹500 to view land survey deeds, boundary coordinates, and connect directly with the landowner.
                  </p>

                  {error && <div className="error-box" style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>{error}</div>}

                  <button
                    onClick={handleMockUnlock}
                    disabled={unlocking}
                    className="btn-primary"
                    style={{ width: '100%', padding: '0.75rem', fontSize: '0.875rem', borderRadius: '9999px', fontWeight: 500 }}
                  >
                    {unlocking ? 'Acquiring payment token...' : 'Pay ₹500 & View Contact'}
                  </button>

                  <p style={{ fontSize: '0.75rem', color: '#898989', marginTop: '1rem', textAlign: 'center', letterSpacing: '-0.2px' }}>
                    Refundable if survey deeds are unverified.
                  </p>
                </>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
