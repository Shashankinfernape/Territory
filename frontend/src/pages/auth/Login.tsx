import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, clearToken } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import SamsungAddressScreen from './SamsungAddressScreen';
import { AnimatePresence, motion } from 'framer-motion';


const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [tempData, setTempData] = useState<any>(null);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    // Scrub any stale local tokens before starting a new flow!
    clearToken();
    try {
      const result = await signInWithPopup(auth, provider);
      if (result) {
        let token = await result.user.getIdToken();
        setTempToken(token);

        try {
          const userRes = await api.post('/auth/google-login', {
            uid: result.user.uid,
            email: result.user.email,
            full_name: result.user.displayName,
            photo_url: result.user.photoURL,
          });

          // User exists!
          const { id: userId, role: userRole, address } = userRes.data;
          
          if (address && Object.keys(address).length > 0) {
            // Already has address, log them in fully
            setToken(token);
            navigate('/');
            return;
          } else {
            // User exists but has no address
            setTempData({
              userId: userId,
              role: userRole,
              existingAddress: address || {},
              isNewUser: false
            });
            setStep(2);
          }
        } catch (apiErr: any) {
          if (apiErr.response && apiErr.response.status === 404) {
            // New user! Go to Step 2 to gather address before creating
            setTempData({
              isNewUser: true,
              googleData: {
                uid: result.user.uid,
                email: result.user.email,
                full_name: result.user.displayName,
                photo_url: result.user.photoURL,
              }
            });
            setStep(2);
          } else {
            throw apiErr;
          }
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(t('Failed to connect to Territory. Please try again.'));
      auth.signOut();
      clearToken();
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSave = async (addressData: any) => {
    setSavingAddress(true);
    try {
      let currentToken = tempToken;
      if (auth.currentUser) {
        currentToken = await auth.currentUser.getIdToken(true);
        setTempToken(currentToken);
      }

      if (tempData.isNewUser) {
        await api.post('/auth/google-signup', {
          ...tempData.googleData,
          address: addressData
        });
      } else {
        await api.post(`/auth/me/address`, addressData, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
      }
      setToken(currentToken as string);
      navigate('/');
    } catch (err) {
      console.error('Failed to save address:', err);
      // The SamsungAddressScreen component handles its own error display
    } finally {
      setSavingAddress(false);
    }
  };

  const handleAddressCancel = async () => {
    await auth.signOut();
    clearToken();
    setStep(1);
    setTempData(null);
    setTempToken(null);
  };

  return (
    <div className="login-page-wrapper" style={{
      minHeight: '100vh',
      width: '100vw',
      background: 'url(/auth-bg.jpg) no-repeat center center fixed',
      backgroundSize: 'cover',
      display: 'flex',
      alignItems: step === 1 ? 'flex-start' : 'center',
      justifyContent: 'center',
      padding: '2rem',
      paddingTop: step === 1 ? '6rem' : '2rem',
      position: 'relative'
    }}>
      {/* Background Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(232, 239, 230, 0.45) 0%, rgba(255, 255, 255, 0.55) 100%)',
        backdropFilter: 'blur(3px)',
        zIndex: 1
      }}></div>

      <style>{`
        .login-page-wrapper * {
          z-index: 2;
        }
        .login-glass-card {
          display: flex;
          width: 100%;
          max-width: ${step === 2 ? '1250px' : '820px'};
          min-height: auto;
          transition: max-width 0.4s ease;
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
          flex: ${step === 2 ? '0.6' : '1.1'};
          padding: ${step === 2 ? '2rem 2rem' : '3.5rem 2rem'};
          background: rgba(253, 251, 247, 0.25);
          border-right: 1px solid rgba(44, 44, 44, 0.06);
          display: ${step === 2 ? 'flex' : 'flex'};
          flex-direction: column;
          justify-content: space-between;
        }
        .login-card-right {
          flex: ${step === 2 ? '0.8' : '0.9'};
          padding: ${step === 2 ? '2rem 2.5rem' : '3.5rem 3rem'};
          display: flex;
          flex-direction: column;
          justify-content: ${step === 2 ? 'center' : 'flex-start'};
          background: rgba(255, 255, 255, 0.15);
        }
        .stepper-container {
          display: flex;
          justify-content: center;
          margin-bottom: ${step === 2 ? '3rem' : '1.5rem'};
          gap: 12px;
          align-items: center;
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
          .login-page-wrapper {
            padding: 1rem;
            align-items: center;
          }
          .login-glass-card {
            flex-direction: column;
            border-radius: 20px;
            min-height: auto !important;
            max-width: ${step === 2 ? '600px' : '420px'} !important;
            width: 100%;
          }
          .login-card-left {
            display: none;
          }
          .login-card-right {
            padding: 1.5rem 1.5rem !important;
            max-height: none !important;
            overflow-y: visible !important;
            justify-content: flex-start !important;
          }
          .stepper-container {
            margin-bottom: 1.5rem !important;
          }
          .login-title {
            font-size: 1.7rem;
          }
          .login-subtitle {
            font-size: 0.8rem;
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
          {/* Elite Black & White Stepper UI */}
          <div className="stepper-container">
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              border: '1px solid #1a1a1a',
              background: step === 1 ? '#1a1a1a' : 'transparent', 
              color: step === 1 ? '#fff' : '#1a1a1a', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 500, fontSize: '15px', transition: 'all 0.3s ease' 
            }}>1</div>
            
            <div style={{ width: '48px', height: '1px', background: '#1a1a1a', transition: 'all 0.3s ease' }}></div>
            
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              border: '1px solid #1a1a1a',
              background: step === 2 ? '#1a1a1a' : 'transparent', 
              color: step === 2 ? '#fff' : '#1a1a1a', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 500, fontSize: '15px', transition: 'all 0.3s ease' 
            }}>2</div>
          </div>

          <AnimatePresence mode="wait">
            {step === 2 ? (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <SamsungAddressScreen 
                  initialData={tempData}
                  onSave={handleAddressSave}
                  onCancel={handleAddressCancel}
                  isSaving={savingAddress}
                />
              </motion.div>
            ) : (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-start' }}
              >
                <div>
                  <h3 className="login-title">{t("Sign in")}</h3>
                  <p className="login-subtitle">{t("Connect with Google to list or buy lands.")}</p>
                </div>

                {error && (
                  <div className="error-message" style={{
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
                  <p className="login-terms" style={{ fontSize: '0.72rem', color: '#898989', margin: 0, lineHeight: 1.5 }}>
                    {t("By signing in, you agree to Territory's")} <br />
                    <a href="#" style={{ color: '#4a5d23', textDecoration: 'none', fontWeight: 600 }}>{t("Terms of Service")}</a> {t("and")} <a href="#" style={{ color: '#4a5d23', textDecoration: 'none', fontWeight: 600 }}>{t("Privacy Policy")}</a>.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
