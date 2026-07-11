import { Link } from 'react-router-dom';

export default function SellGuide() {
  return (
    <div className="fade-in" style={{ background: '#f4f4f4', minHeight: '100vh', padding: '4rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 700, color: '#101010', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Sell Your Land <span style={{ color: '#10b981' }}>Directly.</span>
          </h1>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6, letterSpacing: '-0.2px' }}>
            List your agricultural land, flat plots, or farm houses directly to buyers. No brokers, no hidden commissions.
          </p>
        </div>

        {/* Steps Grid */}
        <div style={{ display: 'grid', gap: '2rem', marginBottom: '4rem' }}>
          
          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 12px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
              1
            </div>
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.5rem' }}>Create an Account</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}>
                Sign up for a free PropIt account using your email and phone number. Your contact details will only be shared with verified buyers.
              </p>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 12px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
              2
            </div>
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.5rem' }}>Upload Property Details</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}>
                Navigate to your Seller Dashboard and click "+ List Land". Fill in the property specifications including area, location, soil type, and asking price.
              </p>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 12px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
              3
            </div>
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.5rem' }}>Secure Document Vault</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}>
                Upload high-quality images and legal documents (like Patta, Chitta, or EC). Documents are securely watermarked and hidden behind a paywall.
              </p>
            </div>
          </div>

          <div style={{ background: '#ffffff', padding: '2rem', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 12px', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800, flexShrink: 0 }}>
              4
            </div>
            <div>
              <h3 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.25rem', fontWeight: 600, color: '#101010', marginBottom: '0.5rem' }}>Connect with Buyers</h3>
              <p style={{ color: '#6b7280', fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}>
                Once verified, your listing goes live. Interested buyers will unlock your contact details, allowing them to negotiate directly with you.
              </p>
            </div>
          </div>

        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', background: '#101010', padding: '3rem 2rem', borderRadius: '16px', color: '#ffffff' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.75rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '-0.01em' }}>
            Ready to list your land?
          </h2>
          <p style={{ fontSize: '0.9375rem', color: '#a1a1aa', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
            Join hundreds of sellers bypassing brokers and getting the best value for their properties.
          </p>
          <Link to="/login" state={{ mode: 'register' }} style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: '#ffffff', color: '#101010', padding: '0.85rem 1.75rem',
            borderRadius: '99px', fontSize: '0.9375rem', fontWeight: 600,
            textDecoration: 'none', transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}>
            Create an Account to Start Selling
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
