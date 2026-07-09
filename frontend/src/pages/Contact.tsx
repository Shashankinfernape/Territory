export default function Contact() {
  return (
    <div className="fade-in" style={{ minHeight: '80vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '56px', height: '56px', borderRadius: '16px',
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            marginBottom: '1.25rem', boxShadow: '0 8px 24px rgba(22,163,74,0.2)'
          }}>
            <span style={{ fontSize: '1.6rem' }}>✉️</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>Contact Us</h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>We're here to help. Reach out anytime.</p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            { icon: '📞', title: 'Phone', detail: '+91 98765 43210', sub: 'Mon–Sat, 9am–6pm' },
            { icon: '📧', title: 'Email', detail: 'support@territory.in', sub: 'We reply within 24 hours' },
            { icon: '📍', title: 'Office', detail: 'Chennai, Tamil Nadu', sub: 'India — 600 001' },
          ].map(item => (
            <div key={item.title} style={{
              background: 'white', borderRadius: '14px', padding: '1.5rem', textAlign: 'center',
              border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)'; }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{item.title}</div>
              <div style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.88rem', margin: '0.3rem 0' }}>{item.detail}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '2rem', border: '1px solid #f1f5f9', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.5rem' }}>Send a Message</h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onSubmit={e => { e.preventDefault(); alert('Message sent! We\'ll get back to you soon.'); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Full Name</label>
                <input id="contact-name" className="form-input" type="text" required placeholder="Your name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Phone / Email</label>
                <input id="contact-contact" className="form-input" type="text" required placeholder="Phone or email" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Subject</label>
              <input id="contact-subject" className="form-input" type="text" required placeholder="What's this about?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: '0.4rem' }}>Message</label>
              <textarea id="contact-message" className="form-input" required rows={4} placeholder="Describe your issue or question…"
                style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
            </div>
            <button id="contact-submit" type="submit" className="btn-primary" style={{ marginTop: '0.5rem' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
