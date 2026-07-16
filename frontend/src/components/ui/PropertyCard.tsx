import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Property } from '../../lib/types';
import { getAllPropertyImageUrls } from '../../lib/types';
import GlareHover from './GlareHover';

interface PropertyCardProps {
  property: Property;
  isWishlisted: boolean;
  onToggleWishlist: (e: React.MouseEvent, id: string) => void;
  isTogglingWishlist: boolean;
  animationSetting?: string;
  dragAmount?: number;
}

const formatPrice = (price: number) => {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
};

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  isWishlisted,
  onToggleWishlist,
  isTogglingWishlist,
  animationSetting = 'full',
  dragAmount = 0
}) => {
  const images = getAllPropertyImageUrls(property);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleNextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => (prev + 1) % images.length);
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveImageIndex(prev => (prev - 1 + images.length) % images.length);
  };

  return (
    <GlareHover
      disabled={animationSetting === 'minimal'}
      background="#ffffff"
      glareColor="#ffffff"
      glareOpacity={0.25}
      glareSize={200}
      borderRadius="12px"
      className="property-card"
      style={{ height: '100%' }}
    >
      <Link 
        to={`/property/${property.id}`} 
        onClick={(e) => { if (dragAmount > 15) e.preventDefault(); }}
        draggable={false}
        style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="card-img" style={{ position: 'relative', width: '100%', aspectRatio: '16/9', overflow: 'hidden', background: '#FDFBF7', flex: '0 0 auto' }}>
          <img 
            src={images[activeImageIndex]} 
            alt={property.type} 
            draggable={false} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
          
          {/* Dark gradient from bottom for text readability */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 40%, transparent 100%)', pointerEvents: 'none' }} />
          
          {/* Carousel Arrows (only visible on hover and if multiple images) */}
          {isHovering && images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                style={{
                  position: 'absolute', top: '50%', left: '0.5rem', transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)',
                  border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 20, transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.45)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button
                onClick={handleNextImage}
                style={{
                  position: 'absolute', top: '50%', right: '0.5rem', transform: 'translateY(-50%)',
                  background: 'rgba(255, 255, 255, 0.25)', backdropFilter: 'blur(4px)',
                  border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', zIndex: 20, transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.45)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </>
          )}

          {/* Carousel Dots */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '0.4rem', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '4px', zIndex: 20, pointerEvents: 'none' }}>
              {images.map((_, i) => (
                <div 
                  key={i} 
                  style={{ 
                    width: '5px', height: '5px', borderRadius: '50%', 
                    background: i === activeImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
                    transition: 'all 0.2s ease',
                    transform: i === activeImageIndex ? 'scale(1.2)' : 'scale(1)'
                  }} 
                />
              ))}
            </div>
          )}

          {/* Wishlist Button */}
          <button
            onClick={e => onToggleWishlist(e, property.id)}
            disabled={isTogglingWishlist}
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
            <svg width="26" height="26" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1.5px 3.5px rgba(0,0,0,0.7))', transition: 'all 0.15s ease' }}>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill={isWishlisted ? '#2C2C2C' : 'none'} stroke="#ffffff" strokeWidth="2.2" />
            </svg>
          </button>

          {/* Cinematic Overlay Text over Preview */}
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

        {/* 30% Details Section */}
        <div style={{ padding: '0.9rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
          <div>
            <h4 style={{ fontSize: '1.0625rem', fontWeight: 600, color: '#2C2C2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif", letterSpacing: '0.01em' }}>
              {property.city}{property.district ? `, ${property.district}` : ''}
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 400, letterSpacing: '-0.2px', marginTop: '0.2rem' }}>
              A Deed Verified
            </p>
          </div>
        </div>
      </Link>
    </GlareHover>
  );
};
