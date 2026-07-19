import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SettingsVisual from '../components/settings/SettingsVisual';
import SettingsData from '../components/settings/SettingsData';
import SettingsContactDetails from '../components/settings/SettingsContactDetails';
import { Monitor, Database, UserCircle, ChevronLeft } from 'lucide-react';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'visual' | 'data' | 'contact'>('visual');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowMobileMenu(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabClick = (tab: 'visual' | 'data' | 'contact') => {
    setActiveTab(tab);
    if (isMobileView) {
      setShowMobileMenu(false);
    }
  };

  return (
    <div style={{ padding: isMobileView ? '1.5rem 1rem' : '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header (Hide on mobile if viewing a specific tab) */}
      {(!isMobileView || showMobileMenu) && (
        <>
          <Link to="/" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2rem' }}>
            &larr; Back to Home
          </Link>
          
          <h1 style={{ fontSize: isMobileView ? '2rem' : '2.5rem', fontWeight: 900, color: '#2C2C2C', marginBottom: '0.5rem' }}>Settings</h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Manage your application preferences and personal information.</p>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: isMobileView ? 'column' : 'row', gap: isMobileView ? '0' : '3rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar */}
        {(!isMobileView || showMobileMenu) && (
          <div style={{ width: isMobileView ? '100%' : '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => handleTabClick('visual')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', width: '100%',
                background: activeTab === 'visual' ? '#f3f4f6' : 'transparent', border: 'none', borderRadius: '12px',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'visual' ? 700 : 500,
                color: activeTab === 'visual' ? '#111827' : '#6b7280', transition: 'all 0.2s'
              }}
            >
              <Monitor size={20} /> Visual & Performance
            </button>

            <button
              onClick={() => handleTabClick('data')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', width: '100%',
                background: activeTab === 'data' ? '#f3f4f6' : 'transparent', border: 'none', borderRadius: '12px',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'data' ? 700 : 500,
                color: activeTab === 'data' ? '#111827' : '#6b7280', transition: 'all 0.2s'
              }}
            >
              <Database size={20} /> Data & Storage
            </button>

            <button
              onClick={() => handleTabClick('contact')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', width: '100%',
                background: activeTab === 'contact' ? '#f3f4f6' : 'transparent', border: 'none', borderRadius: '12px',
                cursor: 'pointer', textAlign: 'left', fontWeight: activeTab === 'contact' ? 700 : 500,
                color: activeTab === 'contact' ? '#111827' : '#6b7280', transition: 'all 0.2s'
              }}
            >
              <UserCircle size={20} /> Contact Details
            </button>
          </div>
        )}

        {/* Content Area */}
        {(!isMobileView || !showMobileMenu) && (
          <div style={{ flex: 1, width: '100%', background: '#fff', minHeight: '500px' }}>
            {isMobileView && (
              <button 
                onClick={() => setShowMobileMenu(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000', fontWeight: 600,
                  background: 'none', border: 'none', padding: '0.5rem 0', marginBottom: '1rem', cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                <ChevronLeft size={20} /> Back to Settings
              </button>
            )}
            
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              {activeTab === 'visual' && <SettingsVisual />}
              {activeTab === 'data' && <SettingsData />}
              {activeTab === 'contact' && <SettingsContactDetails />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
