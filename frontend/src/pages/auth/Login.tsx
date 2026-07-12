import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, setToken } from '../../lib/api';
import { auth } from '../../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

type Step = 'login' | 'register' | 'forgot-password';

export default function Login() {
  const location = useLocation();
  const initialStep = (location.state as any)?.mode === 'register' ? 'register' : 'login';
  const [step, setStep] = useState<Step>(initialStep);

  useEffect(() => {
    const mode = (location.state as any)?.mode;
    if (mode === 'register') {
      setStep('register');
    } else {
      setStep('login');
    }
  }, [location.state]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'USER' | 'SELLER'>('USER');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      setToken(token);
      const userRes = await api.get('/auth/me');
      const { role: userRole, phone_number } = userRes.data;
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_phone', phone_number);
      window.dispatchEvent(new Event('storage'));
      if (userRole === 'ADMIN') navigate('/dashboard/admin');
      else if (userRole === 'SELLER') navigate('/dashboard/seller');
      else navigate('/dashboard/buyer');
    } catch (err: any) {
      console.error(err);
      localStorage.removeItem('token');
      // Sign them out of Firebase just in case to be fully secure
      await auth.signOut();
      
      let errorMsg = 'Incorrect credentials. Please ensure your account registration is complete.';
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else {
          errorMsg = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMsg);
    } finally { setLoading(false); }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (regPassword !== regConfirm) { setError('Passwords do not match.'); return; }
    if (regPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (!/^\d{10}$/.test(regPhone)) { setError('Phone number must be exactly 10 digits.'); return; }
    if (regRole === 'SELLER' && (!aadhaar || !pan)) { setError('Aadhaar and PAN numbers are required for Seller registration.'); return; }
    setLoading(true); setError(''); setSuccessMsg('');
    let firebaseUser: any = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
      firebaseUser = userCredential.user;
      const token = await firebaseUser.getIdToken();
      setToken(token);
      
      const payload: any = { 
        uid: firebaseUser.uid, 
        email: regEmail, 
        phone_number: regPhone, 
        role: regRole, 
        full_name: regName 
      };
      
      if (regRole === 'SELLER') {
        payload.kyc_details = { aadhaar_number: aadhaar, pan_number: pan };
      }
      
      await api.post('/auth/register', payload);

      if (regRole === 'SELLER') {
        // Log them out and show pending message
        await auth.signOut();
        localStorage.removeItem('token');
        setStep('login');
        setSuccessMsg('Your seller account request has been submitted. The admin will review your KYC documents. You will be able to log in once approved.');
      } else {
        localStorage.setItem('user_role', 'USER');
        localStorage.setItem('user_phone', regPhone);
        window.dispatchEvent(new Event('storage'));
        navigate('/dashboard/buyer');
      }
    } catch (err: any) {
      console.error(err);
      if (firebaseUser) { try { await firebaseUser.delete(); } catch {} }
      localStorage.removeItem('token');
      
      let errorMsg = 'Registration failed.';
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          errorMsg = detail.map((d: any) => `${d.loc[d.loc.length - 1]}: ${d.msg}`).join(', ');
        } else if (typeof detail === 'string') {
          errorMsg = detail;
        } else {
          errorMsg = JSON.stringify(detail);
        }
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccessMsg('');
    try {
      await sendPasswordResetEmail(auth, forgotEmail);
      setResetSent(true);
      setSuccessMsg('Reset link sent. Please check your email.');
    } catch (err: any) {
      console.error(err);
      setError('Failed to send reset link.');
    } finally { setLoading(false); }
  };

  const label = (text: string) => (
    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#242424', marginBottom: '0.4rem', letterSpacing: '-0.2px' }}>
      {text}
    </label>
  );

  return (
    <div className="login-split">
      <div className="fade-in" style={{
        width: '100%', maxWidth: step === 'register' ? '500px' : '400px',
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '2.25rem',
        boxShadow: 'rgba(36,36,36,0.05) 0px 4px 8px 0px',
        transition: 'max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>

        {/* Brand mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '6px', background: '#101010', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
            </svg>
          </div>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.9375rem', fontWeight: 600, color: '#101010', letterSpacing: '0.01em' }}>TERRITORY</span>
        </div>

        {error && <div className="error-box" style={{ marginBottom: '1.25rem' }}>{error}</div>}
        {successMsg && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            {successMsg}
          </div>
        )}

        {/* ── Login ── */}
        {step === 'login' && (
          <div className="slide-in">
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.3rem', letterSpacing: '0.01em' }}>Welcome back</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', letterSpacing: '-0.2px' }}>Sign in to your account to continue.</p>

            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                {label('Email address')}
                <input id="login-email" className="form-input" type="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#242424', letterSpacing: '-0.2px' }}>Password</span>
                  <button type="button" onClick={() => setStep('forgot-password')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0099ff', fontWeight: 500, fontSize: '0.8125rem', fontFamily: 'inherit' }}>
                    Forgot?
                  </button>
                </div>
                <input id="login-password" className="form-input" type="password" required placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <button id="login-submit" type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', marginTop: '0.25rem' }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb', textAlign: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>New to Territory? </span>
              <button id="go-create-account" onClick={() => setStep('register')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0099ff', fontWeight: 500, fontSize: '0.875rem', fontFamily: 'inherit' }}>
                Create account
              </button>
            </div>
          </div>
        )}

        {/* ── Register ── */}
        {step === 'register' && (
          <div className="slide-in">
            <button onClick={() => setStep('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8125rem', fontWeight: 400, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit' }}>
              ← Back to sign in
            </button>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.3rem', letterSpacing: '0.01em' }}>Create account</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', letterSpacing: '-0.2px' }}>Purchase and list verified land directly.</p>

            <form onSubmit={handleRegister} className="register-grid">
              <div className="grid-col-span-2">
                {label('Account Type')}
                <select className="form-input" value={regRole} onChange={e => setRegRole(e.target.value as any)}>
                  <option value="USER">Buyer Account</option>
                  <option value="SELLER">Seller Account</option>
                </select>
              </div>
              <div className="grid-col-span-2">{label('Email address')}<input id="reg-email" className="form-input" type="email" required placeholder="you@example.com" value={regEmail} onChange={e => setRegEmail(e.target.value)} /></div>
              <div>{label('Full name')}<input id="reg-name" className="form-input" type="text" required placeholder="Your name" value={regName} onChange={e => setRegName(e.target.value)} /></div>
              <div>{label('Phone number')}<input id="reg-phone" className="form-input" type="tel" required placeholder="10-digit number" value={regPhone} onChange={e => setRegPhone(e.target.value)} /></div>
              <div>{label('Password')}<input id="reg-password" className="form-input" type="password" required placeholder="Min 6 characters" value={regPassword} onChange={e => setRegPassword(e.target.value)} /></div>
              <div>{label('Confirm password')}<input id="reg-confirm" className="form-input" type="password" required placeholder="Repeat password" value={regConfirm} onChange={e => setRegConfirm(e.target.value)} /></div>
              
              {regRole === 'SELLER' && (
                <>
                  <div className="grid-col-span-2" style={{ marginTop: '0.5rem', marginBottom: '0.2rem' }}>
                    <div style={{ padding: '0.75rem', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>
                      <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0, fontWeight: 500 }}>
                        <strong style={{ color: '#0f172a' }}>Verification Required:</strong> To maintain a secure marketplace, seller accounts must be verified by an admin.
                      </p>
                    </div>
                  </div>
                  <div>{label('Aadhaar Number')}<input className="form-input" type="text" required={regRole === 'SELLER'} placeholder="12-digit number" value={aadhaar} onChange={e => setAadhaar(e.target.value)} /></div>
                  <div>{label('PAN Number')}<input className="form-input" type="text" required={regRole === 'SELLER'} placeholder="10-character PAN" value={pan} onChange={e => setPan(e.target.value)} /></div>
                </>
              )}

              <button id="register-submit" type="submit" disabled={loading} className="btn-primary grid-col-span-2" style={{ width: '100%', marginTop: '0.5rem' }}>
                {loading ? 'Submitting…' : (regRole === 'SELLER' ? 'Submit for Verification' : 'Create account')}
              </button>
            </form>
          </div>
        )}

        {/* ── Forgot Password ── */}
        {step === 'forgot-password' && (
          <div className="slide-in">
            <button onClick={() => { setStep('login'); setResetSent(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '0.8125rem', fontWeight: 400, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem', fontFamily: 'inherit' }}>
              ← Back to sign in
            </button>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.3rem', letterSpacing: '0.01em' }}>Reset password</h2>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1.5rem', letterSpacing: '-0.2px' }}>We'll send a reset link to your email.</p>

            {!resetSent && (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>{label('Email address')}<input className="form-input" type="email" required placeholder="you@example.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} /></div>
                <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%' }}>
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
