import { useState } from 'react';

const faqs = [
  {
    q: 'How do I register as a Buyer?',
    a: 'Click "Create Account" on the login page, select "Buyer", fill in your details and submit. You\'ll be logged in automatically and taken to your dashboard.',
  },
  {
    q: 'How do I list a property for sale?',
    a: 'Register as a Seller, go to your Seller Dashboard, click "Upload Property", and fill in all the land details including area, price, type, and location.',
  },
  {
    q: 'Are the land listings verified?',
    a: 'Yes. All listings go through an admin review process. A property is only visible to buyers once an admin marks it as approved.',
  },
  {
    q: 'How do payments work?',
    a: 'When a buyer is interested in a property, they initiate a payment request through the platform. Our team facilitates a secure transaction after verifying both parties.',
  },
  {
    q: 'What types of land can be listed?',
    a: 'We support Agricultural Land, Farm Land, Flat Plots, Residential Plots, and Commercial Plots across Tamil Nadu and other regions.',
  },
  {
    q: 'How do I contact support?',
    a: 'Visit our Contact page to send a message, call us, or email us. We respond within 24 hours on business days.',
  },
];

export default function Help() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="fade-in" style={{ minHeight: '80vh', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '12px',
            background: '#2C2C2C',
            marginBottom: '1.25rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2rem', fontWeight: 600, color: '#2C2C2C', margin: '0 0 0.5rem', letterSpacing: '0.01em' }}>
            Help Center
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem', margin: 0, letterSpacing: '-0.2px' }}>
            Everything you need to know about Territory
          </p>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            {
              icon: (
                <svg width="18" height="18" fill="none" stroke="#2C2C2C" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              label: 'Getting Started',
              desc: 'Create your account'
            },
            {
              icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C2C2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
              ),
              label: 'Browse Land',
              desc: 'Find properties'
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" stroke="#2C2C2C" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1M3 5h18M3 19h18" />
                </svg>
              ),
              label: 'Payments',
              desc: 'How transactions work'
            },
            {
              icon: (
                <svg width="18" height="18" fill="none" stroke="#2C2C2C" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              label: 'Safety',
              desc: 'Verified listings'
            },
          ].map(item => (
            <div key={item.label} style={{
              background: '#ffffff', borderRadius: '12px', padding: '1.25rem', textAlign: 'center',
              boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(36, 36, 36, 0.7) 0px 1px 5px -4px, rgba(36, 36, 36, 0.05) 0px 4px 8px 0px';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#2C2C2C', fontFamily: "'Poppins', sans-serif" }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem', letterSpacing: '-0.2px' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div style={{ background: '#ffffff', borderRadius: '12px', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#2C2C2C', margin: 0, letterSpacing: '0.01em' }}>
              Frequently Asked Questions
            </h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
              <button
                id={`faq-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', padding: '1.25rem 1.75rem',
                  background: open === i ? '#FDFBF7' : 'transparent',
                  border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontFamily: 'inherit', transition: 'background 0.2s',
                }}>
                <span style={{ fontWeight: 500, fontSize: '0.9375rem', color: '#2C2C2C', paddingRight: '1rem', letterSpacing: '-0.2px' }}>{faq.q}</span>
                <span style={{
                  fontSize: '1.25rem', color: '#2C2C2C', flexShrink: 0,
                  transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s'
                }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 1.75rem 1.25rem', color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6, letterSpacing: '-0.2px' }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still need help? */}
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: '#ffffff', borderRadius: '12px', color: '#2C2C2C', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '1.0625rem', margin: '0 0 0.5rem', color: '#2C2C2C' }}>Still need help?</h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0 0 1rem', letterSpacing: '-0.2px' }}>Our support team is just a message away</p>
          <a href="/contact" className="btn-primary" style={{
            display: 'inline-flex', padding: '0.625rem 1.375rem',
            background: '#2C2C2C', color: '#ffffff', borderRadius: '9999px',
            fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none'
          }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}
