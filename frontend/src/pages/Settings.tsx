import { useSettings } from '../contexts/SettingsContext';
import { Link } from 'react-router-dom';

export default function Settings() {
  const { animationSetting, setAnimationSetting } = useSettings();

  return (
    <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '0.875rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '2rem' }}>
        &larr; Back to Home
      </Link>
      
      <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#101010', marginBottom: '0.5rem' }}>Settings</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Manage your application preferences and performance settings.</p>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#101010', marginBottom: '1.5rem' }}>Visual & Performance</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: `2px solid ${animationSetting === 'minimal' ? '#101010' : '#e5e7eb'}`, background: animationSetting === 'minimal' ? '#f9fafb' : 'transparent', transition: 'all 0.2s' }}>
            <input 
              type="radio" 
              name="animationSetting" 
              value="minimal" 
              checked={animationSetting === 'minimal'} 
              onChange={() => setAnimationSetting('minimal')}
              style={{ marginTop: '0.25rem', transform: 'scale(1.2)' }}
            />
            <div>
              <div style={{ fontWeight: 700, color: '#101010', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Minimal Animations (Recommended for performance)</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Disables the intro splash screen and advanced hover effects like glare to save battery and ensure buttery smooth performance on all devices.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: `2px solid ${animationSetting === 'dynamic' ? '#101010' : '#e5e7eb'}`, background: animationSetting === 'dynamic' ? '#f9fafb' : 'transparent', transition: 'all 0.2s' }}>
            <input 
              type="radio" 
              name="animationSetting" 
              value="dynamic" 
              checked={animationSetting === 'dynamic'} 
              onChange={() => setAnimationSetting('dynamic')}
              style={{ marginTop: '0.25rem', transform: 'scale(1.2)' }}
            />
            <div>
              <div style={{ fontWeight: 700, color: '#101010', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Dynamic Animations (High performance devices)</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
                Enables immersive features like the intro splash screen and dynamic 3D glare effects on property cards.
              </div>
            </div>
          </label>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#101010', marginBottom: '1.5rem' }}>Data & Storage</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#101010', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Application Cache</div>
              <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5, maxWidth: '400px' }}>
                We cache essential data such as user preferences to improve load times. You can clear this data if you are experiencing issues. You will need to log back in.
              </div>
            </div>
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to clear the application cache? This will reset your preferences and log you out.")) {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/';
                }
              }}
              style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #dc2626', background: 'rgba(254, 226, 226, 0.4)', color: '#dc2626', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', outline: 'none' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(254, 226, 226, 0.8)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(254, 226, 226, 0.4)'}
            >
              Clear Cache
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
