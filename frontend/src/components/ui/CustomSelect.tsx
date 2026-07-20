import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  disabled = false,
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { label: string; value: string }[]; 
  placeholder: string; 
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetDragStartY = useRef(0);
  const sheetDragCurrentY = useRef(0);
  const sheetIsDragging = useRef(false);

  const onSheetPointerDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    sheetDragStartY.current = e.clientY;
    sheetDragCurrentY.current = 0;
    sheetIsDragging.current = true;
  };
  const onSheetPointerMove = (e: React.PointerEvent) => {
    if (!sheetIsDragging.current) return;
    const dy = e.clientY - sheetDragStartY.current;
    sheetDragCurrentY.current = dy;
    if (sheetRef.current && dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
  };
  const onSheetPointerUp = (e: React.PointerEvent) => {
    if (!sheetIsDragging.current) return;
    sheetIsDragging.current = false;
    try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    if (sheetDragCurrentY.current > 100) { setIsOpen(false); setSearch(''); }
    else if (sheetRef.current) sheetRef.current.style.transform = '';
    sheetDragCurrentY.current = 0;
  };
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const isMobileDevice = window.innerWidth <= 768;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (containerRef.current && !containerRef.current.contains(target) && !target.closest('.custom-select-menu')) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) setSearch('');
  }, [isOpen]);

  const openMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMobileDevice && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + 6, left: rect.left, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  const selectedLabel = value ? options.find(o => o.value === value)?.label : placeholder;
  const isActive = !!value;
  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  const optionsList = (
    <>
      {filtered.length === 0 && (
        <div style={{ padding: '1rem', fontSize: '0.82rem', color: '#9ca3af', textAlign: 'center' }}>No results</div>
      )}
      {filtered.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <div
            key={opt.value}
            onClick={(e) => {
              e.stopPropagation();
              onChange(opt.value);
              setIsOpen(false);
              setSearch('');
            }}
            style={{
              padding: '0.75rem 1rem',
              fontSize: '0.88rem',
              fontWeight: isSelected ? 700 : 500,
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              color: isSelected ? '#2C2C2C' : '#374151',
              background: isSelected ? 'rgba(0,0,0,0.05)' : 'transparent',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'background 0.12s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'rgba(0,0,0,0.03)'; }}
            onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          >
            <span style={{ pointerEvents: 'none' }}>{opt.label}</span>
            {isSelected && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ pointerEvents: 'none', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
        );
      })}
    </>
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', flex: isMobileDevice ? 1 : '0 0 auto', width: isMobileDevice ? undefined : (placeholder === 'District' ? '160px' : placeholder === 'City' ? '160px' : '170px'), minWidth: 0 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={openMenu}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '36px',
          padding: '0 0.85rem',
          background: isActive ? '#ffffff' : '#f9f9f9',
          border: isActive ? '1.5px solid #b8963e' : '1px solid #2C2C2C',
          borderRadius: '24px',
          fontSize: '0.82rem',
          fontWeight: isActive ? 700 : 600,
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          letterSpacing: '-0.01em',
          color: isActive ? '#2C2C2C' : '#4b5563',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.06)' : 'inset 0 1px 3px rgba(0,0,0,0.04)',
          outline: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', pointerEvents: 'none' }}>{selectedLabel}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: '4px', pointerEvents: 'none', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)' }}>
          <polyline points="5 8 10 13 15 8" />
        </svg>
      </button>

      {isOpen && !disabled && createPortal(
        isMobileDevice ? (
          /* ── MOBILE: Full bottom sheet ── */
          <div
            className="custom-select-menu"
            style={{ position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            onClick={(e) => { if (e.target === e.currentTarget) { setIsOpen(false); setSearch(''); } }}
          >
            {/* Backdrop */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' }} />
            {/* Sheet */}
            <div
              ref={sheetRef}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: '#ffffff',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                maxHeight: '82vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
                animation: 'slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
                transition: 'transform 0.1s ease',
              }}
            >
              {/* Draggable Handle */}
              <div
                onPointerDown={onSheetPointerDown}
                onPointerMove={onSheetPointerMove}
                onPointerUp={onSheetPointerUp}
                style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem', paddingBottom: '0.5rem', flexShrink: 0, cursor: 'grab', touchAction: 'none', userSelect: 'none' }}
              >
                <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: '#d1d5db' }} />
              </div>
              {/* Title + close */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 1.25rem 0.75rem', flexShrink: 0 }}>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#2C2C2C', fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: '-0.03em' }}>{placeholder}</span>
                <button onClick={() => { setIsOpen(false); setSearch(''); }} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              {/* Search */}
              <div style={{ padding: '0 1rem 0.75rem', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', background: '#FDFBF7', borderRadius: '14px', padding: '0 0.85rem', gap: '0.5rem', height: '42px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input
                    autoFocus
                    type="text"
                    placeholder={`Search ${placeholder.toLowerCase()}…`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ background: 'transparent', border: 'none', outline: 'none', flex: 1, fontSize: '0.88rem', color: '#2C2C2C', fontFamily: "'Inter', system-ui, sans-serif" }}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#9ca3af' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  )}
                </div>
              </div>
              {/* Options list */}
              <div style={{ overflowY: 'auto', padding: '0 0.65rem 1.5rem', flex: 1 }}>
                {optionsList}
              </div>
            </div>
          </div>
        ) : (
          /* ── DESKTOP: Floating dropdown ── */
          <div
            className="custom-select-menu"
            onWheel={(e) => { e.stopPropagation(); }}
            onTouchMove={(e) => { e.stopPropagation(); }}
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              width: `${Math.max(coords.width, 180)}px`,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: '16px',
              boxShadow: '0 12px 32px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)',
              border: '1px solid rgba(255,255,255,0.4)',
              zIndex: 999999,
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.35rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              animation: 'fadeInUp 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)',
              pointerEvents: 'auto',
              touchAction: 'pan-y'
            }}
          >
            
            {optionsList}
          </div>
        ),
        document.body
      )}
    </div>
  );
}
