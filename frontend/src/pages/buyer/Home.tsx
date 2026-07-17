import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api, getToken } from '../../lib/api';
import type { Property } from '../../lib/types';
import TextType from '../../components/TextType';
import { useSettings } from '../../contexts/SettingsContext';
import { PropertyCard } from '../../components/ui/PropertyCard';
import SwordSplitButtons from '../../components/ui/SwordSplitButtons';

export default function Home() {
  const [featured, setFeatured] = useState<Property[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Property[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { animationSetting } = useSettings();
  const isLoggedIn = !!getToken();

  // Drag-to-scroll state
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragAmount, setDragAmount] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setDragAmount(0);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    setDragAmount(prev => prev + Math.abs(walk));
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollLeftBy = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };
  
  const scrollRightBy = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

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

  // Load recently viewed from localStorage
  useEffect(() => {
    try {
      const recentStr = localStorage.getItem('recentlyViewed');
      if (recentStr) {
        setRecentlyViewed(JSON.parse(recentStr));
      }
    } catch(e) {
      console.error(e);
    }
  }, []);

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

      {/* HERO (Shown to all users) */}
      <div className="hero-cinematic" style={{ padding: '4rem 0.75rem', textAlign: 'center' }}>
          <div className="hero-inner" style={{ maxWidth: '800px', margin: '0 auto' }}>

            <TextType
              as="h1"
              className="hero-title"
              text={"Land that's truly\nyours to own."}
              typingSpeed={40}
              pauseDuration={2000}
              showCursor={true}
              hideCursorOnComplete={true}
              cursorCharacter="|"
              loop={false}
              style={{ marginBottom: '1rem' }}
            />

            <div style={{ marginTop: '3rem' }}>
              <TextType
                as="h3"
                style={{ fontSize: '1.5rem', color: '#6b7280', marginBottom: '2rem', fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
                text={"How would you like to get started?"}
                typingSpeed={50}
                initialDelay={2000}
                showCursor={true}
                cursorCharacter="|"
                loop={false}
              />
              <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60px' }}>
                <SwordSplitButtons />
              </div>
            </div>

          </div>
        </div>

      {/* RECENTLY VIEWED (Horizontal Scroll) */}
      {recentlyViewed.length > 0 && (
        <div style={{ maxWidth: '100%', margin: '0.5rem auto 0', padding: '0.5rem 0.75rem 0.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: '#2C2C2C', margin: 0, letterSpacing: '-0.01em' }}>
              Recently Viewed
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.2rem', letterSpacing: '-0.2px' }}>
              Pick up right where you left off
            </p>
          </div>
          
          <div style={{ position: 'relative' }}>
            <div 
              ref={scrollRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              className="horizontal-scroll-container" 
              style={{ 
                display: 'flex', overflowX: 'auto', gap: '1.25rem', paddingBottom: '1rem', 
                scrollSnapType: isDragging ? 'none' : 'x mandatory', 
                WebkitOverflowScrolling: 'touch',
                cursor: isDragging ? 'grabbing' : 'grab',
                // hide scrollbar for cleaner look
                msOverflowStyle: 'none', scrollbarWidth: 'none' 
              }}
            >
              {recentlyViewed.map(p => (
                <div key={p.id} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: '100%', maxWidth: '320px', minWidth: '290px' }}>
                  <PropertyCard 
                    property={p} 
                    isWishlisted={wishlist.includes(p.id)} 
                    onToggleWishlist={toggleWishlist} 
                    isTogglingWishlist={togglingId === p.id} 
                    animationSetting={animationSetting} 
                    dragAmount={dragAmount} 
                  />
                </div>
              ))}
            </div>
            {/* Left Button Over Image */}
            <button 
              onClick={scrollLeftBy}
              style={{ position: 'absolute', left: '10px', top: '105px', transform: 'translateY(-50%)', zIndex: 20, width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(229, 231, 235, 0.5)', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <svg width="20" height="20" fill="none" stroke="#2C2C2C" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>

            {/* Right Button Over Image */}
            <button 
              onClick={scrollRightBy}
              style={{ position: 'absolute', right: '10px', top: '105px', transform: 'translateY(-50%)', zIndex: 20, width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(229, 231, 235, 0.5)', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
            >
              <svg width="20" height="20" fill="none" stroke="#2C2C2C" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* 🌟 FEATURED SHOWCASE 🌟 */}
      {isLoggedIn && (
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0.5rem 0.75rem 2.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: '#2C2C2C', margin: 0, letterSpacing: '-0.01em' }}>
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
              <div key={i} className="property-card" style={{ height: '100%' }}>
                <div className="skeleton" style={{ aspectRatio: '16/9', width: '100%', borderRadius: '12px 12px 0 0' }} />
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
              <PropertyCard 
                key={p.id}
                property={p} 
                isWishlisted={wishlist.includes(p.id)} 
                onToggleWishlist={toggleWishlist} 
                isTogglingWishlist={togglingId === p.id} 
                animationSetting={animationSetting} 
              />
            ))}
          </div>
        )}

        {/* CTA to Browse all */}
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <Link to="/browse" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#2C2C2C', color: '#ffffff', padding: '0.85rem 2rem',
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
      )}
    </div>
  );
}