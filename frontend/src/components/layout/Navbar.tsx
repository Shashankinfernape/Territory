import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { api, clearToken } from '../../lib/api';
import { useState, useEffect, useRef } from 'react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language, setLanguage, t } = useLanguage();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobileMap = isMobile && location.pathname === '/map';
  const searchTerm = searchParams.get('search') || '';

  const handleSearchChange = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) newParams.set('search', val);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleBlurInput = () => {
      if (inputRef.current) {
        inputRef.current.blur();
      }
    };
    window.addEventListener('blur-mobile-search', handleBlurInput);
    return () => window.removeEventListener('blur-mobile-search', handleBlurInput);
  }, []);

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
    <nav className={`navbar notranslate${scrolled ? ' scrolled' : ''}`}>
      <div className="navbar-container">

        {/* Left: Brand */}
        <div className="navbar-left" style={isMobileMap ? { flex: 'none' } : {}}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
            {!isMobileMap ? (
              /* Combined Logo & Title SVG (Provided by User) */
              <img
                src="/final_logo.svg"
                alt="Territory Land Market"
                style={{
                  height: '42px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
            ) : (
              /* Same logo for mobile, adjusting height to fit */
              <img
                src="/final_logo.svg"
                alt="Territory Logo"
                style={{
                  height: '38px',
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
            )}
          </Link>
        </div>


        {/* Mobile Search Input between logo icon and hamburger */}
        {isMobileMap && (
          <div style={{
            flex: 1,
            margin: '0 0.25rem 0 0.4rem',
            display: 'flex',
            alignItems: 'center',
            height: '32px',
            background: '#FDFBF7',
            borderRadius: '99px',
            padding: '0 0.75rem',
            border: '1px solid #e5e7eb'
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="Search lands..."
              value={searchTerm}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => {
                window.dispatchEvent(new CustomEvent('mobile-search-focus'));
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.78rem',
                color: '#2C2C2C',
                fontFamily: 'inherit'
              }}
            />
          </div>
        )}

        {/* Center: Menu links */}
        <div className="navbar-center">
          <div className="nav-menu" style={language === 'ta' ? { gap: '0.85rem' } : {}}>
            <Link to="/" className={`nav-menu-link${location.pathname === '/' ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
              {t("Home")}
            </Link>
            <Link to="/browse" className={`nav-menu-link${isActive('/browse') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
              {t("Buy")}
            </Link>
            {!loggedIn && (
              <Link to="/sell-guide" className={`nav-menu-link${isActive('/sell-guide') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
                {t("Sell")}
              </Link>
            )}
            {loggedIn && role !== 'SELLER' && role !== 'ADMIN' && (
              <Link to="/sell-guide" className={`nav-menu-link${isActive('/sell-guide') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
                {t("Sell")}
              </Link>
            )}
            <Link to="/map" className={`nav-menu-link${isActive('/map') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
              {t("Map View")}
            </Link>
            {loggedIn && (
              <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} className={`nav-menu-link${isActive('/dashboard') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
                {t("Dashboard")}
              </Link>
            )}
            {loggedIn && (
              <Link to="/wishlist" className={`nav-menu-link${isActive('/wishlist') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
                {t("Wishlist")}
              </Link>
            )}
            <Link to="/help" className={`nav-menu-link${isActive('/help') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
              {t("Help")}
            </Link>
            <Link to="/contact" className={`nav-menu-link${isActive('/contact') ? ' active' : ''}`} style={language === 'ta' ? { fontSize: '0.92rem', fontWeight: 600, padding: '0.35rem 0.5rem' } : {}}>
              {t("Contact")}
            </Link>
          </div>
        </div>

        {/* Right: Actions (Desktop & Mobile Unified) */}
        <div className="navbar-right" ref={dropdownRef} style={isMobileMap ? { flex: 'none' } : {}}>
          {/* Desktop Right Actions */}
          <div className="desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              style={{
                background: 'transparent',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '0.35rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#2C2C2C',
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {language === 'en' ? 'தமிழ்' : 'English'}
            </button>
            {loggedIn ? (
              <>
                <Link to="/wishlist" className="nav-link-item" title="Wishlist" style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid #e5e7eb', textDecoration: 'none',
                  background: isActive('/wishlist') ? '#FDFBF7' : 'transparent',
                  transition: 'background 0.15s ease',
                  boxSizing: 'border-box'
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive('/wishlist') ? '#2C2C2C' : '#6b7280'} strokeWidth="2">
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

                {(role === 'SELLER' || role === 'ADMIN') && (
                  <Link
                    to="/dashboard/seller/upload"
                    className="btn-olx-sell"
                    style={{ gap: '0.25rem' }}
                  >
                    <span>{t("Sell")}</span>
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
                      <div style={{ width: '100%', height: '100%', background: '#2C2C2C', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.72rem' }}>
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
                      <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #FDFBF7' }}>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2C2C2C' }}>{displayName}</p>
                        <span style={{ fontSize: '0.6875rem', fontWeight: 500, color: '#6b7280', marginTop: '0.15rem', display: 'block', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                          {role === 'ADMIN' ? 'Administrator' : 'Member'}
                        </span>
                      </div>
                      <Link to="/" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>{t("Home")}</Link>
                      <Link to="/browse" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>{t("Browse Listings")}</Link>
                      <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>{t("My Dashboard")}</Link>
                      <Link to="/help" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>{t("Help Center")}</Link>
                      <Link to="/settings" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>{t("Settings")}</Link>
                      <Link to="/contact" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.8125rem', borderRadius: '8px' }}>{t("Contact Support")}</Link>
                      <div style={{ height: '1px', background: '#FDFBF7', margin: '0.3rem 0' }} />
                      <button onClick={handleLogout} style={{ width: '100%', padding: '0.55rem 0.8rem', background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 500, fontSize: '0.8125rem', textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit' }}>{t("Logout")}</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" state={{ mode: 'login' }} style={{ fontSize: '0.875rem', fontWeight: 500, color: '#4b5563', textDecoration: 'none' }}>{t("Sign in")}</Link>
                <Link to="/login" state={{ mode: 'register' }} className="btn-pill-dark" style={{ textDecoration: 'none' }}>
                  <span>{t("Get started")}</span>
                </Link>
              </>
            )}

          </div>

          {isMobile && (role === 'SELLER' || role === 'ADMIN') && (location.pathname === '/' || location.pathname === '/browse' || location.pathname === '/map') && (
            <Link
              to="/dashboard/seller/upload"
              className="btn-olx-sell"
              style={{ gap: '0.15rem', marginRight: '0.15rem' }}
            >
              <span>{t("Sell")}</span>
            </Link>
          )}

          {/* Mobile Menu Button */}
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', padding: '0.25rem'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '16px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.08)', zIndex: 999999, padding: '0.75rem',
              display: 'flex', flexDirection: 'column', gap: '0.45rem'
            }}>
              {/* SECTION 1 - Main Links matching Desktop */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Home</Link>
                <Link to="/browse" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Buy</Link>
                {!loggedIn && (
                  <Link to="/sell-guide" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Sell</Link>
                )}
                {loggedIn && role !== 'SELLER' && role !== 'ADMIN' && (
                  <Link to="/sell-guide" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Sell</Link>
                )}
                <Link to="/map" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Map View</Link>
                {loggedIn && (
                  <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Dashboard</Link>
                )}
                {loggedIn && (
                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Wishlist</Link>
                )}
                <Link to="/help" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Help</Link>
                <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.65rem 1rem', color: '#2C2C2C', textDecoration: 'none', fontSize: '0.88rem', fontWeight: 500, fontFamily: "'Inter', sans-serif" }}>Contact</Link>
              </div>

              <div style={{ height: '1px', background: '#f0efee', margin: '0.2rem 0' }} />

              {/* SECTION 3 (Auth display / Actions) */}
              {loggedIn ? (
                <div style={{ padding: '0.35rem 0.5rem 0.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem', background: '#f9fafb', borderRadius: '10px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', background: '#2C2C2C', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem' }}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        displayName ? displayName[0].toUpperCase() : 'U'
                      )}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#2C2C2C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</p>
                      <span style={{ fontSize: '0.68rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.02em' }}>{role === 'ADMIN' ? 'Admin' : 'Member'}</span>
                    </div>
                  </div>
                  <Link to={role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer')} onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.6rem 0.5rem', color: '#4b5563', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>My Dashboard</Link>
                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} style={{ display: 'block', padding: '0.6rem 0.5rem', color: '#4b5563', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}>Wishlist</Link>
                  <button onClick={handleLogout} style={{ width: '100%', padding: '0.75rem', background: 'transparent', border: 'none', color: '#dc2626', fontWeight: 700, fontSize: '0.88rem', textAlign: 'center', cursor: 'pointer', borderRadius: '10px', fontFamily: 'inherit', marginTop: '0.2rem' }}>Logout</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.35rem 0.5rem 0.5rem' }}>
                  <Link
                    to="/login"
                    state={{ mode: 'login' }}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#ffffff', border: '1.5px solid #d1d5db', borderRadius: '10px',
                      color: '#2C2C2C', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box'
                    }}
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/login"
                    state={{ mode: 'register' }}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#2C2C2C', color: '#ffffff', borderRadius: '10px',
                      textDecoration: 'none', fontSize: '0.85rem', fontWeight: 700,
                      fontFamily: "'Inter', sans-serif", boxSizing: 'border-box'
                    }}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
