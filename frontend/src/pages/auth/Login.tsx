import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export default function Login() {
  const [loading, setLoading] = useState(false); // No initial loading
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // We must use Popup because Redirect gets blocked by modern browser security on localhost
      const result = await signInWithPopup(auth, provider);
      if (result) {
        const token = await result.user.getIdToken();
        setToken(token);

        // Auto-register or login — backend handles both
        const userRes = await api.post('/auth/google-login', {
          uid: result.user.uid,
          email: result.user.email,
          full_name: result.user.displayName,
          photo_url: result.user.photoURL,
        });

        const { id: userId, role: userRole } = userRes.data;
        localStorage.setItem('user_role', userRole);
        localStorage.setItem('user_id', userId);
        window.dispatchEvent(new Event('storage'));

        if (userRole === 'ADMIN') navigate('/dashboard/admin');
        else navigate('/');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.response?.data?.detail || err.message || 'Sign in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-split" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', minHeight: '100vh', background: 'transparent', paddingTop: '15vh' }}>
      <div className="fade-in" style={{
        width: '100%',
        maxWidth: '420px',
        background: '#212121', // ChatGPT's signature lighter black / dark grey
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderTop: '1px solid rgba(255, 255, 255, 0.2)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '32px',
        padding: '50px 40px',
        boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.25), 0 10px 30px -5px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '0 2rem'
      }}>

        <h2 style={{ fontFamily: "'Inter', sans-serif", fontSize: '32px', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem', textAlign: 'center', letterSpacing: '-0.04em' }}>
          Welcome back
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: '#94a3b8', marginBottom: '3.5rem', textAlign: 'center', fontWeight: 500, letterSpacing: '-0.01em' }}>
          Sign in to browse and list verified land
        </p>

        {error && (
          <div style={{ width: '100%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#fca5a5', borderRadius: '16px', padding: '1rem', fontSize: '13px', marginBottom: '2rem', textAlign: 'center', fontWeight: 500, backdropFilter: 'blur(8px)' }}>
            {error}
          </div>
        )}

        {/* Ultra Premium Google Sign-In Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: 'fit-content',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            background: 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
            color: '#0f172a',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderTop: '1px solid rgba(255, 255, 255, 1)',
            borderRadius: '100px',
            padding: '0 36px',
            height: '52px',
            fontSize: '15px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.8 : 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            letterSpacing: '0.2px',
            transform: 'translateY(0)',
          }}
          onMouseEnter={e => { 
            if (!loading) {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 12px 24px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.1)';
            }
          }}
          onMouseLeave={e => { 
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.15), 0 1px 2px rgba(0,0,0,0.05)';
          }}
        >
          {/* Official Google G logo SVG */}
          <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
