import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearToken } from '../../lib/api';
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
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
            <Link to="/" className={`nav-menu-link${isActive('/') && location.pathname === '/' ? ' active' : ''}`}>
              Browse
            </Link>
            {loggedIn && (
              <Link to={role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/buyer'} className={`nav-menu-link${isActive('/dashboard') ? ' active' : ''}`}>
                Dashboard
              </Link>
            )}
            {loggedIn && (
              <Link to="/wishlist" className={`nav-menu-link${isActive('/wishlist') ? ' active' : ''}`}>
                Wishlist
              </Link>
            )}
            <Link to="/help" className="nav-menu-link">
              Help
            </Link>
            <Link to="/contact" className="nav-menu-link">
              Contact
            </Link>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right">
          {loggedIn ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }}>

              {/* Wishlist Icon on Mobile */}
              <Link to="/wishlist" className="nav-link-item" title="Wishlist" style={{
                width: '32px', height: '32px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid #e5e7eb', textDecoration: 'none',
                background: isActive('/wishlist') ? '#f4f4f4' : 'transparent',
                transition: 'background 0.15s ease'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24"
                  fill="none"
                  stroke={isActive('/wishlist') ? '#101010' : '#6b7280'} strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </Link>

              {/* Sell Button */}
              <Link to="/dashboard/seller" className="btn-pill-dark">
                <span style={{ marginRight: '0.15rem', fontWeight: 600 }}>+</span>
                <span className="nav-btn-text">List Land</span>
              </Link>

              {/* User Avatar */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{
                  width: '30px', height: '30px', borderRadius: '50%',
                  background: 'transparent', border: '1px solid #e5e7eb',
                  cursor: 'pointer', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', transition: 'border-color 0.15s ease'
                }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', background: '#101010',
                      color: '#ffffff', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 600, fontSize: '0.72rem'
                    }}>
                      {displayName ? displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '200px',
                    background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px',
                    boxShadow: 'rgba(36,36,36,0.05) 0px 4px 8px 0px', zIndex: 999, padding: '0.3rem'
                  }}>
                    <div style={{ padding: '0.6rem 0.8rem', borderBottom: '1px solid #f4f4f4' }}>
                      <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#101010' }}>{displayName}</p>
                      <span style={{
                        fontSize: '0.6875rem', fontWeight: 500, color: '#6b7280',
                        marginTop: '0.15rem', display: 'block', letterSpacing: '0.02em', textTransform: 'uppercase'
                      }}>
                        {role === 'ADMIN' ? 'Administrator' : 'Member'}
                      </span>
                    </div>

                    {role === 'ADMIN' ? (
                      <Link to="/dashboard/admin" onClick={() => setDropdownOpen(false)}
                        style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 400, borderRadius: '8px' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f4f4'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Admin Panel</Link>
                    ) : (
                      <Link to="/dashboard/buyer" onClick={() => setDropdownOpen(false)}
                        style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 400, borderRadius: '8px' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f4f4'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>My Dashboard</Link>
                    )}
                    <Link to="/help" onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 400, borderRadius: '8px' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f4f4'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Help Center</Link>
                    <Link to="/contact" onClick={() => setDropdownOpen(false)}
                      style={{ display: 'block', padding: '0.55rem 0.8rem', color: '#242424', textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 400, borderRadius: '8px' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f4f4f4'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>Contact Support</Link>

                    <div style={{ height: '1px', background: '#f4f4f4', margin: '0.3rem 0' }} />
                    <button id="navbar-logout" onClick={handleLogout} style={{
                      width: '100%', padding: '0.55rem 0.8rem', background: 'transparent', border: 'none',
                      color: '#dc2626', fontWeight: 500, fontSize: '0.8125rem',
                      textAlign: 'left', cursor: 'pointer', borderRadius: '8px', fontFamily: 'inherit'
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#fef2f2'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      Logout
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <Link to="/login" state={{ mode: 'login' }} style={{
                fontSize: '0.875rem', fontWeight: 500, color: '#4b5563',
                textDecoration: 'none', transition: 'color 0.2s ease'
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#111827'}
                onMouseLeave={e => e.currentTarget.style.color = '#4b5563'}>
                Sign in
              </Link>
              <Link to="/login" state={{ mode: 'register' }} className="btn-pill-dark" style={{ textDecoration: 'none' }}>
                <span>Get started</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '0.15rem' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}
