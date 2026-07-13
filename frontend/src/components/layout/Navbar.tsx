import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api, clearToken } from '../../lib/api';
import { useState, useEffect, useRef } from 'react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (role === 'ADMIN') {
      const fetchAdminStats = async () => {
        try {
          const res = await api.get('/admin/stats');
          const count = (res.data.pending_properties || 0) + (res.data.pending_sellers || 0);
          setAdminNotifications(count);
        } catch (e) {
          console.error("Failed to fetch admin notifications");
        }
      };
      fetchAdminStats();

      const interval = setInterval(fetchAdminStats, 10000);
      window.addEventListener('admin-notifications-update', fetchAdminStats);

      return () => {
        clearInterval(interval);
        window.removeEventListener('admin-notifications-update', fetchAdminStats);
      };
    }
  }, [role]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setLoggedIn(true);
        setRole(localStorage.getItem('user_role'));
        setAvatarUrl(user.photoURL);
        setDisplayName(user.displayName || user.email);
      } else {
        setLoggedIn(false); setRole(null); setAvatarUrl(null); setDisplayName(null);
      }
    });

    const checkRole = () => setRole(localStorage.getItem('user_role'));
    window.addEventListener('storage', checkRole);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', checkRole);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try { await signOut(auth); } catch (e) { console.error(e); }
    clearToken();
    setLoggedIn(false); setRole(null); setAvatarUrl(null); setDisplayName(null);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-container">

        {/* Left: Brand */}
        <div className="navbar-left">
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '6px',
              background: '#101010',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
              </svg>
            </div>
            <span className="nav-logo-text" style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '1rem', fontWeight: 600, color: '#101010', letterSpacing: '0.01em'
            }}>
              TERRITORY
            </span>
          </Link>
        </div>

        {/* Center: Menu links */}
        <div className="navbar-center">
          <div className="nav-menu">
            <Link to="/" className={`nav-menu-link${location.pathname === '/' ? ' active' : ''}`}>
              Home
            </Link>
            <Link to="/browse" className={`nav-menu-link${isActive('/browse') ? ' active' : ''}`}>
              Buy
            </Link>
            {!loggedIn && (
              <Link to="/sell-guide" className={`nav-menu-link${isActive('/sell-guide') ? ' active' : ''}`}>
                Sell
              </Link>
            )}
            <Link to="/map" className={`nav-menu-link${isActive('/map') ? ' active' : ''}`}>
              Map View
            </Link>
            {loggedIn && (
              <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} className={`nav-menu-link${isActive('/dashboard') ? ' active' : ''}`}>
                Dashboard
              </Link>
            )}
            {loggedIn && (
              <Link to="/wishlist" className={`nav-menu-link${isActive('/wishlist') ? ' active' : ''}`}>
                Wishlist
              </Link>
            )}
            <Link to="/help" className={`nav-menu-link${isActive('/help') ? ' active' : ''}`}>
              Help
            </Link>
            <Link to="/contact" className={`nav-menu-link${isActive('/contact') ? ' active' : ''}`}>
              Contact
            </Link>
          </div>
        </div>

        {/* Right: Actions (Desktop & Mobile Unified) */}
        <div className="navbar-right" ref={dropdownRef}>
          {/* Desktop Right Actions */}
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {loggedIn ? (
              <>
                <Link to="/wishlist" className="nav-link-item" title="Wishlist" style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #e5e7eb', textDecoration: 'none',
                  background: isActive('/wishlist') ? '#f4f4f4' : 'transparent',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive('/wishlist') ? '#101010' : '#6b7280'} strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </Link>

                {role === 'ADMIN' && (
                  <Link to="/dashboard/admin" className="nav-link-item" title="Admin Notifications" style={{
                    width: '32px', height: '32px', borderRadius: '50%', position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid #e5e7eb', textDecoration: 'none',
                    background: 'transparent', transition: 'background 0.15s ease',
                    boxSizing: 'border-box'
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    {adminNotifications > 0 && (
                      <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#ff3b30', color: '#fff', fontSize: '0.6rem',
                        fontWeight: 800, width: '16px', height: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '50%', border: '2px solid #fff'
                      }}>
                        {adminNotifications > 9 ? '9+' : adminNotifications}
                      </span>
                    )}
                  </Link>
                )}

                {/* Sell Land pill — always visible for logged-in users, goes directly to upload form */}
                {(role === 'SELLER' || role === 'ADMIN') && (
                  <Link
                    to="/dashboard/seller/upload"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      background: '#ffffff',
                      color: '#101010',
                      border: '3.5px solid',
                      borderTopColor: '#6b7280',
                      borderRightColor: '#374151',
                      borderBottomColor: '#101010',
                      borderLeftColor: '#898989',
                      borderRadius: '9999px',
                      height: '32px',
                      padding: '0 0.85rem',
                      boxSizing: 'border-box',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.74rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      textDecoration: 'none',
                      transition: 'transform 0.1s ease',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>+</span>
                    <span>Sell</span>
                  </Link>
                )}

                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    role="button"
                    tabIndex={0}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'transparent',
                      border: '1px solid #e5e7eb',
                      cursor: 'pointer',
                      padding: 0,
                      margin: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s ease',
                      outline: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDropdownOpen(!dropdownOpen); }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#101010', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.72rem' }}>
                        {displayName ? displayName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>

                  {dropdownOpen && (
                    <div className="desktop-dropdown" style={{
                      position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '200px',
                      background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px',
                      boxShadow: 'rgba(36,36,36,0.05) 0px 4px 8px 0px', zIndex: 999, padding: '0.3rem'
                    }}>
                      <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #f4f4f4' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#101010' }}>{displayName}</p>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6b7280', marginTop: '0.15rem', display: 'block', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          {role === 'ADMIN' ? 'Administrator' : 'Member'}
                        </span>
                      </div>
                      <Link to="/" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>Home</Link>
                      <Link to="/browse" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>Browse Listings</Link>
                      <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>My Dashboard</Link>
                      <Link to="/help" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>Help Center</Link>
                      <Link to="/settings" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>Settings</Link>
                      <Link to="/contact" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>Contact Support</Link>
                      <div style={{ height: '1px', background: '#f4f4f4', margin: '0.3rem 0' }} />
                      <button onClick={handleLogout} style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 500, fontSize: '0.8125rem', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" state={{ mode: 'login' }} style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>Sign in</Link>
                <Link to="/login" state={{ mode: 'register' }} className="btn-pill-dark" style={{ textDecoration: 'none' }}>
                  <span>Get started</span>
                </Link>
              </>
            )}

            {/* Settings Icon (Desktop) */}
            <Link to="/settings" title="Settings" style={{
              width: '32px', height: '32px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid #e5e7eb', textDecoration: 'none',
              background: isActive('/settings') ? '#f4f4f4' : 'transparent',
              transition: 'background 0.15s ease, transform 0.1s ease',
              boxSizing: 'border-box',
              marginLeft: '0.25rem'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(30deg) scale(1.05)'; e.currentTarget.style.background = '#f9fafb'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; e.currentTarget.style.background = isActive('/settings') ? '#f4f4f4' : 'transparent'; }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={isActive('/settings') ? '#101010' : '#4b5563'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', padding: '0.25rem'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#242424" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mobile-dropdown-menu" style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: '1.25rem', left: '1.25rem',
              background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px',
              boxShadow: 'rgba(36,36,36,0.1) 0px 10px 20px -5px', zIndex: 9999, padding: '0.5rem',
              display: 'flex', flexDirection: 'column'
            }}>
              {loggedIn && (
                <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #f4f4f4', marginBottom: '0.25rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#101010' }}>{displayName}</p>
                </div>
              )}
              <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Home</Link>
              <Link to="/browse" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Browse All</Link>
              <Link to="/map" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Map Search</Link>
              {loggedIn && (
                <>
                  <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>My Dashboard</Link>
                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Wishlist</Link>
                  {(role === 'SELLER' || role === 'ADMIN') && (
                    <Link
                      to="/dashboard/seller/upload"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.35rem',
                        margin: '0.5rem 0.25rem',
                        padding: '0.65rem 1.25rem',
                        background: '#ffffff',
                        color: '#101010',
                        border: '4px solid #101010',
                        borderRadius: '9999px',
                        textDecoration: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        textAlign: 'center'
                      }}
                    >
                      <span style={{ fontSize: '1rem', fontWeight: 900 }}>+</span>
                      <span>Sell Land</span>
                    </Link>
                  )}
                </>
              )}
              <Link to="/help" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Help Center</Link>
              <Link to="/settings" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Settings</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 1rem', color: '#242424', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px' }}>Contact Support</Link>
              
              <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }} />
              
              {loggedIn ? (
                <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem 1rem', background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 600, fontSize: '0.9375rem', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>Logout</button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem' }}>
                  <Link to="/browse" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0.5rem', color: '#242424', textDecoration: 'none', fontWeight: 500 }}>Buy Land</Link>
                  <Link to="/map" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0.5rem', color: '#242424', textDecoration: 'none', fontWeight: 500 }}>Map Search</Link>
                  <Link to="/sell-guide" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.75rem 0.5rem', color: '#242424', textDecoration: 'none', fontWeight: 500 }}>Sell Land</Link>
                  <div style={{ height: '1px', background: '#e5e7eb', margin: '0.25rem 0' }} />
                  <Link to="/login" state={{ mode: 'login' }} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '0.75rem', color: '#4b5563', textDecoration: 'none', fontWeight: 500, border: '1px solid #e5e7eb', borderRadius: '8px' }}>Sign in</Link>
                  <Link to="/login" state={{ mode: 'register' }} onClick={() => setMobileMenuOpen(false)} className="btn-pill-dark" style={{ width: '100%', display: 'flex', textDecoration: 'none' }}>Get started</Link>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
