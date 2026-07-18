import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer" style={{ padding: '3rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '2.5rem', marginBottom: '2.5rem' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '5px', background: '#2C2C2C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
              </div>
              <span className="notranslate" style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9rem', fontWeight: 600, color: '#2C2C2C', letterSpacing: '0.01em' }}>TERRITORY</span>
            </div>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: '#6b7280', maxWidth: '210px', letterSpacing: '-0.2px' }}>
              Deed-verified land transactions across Tamil Nadu. Direct from owners.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#898989', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {[{ to: '/', label: 'Browse listings' }, { to: '/login', label: 'Sign in' }, { to: '/login', label: 'Create account' }].map(l => (
                <Link key={l.label} to={l.to} className="footer-link">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#898989', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {[{ to: '/help', label: 'Help center' }, { to: '/contact', label: 'Contact us' }].map(l => (
                <Link key={l.label} to={l.to} className="footer-link">{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#898989', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Contact</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', letterSpacing: '-0.2px' }}>support@<span className="notranslate">territory</span>.in</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', letterSpacing: '-0.2px' }}>+91 98765 43210</span>
              <span style={{ fontSize: '0.875rem', color: '#6b7280', letterSpacing: '-0.2px' }}>Chennai, Tamil Nadu</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.8125rem', color: '#898989', letterSpacing: '-0.2px' }}>
            © {new Date().getFullYear()} <span className="notranslate">Territory</span>. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy policy', 'Terms of service'].map(t => (
              <a key={t} href="#" className="footer-link" style={{ fontSize: '0.8125rem' }}>{t}</a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
