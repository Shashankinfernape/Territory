import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clearToken, isAuthenticated } from '../../lib/api';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setLoggedIn(isAuthenticated());
      setRole(localStorage.getItem('user_role'));
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
    setRole(null);
    navigate('/');
  };

  const dashboardPath = role === 'SELLER'
    ? '/dashboard/seller'
    : role === 'ADMIN'
      ? '/dashboard/admin'
      : '/dashboard/buyer';

  const isActive = (path: string) => location.pathname === path;

  const linkStyle = (path: string) => ({
    fontSize: '0.88rem',
    fontWeight: 500,
    color: isActive(path) ? '#16a34a' : '#475569',
    textDecoration: 'none',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    background: isActive(path) ? 'rgba(22,163,74,0.08)' : 'transparent',
    transition: 'all 0.15s',
  });

  return (
    <nav className="navbar">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem'
            }}>🗺️</div>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>TERRITORY</span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Link to="/" style={linkStyle('/')}
              onMouseEnter={e => { if (!isActive('/')) (e.currentTarget as HTMLElement).style.color = '#16a34a'; }}
              onMouseLeave={e => { if (!isActive('/')) (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
              Browse
            </Link>
            <Link to="/help" style={linkStyle('/help')}
              onMouseEnter={e => { if (!isActive('/help')) (e.currentTarget as HTMLElement).style.color = '#16a34a'; }}
              onMouseLeave={e => { if (!isActive('/help')) (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
              Help
            </Link>
            <Link to="/contact" style={linkStyle('/contact')}
              onMouseEnter={e => { if (!isActive('/contact')) (e.currentTarget as HTMLElement).style.color = '#16a34a'; }}
              onMouseLeave={e => { if (!isActive('/contact')) (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
              Contact
            </Link>

            <div style={{ width: '1px', height: '20px', background: '#e2e8f0', margin: '0 0.5rem' }} />

            {loggedIn ? (
              <>
                <Link to={dashboardPath} style={linkStyle(dashboardPath)}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#16a34a'; }}
                  onMouseLeave={e => { if (!isActive(dashboardPath)) (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
                  Dashboard
                </Link>
                <button id="navbar-logout" onClick={handleLogout} style={{
                  fontSize: '0.88rem', fontWeight: 600, color: '#64748b',
                  background: '#f1f5f9', border: 'none', borderRadius: '8px',
                  padding: '0.4rem 1rem', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fee2e2'; (e.currentTarget as HTMLElement).style.color = '#dc2626'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f1f5f9'; (e.currentTarget as HTMLElement).style.color = '#64748b'; }}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" id="navbar-login" style={{
                fontSize: '0.88rem', fontWeight: 600, color: 'white',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                padding: '0.45rem 1.1rem', borderRadius: '8px', textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(22,163,74,0.25)', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(22,163,74,0.35)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(22,163,74,0.25)'; }}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
