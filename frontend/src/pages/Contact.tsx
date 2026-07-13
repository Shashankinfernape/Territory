export default function Contact() {
  return (
    <div className="fade-in" style={{ minHeight: '80vh', padding: '4rem 1rem' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '52px', height: '52px', borderRadius: '12px',
            background: '#101010',
            marginBottom: '1.25rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px'
          }}>
            <svg width="22" height="22" fill="none" stroke="#ffffff" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '2rem', fontWeight: 600, color: '#101010', margin: '0 0 0.5rem', letterSpacing: '0.01em' }}>
            Contact Us
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9375rem', margin: 0, letterSpacing: '-0.2px' }}>
            We're here to help. Reach out anytime.
          </p>
        </div>

        {/* Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
          {[
            {
              icon: (
                <svg width="22" height="22" fill="none" stroke="#101010" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                </svg>
              ),
              title: 'Phone',
              detail: '+91 98765 43210',
              sub: 'Mon–Sat, 9am–6pm'
            },
            {
              icon: (
                <svg width="22" height="22" fill="none" stroke="#101010" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              ),
              title: 'Email',
              detail: 'support@territory.in',
              sub: 'We reply within 24 hours'
            },
            {
              icon: (
                <svg width="22" height="22" fill="none" stroke="#101010" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              ),
              title: 'Office',
              detail: 'Chennai, Tamil Nadu',
              sub: 'India — 600 001'
            },
          ].map(item => (
            <div key={item.title} style={{
              background: '#ffffff', borderRadius: '12px', padding: '1.5rem', textAlign: 'center',
              boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(36, 36, 36, 0.7) 0px 1px 5px -4px, rgba(36, 36, 36, 0.05) 0px 4px 8px 0px';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px';
              }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 600, color: '#101010', fontSize: '0.9375rem', fontFamily: "'Poppins', sans-serif" }}>{item.title}</div>
              <div style={{ color: '#0099ff', fontWeight: 500, fontSize: '0.875rem', margin: '0.3rem 0', letterSpacing: '-0.2px' }}>{item.detail}</div>
              <div style={{ color: '#6b7280', fontSize: '0.8125rem', letterSpacing: '-0.2px' }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div style={{ background: '#ffffff', borderRadius: '12px', padding: '2rem', boxShadow: 'rgba(36, 36, 36, 0.05) 0px 4px 8px 0px' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.125rem', fontWeight: 600, color: '#101010', marginBottom: '1.5rem', letterSpacing: '0.01em' }}>
            Send a Message
          </h2>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
            onSubmit={e => { e.preventDefault(); alert('Message sent! We\'ll get back to you soon.'); }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#242424', marginBottom: '0.4rem', letterSpacing: '-0.2px' }}>Full Name</label>
                <input id="contact-name" className="form-input" type="text" required placeholder="Your name" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#242424', marginBottom: '0.4rem', letterSpacing: '-0.2px' }}>Phone / Email</label>
                <input id="contact-contact" className="form-input" type="text" required placeholder="Phone or email" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#242424', marginBottom: '0.4rem', letterSpacing: '-0.2px' }}>Subject</label>
              <input id="contact-subject" className="form-input" type="text" required placeholder="What's this about?" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: '#242424', marginBottom: '0.4rem', letterSpacing: '-0.2px' }}>Message</label>
              <textarea id="contact-message" className="form-input" required rows={4} placeholder="Describe your issue or question…"
                style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button id="contact-submit" type="submit" className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Send Message
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
