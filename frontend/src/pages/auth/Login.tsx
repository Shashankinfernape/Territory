import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';

const provider = new GoogleAuthProvider();

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, provider);
      if (result) {
        const token = await result.user.getIdToken();
        setToken(token);

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
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 100px);
          padding: 2.5rem 1.5rem;
          background: transparent;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        }
        .login-glass-card {
          display: flex;
          width: 100%;
          max-width: 820px;
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-top: 1px solid rgba(255, 255, 255, 0.7);
          border-left: 1px solid rgba(255, 255, 255, 0.6);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(44, 44, 44, 0.05), 0 10px 30px rgba(0, 0, 0, 0.015);
        }
        .login-card-left {
          flex: 1.1;
          padding: 3.5rem 3rem;
          background: rgba(253, 251, 247, 0.25);
          border-right: 1px solid rgba(44, 44, 44, 0.06);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .login-card-right {
          flex: 0.9;
          padding: 3.5rem 3rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
        }
        .serial-num {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          color: #4a5d23;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(74, 93, 35, 0.08);
          border: 1px solid rgba(74, 93, 35, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .feature-row {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
          margin-bottom: 2rem;
        }
        .feature-row:last-child {
          margin-bottom: 0;
        }
        .feature-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #2c2c2c;
          margin: 0 0 0.25rem 0;
        }
        .feature-desc {
          font-size: 0.82rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .login-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.75rem;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.015em;
        }
        .login-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0 0 2rem 0;
          line-height: 1.45;
        }
        @media (max-width: 768px) {
          .login-glass-card {
            flex-direction: column;
            border-radius: 20px;
          }
          .login-card-left {
            display: none;
          }
          .login-card-right {
            padding: 3rem 2rem;
          }
        }
      `}</style>

      <div className="login-glass-card">
        {/* LEFT COLUMN - INFORMATIONAL */}
        <div className="login-card-left">
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.45rem', fontWeight: 600, color: '#2c2c2c', margin: '0 0 0.5rem 0', letterSpacing: '-0.01em' }}>
              {t("Deed Registry Protocol")}
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#6b7280', margin: '0 0 2.5rem 0', lineHeight: 1.5 }}>
              {t("A transparent verified platform for listings, search, and land registry.")}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="feature-row">
                <span className="serial-num">01</span>
                <div>
                  <h4 className="feature-title">{t("Verified Registry")}</h4>
                  <p className="feature-desc">{t("All platform uploads are cross-referenced with government land survey coordinates.")}</p>
                </div>
              </div>

              <div className="feature-row">
                <span className="serial-num">02</span>
                <div>
                  <h4 className="feature-title">{t("Geographical Mappings")}</h4>
                  <p className="feature-desc">{t("Search and view coordinates, plot areas, and document deeds directly on the map grid.")}</p>
                </div>
              </div>

              <div className="feature-row">
                <span className="serial-num">03</span>
                <div>
                  <h4 className="feature-title">{t("Transactional Escrows")}</h4>
                  <p className="feature-desc">{t("Deed transition checks ensure absolute protection for both buyer and seller interests.")}</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <p style={{ fontSize: '0.72rem', color: '#898989', margin: 0, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              {t("Territory Land Market")}
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN - AUTHENTICATION FORM */}
        <div className="login-card-right">
          <div>
            <h3 className="login-title">{t("Sign in")}</h3>
            <p className="login-subtitle">{t("Connect with Google to list or buy lands.")}</p>
          </div>

          {error && (
            <div style={{
              width: '100%',
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              marginBottom: '1.5rem',
              textAlign: 'center',
              fontWeight: 500,
              boxSizing: 'border-box'
            }}>
              {error}
            </div>
          )}

          {/* Premium Google Sign-In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              background: '#2c2c2c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.8rem 1.5rem',
              height: '48px',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.8 : 1,
              transition: 'all 0.15s ease',
              outline: 'none',
              boxSizing: 'border-box',
              boxShadow: '0 4px 12px rgba(44, 44, 44, 0.15)'
            }}
            onMouseEnter={e => {
              if (!loading) {
                e.currentTarget.style.background = '#1a1a1a';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(44, 44, 44, 0.2)';
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#2c2c2c';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(44, 44, 44, 0.15)';
            }}
          >
            {/* Google G logo SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {loading ? t("Connecting...") : t("Continue with Google")}
          </button>



          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', color: '#898989', margin: 0, lineHeight: 1.5 }}>
              {t("By signing in, you agree to Territory's")} <br />
              <a href="#" style={{ color: '#4a5d23', textDecoration: 'none', fontWeight: 600 }}>{t("Terms of Service")}</a> {t("and")} <a href="#" style={{ color: '#4a5d23', textDecoration: 'none', fontWeight: 600 }}>{t("Privacy Policy")}</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
