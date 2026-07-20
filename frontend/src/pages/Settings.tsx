import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SettingsVisual from '../components/settings/SettingsVisual';
import SettingsData from '../components/settings/SettingsData';
import SettingsContactDetails from '../components/settings/SettingsContactDetails';
import { Monitor, Database, UserCircle, ChevronLeft } from 'lucide-react';

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialView = searchParams.get('view') as 'visual' | 'data' | 'contact' | null;
  const fromProfile = location.state?.fromProfile;

  const [activeTab, setActiveTab] = useState<'visual' | 'data' | 'contact'>(initialView || 'contact');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showMobileMenu, setShowMobileMenu] = useState(initialView ? false : true);

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

  const handleMobileBack = () => {
    if (fromProfile) {
      navigate(-1);
    } else {
      setShowMobileMenu(true);
    }
  };

  return (
    <div style={{ padding: isMobileView ? '1.5rem 1rem' : '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header (Hide on mobile if viewing a specific tab) */}
      {(!isMobileView || showMobileMenu) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link to="/" onClick={(e) => {
              if (fromProfile) {
                e.preventDefault();
                navigate(-1);
              }
            }} style={{
              color: '#2C2C2C',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: '#f0f0f0',
              border: '1.5px solid #2C2C2C',
              fontWeight: 'bold',
              fontSize: '1rem',
              transition: 'background-color 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e4e4'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            >
              &larr;
            </Link>
            <h1 style={{ fontSize: isMobileView ? '2rem' : '2.5rem', fontWeight: 900, color: '#2C2C2C', margin: 0 }}>Settings</h1>
          </div>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Manage your application preferences and personal information.</p>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: isMobileView ? 'column' : 'row', gap: isMobileView ? '0' : '3rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar */}
        {(!isMobileView || showMobileMenu) && (
          <div style={{ width: isMobileView ? '100%' : '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
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
          </div>
        )}

        {/* Content Area */}
        {(!isMobileView || !showMobileMenu) && (
          <div style={{ flex: 1, width: '100%', background: '#fff', minHeight: '500px' }}>
            <div style={{ width: '100%', overflowX: 'hidden' }}>
              {activeTab === 'visual' && <SettingsVisual onBack={isMobileView ? handleMobileBack : undefined} />}
              {activeTab === 'data' && <SettingsData onBack={isMobileView ? handleMobileBack : undefined} />}
              {activeTab === 'contact' && <SettingsContactDetails onBack={isMobileView ? handleMobileBack : undefined} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
