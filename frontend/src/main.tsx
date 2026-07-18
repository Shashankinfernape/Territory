import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { auth } from './lib/firebase'
import { setToken, clearToken } from './lib/api'

// Listen for token changes from Firebase Auth and sync to localStorage
auth.onIdTokenChanged(async (user) => {
  if (user) {
    try {
      const token = await user.getIdToken();
      setToken(token);
    } catch (e) {
      console.error("Error syncing Firebase token:", e);
    }
  } else {
    clearToken();
  }
});

import { SettingsProvider } from './contexts/SettingsContext'
import { LanguageProvider } from './contexts/LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </SettingsProvider>
  </StrictMode>,
)
