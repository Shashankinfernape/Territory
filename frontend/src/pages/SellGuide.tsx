import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function SellGuide() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('user_role');

  // If seller or admin, redirect straight to dashboard
  useEffect(() => {
    if (token && (role === 'SELLER' || role === 'ADMIN')) {
      navigate('/dashboard/seller', { replace: true });
    }
  }, [token, role, navigate]);

  // Form state for logged-in buyers
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [alreadyPending, setAlreadyPending] = useState(false);

  useEffect(() => {
    if (!token || role === 'SELLER' || role === 'ADMIN') return;
    api.get('/auth/me').then(r => {
      if (r.data.is_seller_pending) setAlreadyPending(true);
    }).catch(() => {});
  }, [token, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone || phone.length < 10) { setError('Please enter a valid 10-digit phone number.'); return; }
    setSubmitting(true);
    try {
      await api.post('/auth/become-seller', { phone_number: phone });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── LOGGED-IN BUYER VIEW ─────────────────────────────────────────────────────
  if (token && role !== 'SELLER' && role !== 'ADMIN') {
    if (success) {
      return (
        <div className="fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Request Submitted!</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              Your seller promotion request is under review. Our admin team will verify your KYC details within 24–48 hours. You'll be notified once approved.
            </p>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', color: '#ffffff', padding: '0.7rem 1.5rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              Back to Home
            </Link>
          </div>
        </div>
      );
    }

    if (alreadyPending) {
      return (
        <div className="fade-in" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
          <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(234,179,8,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>Request Pending</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              You already have a seller promotion request under review. Our admin team will verify your details shortly. No action needed — we'll notify you on approval.
            </p>
            <Link to="/dashboard/buyer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0f172a', color: '#ffffff', padding: '0.7rem 1.5rem', borderRadius: '99px', fontSize: '0.875rem', fontWeight: 600, textDecoration: 'none' }}>
              My Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="fade-in" style={{ minHeight: '100vh', padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{ marginBottom: '2.5rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16,185,129,0.08)', color: '#059669', borderRadius: '99px', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Verified Sellers Only
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em', marginBottom: '0.75rem' }}>
              Become a Seller
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Provide your mobile number to request seller access. Our admin team reviews each request within 24–48 hours. Once approved, you can list your land directly to buyers — no brokers, no commissions.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            <div style={{ background: '#ffffff', borderRadius: '16px', padding: '1.75rem', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 1.25rem' }}>Contact Information</h3>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Mobile Number</label>
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  style={{ width: '100%', boxSizing: 'border-box', height: '44px', padding: '0 0.9rem', border: '1.5px solid #e5e7eb', borderRadius: '10px', fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none', background: '#fafafa', color: '#0f172a', transition: 'border-color 0.15s' }}
                  onFocus={e => e.target.style.borderColor = '#0f172a'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', color: '#dc2626', fontSize: '0.83rem', fontWeight: 500 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ height: '50px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: 'inherit', letterSpacing: '-0.01em', transition: 'opacity 0.15s' }}
            >
              {submitting ? 'Submitting...' : 'Submit Seller Request'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Your KYC details are encrypted and only visible to our admin team. We do not share your documents with third parties.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── GUEST VIEW ───────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ background: 'transparent', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700, color: '#2C2C2C', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Sell Your Land <span style={{ color: '#10b981' }}>Directly.</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            List your agricultural land, flat plots, or farm houses directly to buyers. No brokers, no hidden commissions.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '2rem', marginBottom: '4rem' }}>
          {[
            { n: 1, title: 'Create an Account', desc: 'Sign up for a free account using your email. Your contact details will only be shared with verified buyers.' },
            { n: 2, title: 'Complete KYC', desc: 'Submit your Aadhaar and PAN for quick verification. Our admin team reviews requests within 24–48 hours.' },
            { n: 3, title: 'List Your Property', desc: 'Fill in land specs — area, location, soil type, price — and upload photos and legal documents securely.' },
            { n: 4, title: 'Connect with Buyers', desc: 'Once your listing is live, interested buyers unlock your contact for a small ₹500 fee and negotiate directly with you.' },
          ].map(({ n, title, desc }) => (
            <div key={n} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', padding: '2rem', borderRadius: '12px', boxShadow: 'rgba(36,36,36,0.05) 0px 4px 12px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>{n}</div>
              <div>
                <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.1rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '0.4rem' }}>{title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.55, margin: 0 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', background: '#2C2C2C', padding: '3rem 2rem', borderRadius: '16px', color: '#ffffff' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem' }}>Ready to list your land?</h2>
          <p style={{ fontSize: '0.9375rem', color: '#a1a1aa', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Join hundreds of sellers bypassing brokers and getting the best value for their properties.
          </p>
          <Link to="/login" state={{ mode: 'register' }} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#ffffff', color: '#2C2C2C', padding: '0.85rem 1.75rem', borderRadius: '99px', fontSize: '0.9375rem', fontWeight: 600, textDecoration: 'none' }}>
            Create an Account to Start Selling
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
