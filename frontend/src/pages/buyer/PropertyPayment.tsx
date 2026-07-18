import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';

export default function PropertyPayment() {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'GPay' | 'Paytm' | 'UPI' | 'Banking'>('UPI');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [qrLoaded, setQrLoaded] = useState(true);
  const [propDetails, setPropDetails] = useState<{ city?: string; state?: string; price?: number } | null>(null);

  const rootUrl = import.meta.env.VITE_API_URL 
    ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
    : 'http://localhost:8000';
  const qrUrl = `${rootUrl}/api/v1/payments/qr-code?t=${Date.now()}`;

  useEffect(() => {
    // Fetch basic property details for the header
    const fetchProp = async () => {
      try {
        const res = await api.get(`/properties/${propertyId}`);
        setPropDetails(res.data);
      } catch (err) {
        console.error('Error fetching property for payment page', err);
      }
    };
    if (propertyId) fetchProp();
  }, [propertyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionId.trim()) {
      setError('Please enter a valid Transaction ID.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await api.post('/payments/submit-payment', {
        property_id: propertyId,
        transaction_id: transactionId.trim(),
        payment_method: paymentMethod
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to submit payment details. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2.5rem', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#137333" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.5rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '1rem' }}>
          Payment Verification Submitted
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
          Your payment details have been successfully sent to the verification team. Once our administrators approve the transaction, the landowner contact details and land survey deeds will be unlocked on the property details page and in your dashboard.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button 
            onClick={() => navigate(`/property/${propertyId}`)}
            className="btn-primary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500 }}
          >
            Back to Property
          </button>
          <button 
            onClick={() => navigate('/dashboard/buyer')}
            className="btn-pill-dark"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500, border: '1px solid #2C2C2C', background: 'transparent', color: '#2C2C2C' }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '3rem auto', padding: '2rem 1.5rem' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', padding: '2.5rem', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid #e5e7eb' }}>
        
        {/* Header */}
        <div style={{ borderBottom: '1px solid #f3f4f6', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.35rem', fontWeight: 600, color: '#2C2C2C', margin: 0 }}>
            Refundable Unlock Fee: ₹500
          </h2>
          {propDetails && (
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>Unlocking documents and owner details for listing</span>
              <span style={{ color: '#cbd5e1' }}>|</span>
              <Link 
                to={`/property/${propertyId}`}
                style={{ 
                  color: '#4a5d23', 
                  textDecoration: 'none', 
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#36441a'}
                onMouseLeave={e => e.currentTarget.style.color = '#4a5d23'}
              >
                view prop
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </Link>
            </p>
          )}
        </div>

        {/* QR Code Container */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '1rem', fontWeight: 500 }}>
            Scan the QR Code below to pay ₹500
          </p>
          
          <div style={{ 
            background: '#ffffff', 
            padding: '1.25rem', 
            borderRadius: '12px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '180px',
            marginBottom: '0.75rem'
          }}>
            {qrLoaded ? (
              <img 
                src={qrUrl} 
                alt="Payment QR Code" 
                style={{ width: '220px', height: '220px', objectFit: 'contain' }}
                onError={() => setQrLoaded(false)}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1rem' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                  <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
                  <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="3" height="3" rx="0.5"/>
                  <rect x="18" y="13" width="3" height="3" rx="0.5"/><rect x="13" y="18" width="3" height="3" rx="0.5"/>
                  <rect x="18" y="18" width="3" height="3" rx="0.5"/>
                </svg>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                  Payment QR is being configured.<br/>Please contact support or try again shortly.
                </p>
              </div>
            )}
          </div>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Scan using GPay, PhonePe, Paytm, or any UPI App</span>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Payment Method Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '0.75rem' }}>
              Select Payment Method Used
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
              {[
                {
                  id: 'UPI',
                  label: 'UPI',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="M12 9v6M9 12h6" />
                    </svg>
                  )
                },
                {
                  id: 'GPay',
                  label: 'GPay',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  )
                },
                {
                  id: 'Paytm',
                  label: 'Paytm',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  )
                },
                {
                  id: 'Banking',
                  label: 'Net Banking',
                  icon: (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                    </svg>
                  )
                }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    padding: '0.75rem 0.25rem',
                    borderRadius: '10px',
                    border: paymentMethod === method.id ? '2px solid #2C2C2C' : '1px solid #e5e7eb',
                    background: paymentMethod === method.id ? '#fcfbf7' : '#ffffff',
                    cursor: 'pointer',
                    color: paymentMethod === method.id ? '#2C2C2C' : '#6b7280',
                    fontWeight: paymentMethod === method.id ? 600 : 500,
                    fontSize: '0.75rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {method.icon}
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction ID Input */}
          <div>
            <label htmlFor="transactionId" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#2C2C2C', marginBottom: '0.5rem' }}>
              Enter UPI Transaction ID / Ref No.
            </label>
            <input
              type="text"
              id="transactionId"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. 314567289012"
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1.5px solid #d1d5db',
                fontSize: '0.875rem',
                color: '#2C2C2C',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={e => e.target.style.borderColor = '#2C2C2C'}
              onBlur={e => e.target.style.borderColor = '#d1d5db'}
            />
          </div>

          {error && (
            <div style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8125rem' }}>
              {error}
            </div>
          )}

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary"
            style={{ 
              width: '100%', 
              padding: '0.875rem', 
              fontSize: '0.875rem', 
              borderRadius: '9999px', 
              fontWeight: 600,
              background: '#2C2C2C',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            {submitting ? 'Submitting Details...' : 'Submit Verification Details'}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', marginTop: '1.5rem', lineHeight: 1.4 }}>
          By submitting, you confirm that you have initiated a transaction of ₹500. Verification usually takes 2-4 hours.
        </p>

      </div>
    </div>
  );
}
