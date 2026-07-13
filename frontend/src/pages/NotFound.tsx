import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="fade-in" style={{ minHeight: '80vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', paddingLeft: '1rem', paddingRight: '1rem' }}>
      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '6rem', fontWeight: 600, color: '#e5e7eb', margin: 0, letterSpacing: '0.01em', lineHeight: 1 }}>
          404
        </h1>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: '#101010', marginTop: '1rem', letterSpacing: '0.01em' }}>
          Page Not Found
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.5, letterSpacing: '-0.2px' }}>
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div style={{ marginTop: '2rem' }}>
          <Link to="/" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
