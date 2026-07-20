interface SettingsDataProps {
  onBack?: () => void;
}

export default function SettingsData({ onBack }: SettingsDataProps) {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", padding: '1rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {onBack && (
          <button onClick={onBack} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#f0f0f0', border: '1.5px solid #2C2C2C',
            fontWeight: 'bold', fontSize: '1rem',
            cursor: 'pointer', transition: 'background-color 0.15s ease',
            flexShrink: 0, padding: 0, color: '#2C2C2C'
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e4e4e4'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          >
            &larr;
          </button>
        )}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2C2C2C', margin: 0 }}>Data & Storage</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#2C2C2C', fontSize: '1.05rem', marginBottom: '0.25rem' }}>Application Cache</div>
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
  );
}
