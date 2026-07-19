
import { useSettings } from '../../contexts/SettingsContext';

export default function SettingsVisual() {
  const { animationSetting, setAnimationSetting } = useSettings();

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: '1rem 2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2C2C2C', marginBottom: '1.5rem' }}>Visual & Performance</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: `2px solid ${animationSetting === 'minimal' ? '#2C2C2C' : '#e5e7eb'}`, background: animationSetting === 'minimal' ? '#f9fafb' : 'transparent', transition: 'all 0.2s' }}>
          <input 
            type="radio" 
            name="animationSetting" 
            value="minimal" 
            checked={animationSetting === 'minimal'} 
            onChange={() => setAnimationSetting('minimal')}
            style={{ marginTop: '0.25rem', transform: 'scale(1.2)', accentColor: '#2C2C2C' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#2C2C2C', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Minimal Animations (Recommended for performance)</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Disables the intro splash screen and advanced hover effects like glare to save battery and ensure buttery smooth performance on all devices.
            </div>
          </div>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', cursor: 'pointer', padding: '1rem', borderRadius: '12px', border: `2px solid ${animationSetting === 'dynamic' ? '#2C2C2C' : '#e5e7eb'}`, background: animationSetting === 'dynamic' ? '#f9fafb' : 'transparent', transition: 'all 0.2s' }}>
          <input 
            type="radio" 
            name="animationSetting" 
            value="dynamic" 
            checked={animationSetting === 'dynamic'} 
            onChange={() => setAnimationSetting('dynamic')}
            style={{ marginTop: '0.25rem', transform: 'scale(1.2)', accentColor: '#2C2C2C' }}
          />
          <div>
            <div style={{ fontWeight: 700, color: '#2C2C2C', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Dynamic Animations (High performance devices)</div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Enables immersive features like the intro splash screen and dynamic 3D glare effects on property cards.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
