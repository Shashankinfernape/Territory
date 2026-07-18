import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ta';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Hand-curated translations dictionary ensuring premium copywriting and English brand integrity
const translations: Record<string, string> = {
  // Navbar & Dropdown
  "Home": "முகப்பு",
  "Buy Land": "நிலம் வாங்க",
  "Sell Land": "நிலம் விற்க",
  "Buy": "வாங்க",
  "Sell": "விற்க",
  "Help": "உதவி",
  "Contact": "தொடர்பு",
  "Map View": "வரைபடம்",
  "Dashboard": "டாஷ்போர்டு",
  "Wishlist": "விருப்பப்பட்டியல்",
  "Help Center": "உதவி மையம்",
  "Contact Support": "தொடர்பு கொள்ளவும்",
  "Logout": "வெளியேறு",
  "Sign in": "உள்நுழைக",
  "Get started": "தொடங்குங்கள்",
  "Settings": "அமைப்புகள்",
  "Browse Listings": "பட்டியல்களை உலாவு",
  "My Dashboard": "எனது டாஷ்போர்டு",

  // Home Page
  "Land that's truly\nyours to own.": "உங்களது சொந்த நிலத்தை\nநம்பிக்கையுடன் வாங்குங்கள்",
  "How would you like to get started?": "நீங்கள் எவ்வாறு தொடங்க விரும்புகிறீர்கள்?",
  "The Territory Standard": "Territory தரம்",
  "A verified database of physical land survey coordinate points and secure transition structures.": "உடல் நில அளவை ஒருங்கிணைப்பு புள்ளிகள் மற்றும் பாதுகாப்பான மாற்ற கட்டமைப்புகளின் சரிபார்க்கப்பட்ட தரவுத்தளம்.",
  "Deed Registry Verification": "பத்திரப் பதிவு சரிபார்ப்பு",
  "Every listing is cross-referenced with regional land survey maps to guarantee deed alignment and prevent overlapping claims.": "பத்திர சீரமைப்பை உறுதி செய்வதற்கும், ஒன்றுடன் ஒன்று உரிமைகோரல்களைத் தடுப்பதற்கும் ஒவ்வொரு பட்டியலும் பிராந்திய நில அளவை வரைபடங்களுடன் குறுக்கு-குறிப்பிடப்படுகிறது.",
  "Geographical Mappings": "புவியியல் வரைபடங்கள்",
  "Plot coordinates are verified on an interactive mapping grid. Inspect and confirm boundaries digitally with pinpoint precision.": "ஒருங்கிணைப்பு வரைபடங்கள் ஊடாடும் வரைபட கட்டத்தில் சரிபார்க்கப்படுகின்றன. எல்லைகளை டிஜிட்டல் முறையில் துல்லியமாக ஆய்வு செய்து உறுதிப்படுத்தவும்.",
  "Transactional Escrows": "பரிவர்த்தனை எஸ்க்ரோக்கள்",
  "Funds are held in a secure protocol vault. Payouts are made directly to the seller only after the deed transition receives admin confirmation.": "பாதுகாப்பான நெறிமுறை பெட்டகத்தில் நிதிகள் வைக்கப்படுகின்றன. பத்திர மாற்றம் நிர்வாகி உறுதிப்படுத்தலைப் பெற்ற பின்னரே விற்பனையாளருக்கு நேரடியாக பணம் செலுத்தப்படும்.",
  "Frequently Asked Questions": "அடிக்கடி கேட்கப்படும் கேள்விகள்",
  "How are the land deeds verified on Territory?": "Territory-யில் நிலப் பத்திரங்கள் எவ்வாறு சரிபார்க்கப்படுகின்றன?",
  "Every land plot submitted to Territory must undergo a strict validation process. Our administrators cross-reference the coordinates, survey maps, and boundary lines against official local and national registries before the listing becomes active.": "Territory-யில் சமர்ப்பிக்கப்படும் ஒவ்வொரு நிலமும் கடுமையான சரிபார்ப்பு செயல்முறைக்கு உட்படுத்தப்பட வேண்டும். பட்டியல் செயலில் வருவதற்கு முன்பு எங்கள் நிர்வாகிகள் ஒருங்கிணைப்புகள், அளவை வரைபடங்கள் மற்றும் எல்லைக் கோடுகளை அதிகாரப்பூர்வ உள்ளூர் மற்றும் தேசிய பதிவேடுகளுடன் குறுக்கு-சரிபார்க்கிறார்கள்.",
  "What is the role of coordinates mapping?": "ஒருங்கிணைப்பு வரைபடத்தின் பங்கு என்ன?",
  "Coordinates mapping provides exact latitude and longitude specifications for the plot. Buyers can inspect the physical land boundaries digitally or visit the site with absolute coordinate accuracy, preventing plot overlapping and title disputes.": "ஒருங்கிணைப்பு வரைபடம் நிலத்திற்கான சரியான அட்சரேகை மற்றும் தீர்க்கரேகை விவரக்குறிப்புகளை வழங்குகிறது. வாங்குபவர்கள் நில எல்லைகளை டிஜிட்டல் முறையில் ஆய்வு செய்யலாம் அல்லது முழுமையான துல்லியத்துடன் தளத்தைப் பார்வையிடலாம், இதனால் நிலம் ஒன்றுடன் ஒன்று சேருவது மற்றும் உரிமை சர்ச்சைகளைத் தடுக்கலாம்.",
  "How does the buyer-seller escrow system operate?": "வாங்குபவர்-விருப்பாளர் எஸ்க்ரோ முறை எவ்வாறு செயல்படுகிறது?",
  "When a transaction starts, the buyer deposits the funds into a secure escrow. Once our validation team confirms that the title deed registry transfer is complete, the payout is dispatched directly to the seller's account.": "ஒரு பரிவர்த்தனை தொடங்கும் போது, வாங்குபவர் பாதுகாப்பான எஸ்க்ரோவில் நிதியை டெபாசிட் செய்கிறார். எங்கள் சரிபார்ப்புக் குழு பத்திரப் பதிவு பரிமாற்றம் முடிந்ததை உறுதிசெய்ததும், பணம் நேரடியாக விற்பனையாளரின் கணக்கிற்கு அனுப்பப்படும்.",
  "Ready to explore available plots?": "கிடைக்கக்கூடிய நிலங்களை ஆராயத் தயாரா?",
  "Access our coordinate mapping grid to browse verified deeds or start listing your own property.": "சரிபார்க்கப்பட்ட பத்திரங்களை உலாவ அல்லது உங்கள் சொந்த சொத்தை பட்டியலிட எங்கள் ஒருங்கிணைப்பு வரைபடக் கட்டத்தை அணுகவும்.",
  "Launch Map Search": "வரைபடத் தேடலைத் தொடங்கு"
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  // Inject CSS to hide Google Translate banner, toolbar, and tooltip popups
  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'google-translate-custom-styles';
    style.innerHTML = `
      /* Hide Google Translate toolbar, banners and frame popups */
      .skiptranslate, .goog-te-banner-frame, iframe.skiptranslate, .goog-tooltip, .goog-tooltip:hover {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
      }
      body {
        top: 0px !important;
      }
      /* Prevent hover tooltip showing English original on translated nodes */
      font[style*="background-color"] {
        background-color: transparent !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);

    // Create a hidden translation target element
    if (!document.getElementById('google_translate_element')) {
      const gEl = document.createElement('div');
      gEl.id = 'google_translate_element';
      gEl.style.display = 'none';
      document.body.appendChild(gEl);
    }

    return () => {
      const existingStyle = document.getElementById('google-translate-custom-styles');
      if (existingStyle) document.head.removeChild(existingStyle);
    };
  }, []);

  // Helper to programmatically dispatch language selections to Google Translate widget
  const triggerGoogleTranslate = (lang: Language) => {
    try {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (select) {
        select.value = lang === 'ta' ? 'ta' : '';
        select.dispatchEvent(new Event('change'));
      } else {
        // If select is not fully rendered yet, wait and retry
        setTimeout(() => triggerGoogleTranslate(lang), 100);
      }
    } catch (err) {
      console.error("Error triggering Google Translate:", err);
    }
  };

  // Always load Google Translate script on mount
  useEffect(() => {
    const saved = localStorage.getItem('propit_language') as Language || 'en';
    setLanguageState(saved);

    // Define initializer
    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'ta,en',
        layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE
      }, 'google_translate_element');

      // Once initialized, if saved language is Tamil, trigger it
      if (saved === 'ta') {
        triggerGoogleTranslate('ta');
      }
    };

    // Load script
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.body.appendChild(script);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('propit_language', lang);

    // Set Google Translate cookie
    if (lang === 'ta') {
      document.cookie = "googtrans=/en/ta; path=/;";
      document.cookie = "googtrans=/en/ta; path=/; domain=" + window.location.hostname;
    } else {
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    }

    // Ensure we mark the splash as shown so reloading doesn't play it
    sessionStorage.setItem('propit_splash_shown', 'true');
    // Force reload so Google Translate acts reliably across the application
    window.location.reload();
  };

  const t = (key: string): string => {
    if (language === 'ta') {
      return translations[key] || key;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
