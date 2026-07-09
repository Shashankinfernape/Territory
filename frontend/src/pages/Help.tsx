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
    <div className="fade-in" style={{ minHeight: '80vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '700px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(22,163,74,0.2)'
          }}>
            <span style={{ fontSize: '1.6rem' }}>💡</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Help Center</h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>Everything you need to know about TERRITORY</p>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '🚀', label: 'Getting Started', desc: 'Create your account' },
            { icon: '🔍', label: 'Browse Land', desc: 'Find properties' },
            { icon: '💰', label: 'Payments', desc: 'How transactions work' },
            { icon: '🛡️', label: 'Safety', desc: 'Verified listings' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'white', borderRadius: '14px', padding: '1.25rem', textAlign: 'center',
              border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.04)', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#16a34a'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>{item.label}</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem 1.75rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Frequently Asked Questions</h2>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} style={{ borderBottom: i < faqs.length - 1 ? '1px solid #f8fafc' : 'none' }}>
              <button
                id={`faq-${i}`}
                onClick={() => setOpen(open === i ? null : i)}
                style={{
                  width: '100%', textAlign: 'left', padding: '1.25rem 1.75rem',
                  background: open === i ? '#f0fdf4' : 'transparent',
                  border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', fontFamily: 'Inter, sans-serif', transition: 'background 0.2s',
                }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', paddingRight: '1rem' }}>{faq.q}</span>
                <span style={{
                  fontSize: '1.1rem', color: '#16a34a', flexShrink: 0,
                  transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s'
                }}>+</span>
              </button>
              {open === i && (
                <div style={{ padding: '0 1.75rem 1.25rem', color: '#475569', fontSize: '0.875rem', lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Still need help? */}
        <div style={{ marginTop: '2rem', textAlign: 'center', padding: '2rem', background: 'linear-gradient(135deg, #16a34a, #15803d)', borderRadius: '16px', color: 'white' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🤔</div>
          <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: '0 0 0.5rem' }}>Still need help?</h3>
          <p style={{ fontSize: '0.85rem', opacity: 0.85, margin: '0 0 1rem' }}>Our support team is just a message away</p>
          <a href="/contact" style={{
            display: 'inline-block', padding: '0.6rem 1.5rem',
            background: 'white', color: '#16a34a', borderRadius: '8px',
            fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none',
            transition: 'transform 0.2s',
          }}>Contact Support</a>
        </div>
      </div>
    </div>
  );
}
