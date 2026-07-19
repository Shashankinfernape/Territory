import re

with open('frontend/src/pages/auth/Login.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace imports
imports = """import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, clearToken } from '../../lib/api';
import { auth } from '../../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useLanguage } from '../../contexts/LanguageContext';
import SamsungAddressScreen from './SamsungAddressScreen';
import { AnimatePresence, motion } from 'framer-motion';
"""
text = re.sub(r'import.*?from \'../../contexts/LanguageContext\';', imports, text, flags=re.DOTALL)

# Add states
states = """
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [tempData, setTempData] = useState<any>(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();
"""
text = re.sub(r'const \[loading, setLoading].*?const \{ t \} = useLanguage\(\);', states.strip(), text, flags=re.DOTALL)

# Replace handleGoogleLogin
handle_google_login = """
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

        const { id: userId, role: userRole, address } = userRes.data;
        
        if (!address) {
          setTempData({
            id: userId,
            role: userRole,
            first_name: result.user.displayName?.split(' ')[0] || '',
            last_name: result.user.displayName?.split(' ').slice(1).join(' ') || '',
            email: result.user.email || ''
          });
          setStep(2);
          return;
        }

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

  const handleAddressSave = async (addressData: any) => {
    setSavingAddress(true);
    setError('');
    try {
      const res = await api.post('/auth/me/address', addressData);
      
      const { id: userId, role: userRole } = res.data;
      localStorage.setItem('user_role', userRole);
      localStorage.setItem('user_id', userId);
      window.dispatchEvent(new Event('storage'));

      if (userRole === 'ADMIN') navigate('/dashboard/admin');
      else navigate('/');
    } catch (err: any) {
      console.error(err);
      setError('Failed to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleAddressCancel = () => {
    // Force them out if they cancel
    clearToken();
    setStep(1);
    setTempData(null);
  };
"""
text = re.sub(r'const handleGoogleLogin = async \(\) => \{.*?\};\n', handle_google_login.strip() + '\n', text, flags=re.DOTALL)

# Wrap JSX in step check
jsx_wrapper = """
  if (step === 2) {
    return (
      <div className="bg-gray-50 min-h-screen pt-4 pb-12">
        <SamsungAddressScreen 
          initialData={tempData}
          onSave={handleAddressSave}
          onCancel={handleAddressCancel}
          isSaving={savingAddress}
        />
      </div>
    );
  }

  return (
"""
text = re.sub(r'return \(\n\s*<div className="login-page-wrapper">', jsx_wrapper.strip() + '\n    <div className="login-page-wrapper">', text)

with open('frontend/src/pages/auth/Login.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Login.tsx updated with step 2 flow')
