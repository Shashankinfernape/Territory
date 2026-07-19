import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { auth } from './lib/firebase'
import { setToken, clearToken } from './lib/api'

// Listen for token changes from Firebase Auth and sync to localStorage (only for refreshes)
auth.onIdTokenChanged(async (user) => {
  if (user) {
    try {
      // Only auto-update if they are ALREADY logged in (have a local token)
      // This prevents new users from being logged in before finishing Step 2
      const existingToken = localStorage.getItem('token');
      if (existingToken) {
        const token = await user.getIdToken();
        setToken(token);
      }
    } catch (e) {
      console.error("Error syncing Firebase token:", e);
    }
  } else {
    clearToken();
  }
});

import { SettingsProvider } from './contexts/SettingsContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AuthProvider } from './contexts/AuthContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SettingsProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </SettingsProvider>
    </AuthProvider>
  </StrictMode>,
)
