import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../lib/api';

type Step = 'login' | 'choose-role' | 'register';

export default function Login() {
  const [step, setStep] = useState<Step>('login');
  const [role, setRole] = useState<'BUYER' | 'SELLER' | null>(null);

  // Login fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  /* ── Login ── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', phone);
      formData.append('password', password);
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setToken(res.data.access_token);
      const userRes = await api.get('/auth/me');
      const { role: userRole, phone_number } = userRes.data;
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_phone', phone_number);
      window.dispatchEvent(new Event('storage'));
      if (userRole === 'SELLER') navigate('/dashboard/seller');
      else if (userRole === 'ADMIN') navigate('/dashboard/admin');
      else navigate('/dashboard/buyer');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Incorrect phone number or password.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Register ── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', {
        phone_number: regPhone,
        password: regPassword,
        role,
        full_name: regName,
      });
      // Auto-login after registration
      const formData = new URLSearchParams();
      formData.append('username', regPhone);
      formData.append('password', regPassword);
      const res = await api.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
      setToken(res.data.access_token);
      const userRes = await api.get('/auth/me');
      const { role: userRole, phone_number } = userRes.data;
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_phone', phone_number);
      window.dispatchEvent(new Event('storage'));
      if (userRole === 'SELLER') navigate('/dashboard/seller');
      else navigate('/dashboard/buyer');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 50%, #f0f9ff 100%)' }}>

      {/* Decorative blobs */}
      <div style={{
        position: 'fixed', top: '-10rem', right: '-10rem', width: '30rem', height: '30rem',
        background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-8rem', left: '-8rem', width: '24rem', height: '24rem',
        background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div className="auth-card fade-in" style={{ width: '100%', maxWidth: '420px', borderRadius: '20px', padding: '2.5rem' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '14px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            marginBottom: '1rem', boxShadow: '0 8px 20px rgba(22,163,74,0.25)'
          }}>
            <span style={{ fontSize: '1.5rem' }}>🗺️</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>TERRITORY</h1>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>Land marketplace you can trust</p>
        </div>

        {/* ── Step: Login ── */}
        {step === 'login' && (
          <div className="slide-in">
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Welcome back</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>Sign in to access your account</p>
            {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Phone Number</label>
                <input id="login-phone" className="form-input" type="tel" required placeholder="10-digit phone number"
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Password</label>
                <input id="login-password" className="form-input" type="password" required placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button id="login-submit" type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Don't have an account?</p>
              <button id="go-create-account" onClick={() => { setStep('choose-role'); setError(''); }}
                style={{ marginTop: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Inter, sans-serif' }}>
                Create Account →
              </button>
            </div>
          </div>
        )}

        {/* ── Step: Choose Role ── */}
        {step === 'choose-role' && (
          <div className="slide-in">
            <button onClick={() => { setStep('login'); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ← Back to login
            </button>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>Create your account</h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>What best describes you?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div id="choose-buyer" className={`role-card${role === 'BUYER' ? ' selected' : ''}`} onClick={() => setRole('BUYER')}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏠</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Buyer</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Browse & purchase land</div>
              </div>
              <div id="choose-seller" className={`role-card${role === 'SELLER' ? ' selected' : ''}`} onClick={() => setRole('SELLER')}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>Seller</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>List & sell your land</div>
              </div>
            </div>
            <button id="continue-with-role" disabled={!role} className="btn-primary"
              onClick={() => { if (role) { setStep('register'); setError(''); } }}>
              Continue as {role ? (role === 'BUYER' ? 'Buyer' : 'Seller') : '...'}
            </button>
          </div>
        )}

        {/* ── Step: Register Form ── */}
        {step === 'register' && (
          <div className="slide-in">
            <button onClick={() => { setStep('choose-role'); setError(''); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.85rem', marginBottom: '1.25rem', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              ← Back
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{role === 'BUYER' ? '🏠' : '📋'}</span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                {role === 'BUYER' ? 'Buyer' : 'Seller'} Account
              </h2>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.5rem' }}>Fill in your details to get started</p>
            {error && <div className="error-box" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Full Name</label>
                <input id="reg-name" className="form-input" type="text" required placeholder="Your full name"
                  value={regName} onChange={e => setRegName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Phone Number</label>
                <input id="reg-phone" className="form-input" type="tel" required placeholder="10-digit phone number"
                  value={regPhone} onChange={e => setRegPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Password</label>
                <input id="reg-password" className="form-input" type="password" required placeholder="Min. 8 characters"
                  value={regPassword} onChange={e => setRegPassword(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Confirm Password</label>
                <input id="reg-confirm" className="form-input" type="password" required placeholder="Repeat password"
                  value={regConfirm} onChange={e => setRegConfirm(e.target.value)} />
              </div>
              <button id="register-submit" type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '0.5rem' }}>
                {loading ? 'Creating account…' : `Create ${role === 'BUYER' ? 'Buyer' : 'Seller'} Account`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
