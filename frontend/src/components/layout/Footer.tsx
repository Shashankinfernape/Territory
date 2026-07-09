import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '3rem 1.5rem 2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem'
              }}>🗺️</div>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>TERRITORY</span>
            </div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6, color: '#64748b', margin: 0 }}>
              Secure, verified land transactions for agricultural and residential plots across India.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[{ to: '/', label: 'Browse Land' }, { to: '/login', label: 'Sign In' }, { to: '/login', label: 'Create Account' }].map(l => (
                <Link key={l.label} to={l.to} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.83rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#22c55e'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[{ to: '/help', label: 'Help Center' }, { to: '/contact', label: 'Contact Us' }].map(l => (
                <Link key={l.label} to={l.to} style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.83rem', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#22c55e'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>{l.label}</Link>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h4 style={{ color: 'white', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.75rem' }}>Get in Touch</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.83rem', color: '#64748b' }}>📧 support@territory.in</span>
              <span style={{ fontSize: '0.83rem', color: '#64748b' }}>📞 +91 98765 43210</span>
              <span style={{ fontSize: '0.83rem', color: '#64748b' }}>📍 Chennai, Tamil Nadu</span>
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #1e293b', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.78rem', color: '#334155' }}>© {new Date().getFullYear()} TERRITORY. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {['Privacy Policy', 'Terms of Service'].map(t => (
              <a key={t} href="#" style={{ fontSize: '0.78rem', color: '#334155', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#22c55e'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#334155'}>{t}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
