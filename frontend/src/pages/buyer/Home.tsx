import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextType from '../../components/TextType';
import SwordSplitButtons from '../../components/ui/SwordSplitButtons';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { language, t } = useLanguage();

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: "How are the land deeds verified on Territory?",
      answer: "Every land plot submitted to Territory must undergo a strict validation process. Our administrators cross-reference the coordinates, survey maps, and boundary lines against official local and national registries before the listing becomes active."
    },
    {
      question: "What is the role of coordinates mapping?",
      answer: "Coordinates mapping provides exact latitude and longitude specifications for the plot. Buyers can inspect the physical land boundaries digitally or visit the site with absolute coordinate accuracy, preventing plot overlapping and title disputes."
    },
    {
      question: "How does the buyer-seller escrow system operate?",
      answer: "When a transaction starts, the buyer deposits the funds into a secure escrow. Once our validation team confirms that the title deed registry transfer is complete, the payout is dispatched directly to the seller's account."
    }
  ];

  return (
    <div className="home-container notranslate">
      <style>{`
        .home-container {
          min-height: 100vh;
          font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
          color: #2c2c2c;
          padding-bottom: 6rem;
        }
        .hero-section {
          min-height: calc(100vh - 120px);
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          box-sizing: border-box;
          padding: 2rem 1.5rem;
        }
        .hero-title-wrapper {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .info-grid-section {
          max-width: 1100px;
          margin: 2rem auto;
          padding: 0 1.5rem;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
          margin-top: 3rem;
        }
        .info-card {
          background: rgba(255, 255, 255, 0.45);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.6);
          border-top: 1px solid rgba(255, 255, 255, 0.8);
          border-left: 1px solid rgba(255, 255, 255, 0.7);
          padding: 2.5rem 2rem;
          border-radius: 24px;
          box-shadow: 0 20px 40px rgba(44, 44, 44, 0.03), 0 5px 15px rgba(0, 0, 0, 0.01);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .info-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.65);
          border-color: rgba(74, 93, 35, 0.2);
          box-shadow: 0 30px 60px rgba(44, 44, 44, 0.06), 0 8px 25px rgba(0, 0, 0, 0.02);
        }
        .info-num {
          font-family: 'Montserrat', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          color: #4a5d23;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(74, 93, 35, 0.08);
          border: 1px solid rgba(74, 93, 35, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }
        .info-title {
          font-family: 'Poppins', sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 0.75rem 0;
          letter-spacing: -0.01em;
        }
        .info-desc {
          font-size: 0.88rem;
          color: #6b7280;
          line-height: 1.6;
          margin: 0;
        }
        .faq-section {
          max-width: 800px;
          margin: 6rem auto 2rem;
          padding: 0 1.5rem;
        }
        .faq-item {
          background: rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          margin-bottom: 1rem;
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .faq-question-btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.25rem 1.5rem;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          font-family: 'Poppins', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: #2c2c2c;
          text-align: left;
        }
        .faq-answer {
          padding: 0 1.5rem 1.25rem;
          font-size: 0.88rem;
          color: #6b7280;
          line-height: 1.5;
        }
        .cta-banner {
          max-width: 1100px;
          margin: 6rem auto 0;
          padding: 0 1.5rem;
        }
        .cta-inner {
          background: linear-gradient(135deg, rgba(74, 93, 35, 0.08) 0%, rgba(253, 251, 247, 0.45) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(74, 93, 35, 0.15);
          border-radius: 32px;
          padding: 4rem 2rem;
          text-align: center;
          box-shadow: 0 20px 50px rgba(74, 93, 35, 0.03);
        }
        .cta-title {
          font-family: 'Poppins', sans-serif;
          font-size: 2rem;
          font-weight: 600;
          color: #2c2c2c;
          margin: 0 0 1rem 0;
          letter-spacing: -0.015em;
        }
        .cta-desc {
          font-size: 1rem;
          color: #6b7280;
          max-width: 600px;
          margin: 0 auto 2.5rem;
          line-height: 1.6;
        }
        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #4a5d23;
          color: #ffffff;
          padding: 0.9rem 2.25rem;
          border-radius: 99px;
          font-size: 0.95rem;
          font-weight: 600;
          text-decoration: none;
          box-shadow: 0 4px 15px rgba(74, 93, 35, 0.25);
          transition: all 0.2s ease;
        }
        .cta-button:hover {
          transform: translateY(-1px);
          background: #3b4d1b;
          box-shadow: 0 6px 20px rgba(74, 93, 35, 0.35);
        }
      `}</style>

      {/* HERO SECTION */}
      <div className="hero-section">
        <div className="hero-title-wrapper">
          <TextType
            key={`title-${language}`}
            as="h1"
            className="hero-title"
            text={t("Land that's truly\nyours to own.")}
            typingSpeed={40}
            pauseDuration={2000}
            showCursor={true}
            hideCursorOnComplete={true}
            cursorCharacter="|"
            loop={false}
            style={{
              marginBottom: '1rem',
              fontSize: language === 'ta' ? 'clamp(2rem, 5vw, 3.25rem)' : 'var(--hero-title-size)',
              lineHeight: language === 'ta' ? 1.3 : 1.1
            }}
          />

          <div style={{ marginTop: '3.5rem' }}>
            <TextType
              key={`subtitle-${language}`}
              as="h3"
              style={{ fontSize: '1.25rem', color: '#6b7280', marginBottom: '2.5rem', fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}
              text={t("How would you like to get started?")}
              typingSpeed={50}
              initialDelay={2000}
              showCursor={true}
              cursorCharacter="|"
              loop={false}
            />
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: '60px' }}>
              <SwordSplitButtons />
            </div>
          </div>
        </div>
      </div>

      {/* INFORMATION GRID */}
      <div className="info-grid-section">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.75rem', fontWeight: 600, color: '#2c2c2c', margin: 0, letterSpacing: '-0.015em' }}>
            {t("The Territory Standard")}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.92rem', marginTop: '0.5rem', maxWidth: '500px', margin: '0.5rem auto 0', lineHeight: 1.5 }}>
            {t("A verified database of physical land survey coordinate points and secure transition structures.")}
          </p>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <div>
              <span className="info-num">01</span>
              <h3 className="info-title">{t("Deed Registry Verification")}</h3>
              <p className="info-desc">
                {t("Every listing is cross-referenced with regional land survey maps to guarantee deed alignment and prevent overlapping claims.")}
              </p>
            </div>
          </div>

          <div className="info-card">
            <div>
              <span className="info-num">02</span>
              <h3 className="info-title">{t("Geographical Mappings")}</h3>
              <p className="info-desc">
                {t("Plot coordinates are verified on an interactive mapping grid. Inspect and confirm boundaries digitally with pinpoint precision.")}
              </p>
            </div>
          </div>

          <div className="info-card">
            <div>
              <span className="info-num">03</span>
              <h3 className="info-title">{t("Transactional Escrows")}</h3>
              <p className="info-desc">
                {t("Funds are held in a secure protocol vault. Payouts are made directly to the seller only after the deed transition receives admin confirmation.")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ SECTION */}
      <div className="faq-section">
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", fontSize: '1.6rem', fontWeight: 600, color: '#2c2c2c', margin: 0 }}>
            {t("Frequently Asked Questions")}
          </h2>
        </div>

        <div>
          {faqs.map((faq, idx) => (
            <div key={idx} className="faq-item" style={{ boxShadow: openFaq === idx ? '0 10px 25px rgba(0,0,0,0.02)' : 'none' }}>
              <button className="faq-question-btn" onClick={() => toggleFaq(idx)}>
                <span>{t(faq.question)}</span>
                <span style={{ fontSize: '1.25rem', transition: 'transform 0.2s', transform: openFaq === idx ? 'rotate(45deg)' : 'rotate(0)' }}>
                  +
                </span>
              </button>
              {openFaq === idx && (
                <div className="faq-answer">
                  {t(faq.answer)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CALL TO ACTION */}
      <div className="cta-banner">
        <div className="cta-inner">
          <h2 className="cta-title">{t("Ready to explore available plots?")}</h2>
          <p className="cta-desc">
            {t("Access our coordinate mapping grid to browse verified deeds or start listing your own property.")}
          </p>
          <Link to="/map" className="cta-button">
            {t("Launch Map Search")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}