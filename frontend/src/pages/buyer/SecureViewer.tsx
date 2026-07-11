import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type ViewerState = 'loading' | 'unauthorized' | 'ready' | 'error';

export default function SecureViewer() {
  const { propertyId, docIndex } = useParams<{ propertyId: string; docIndex: string }>();
  const navigate = useNavigate();
  const userPhone = localStorage.getItem('user_phone') ?? 'PROPIT USER';
  const role = localStorage.getItem('user_role');
  const dashboardPath = role === 'ADMIN' ? '/dashboard/admin' : (role === 'SELLER' ? '/dashboard/seller' : '/dashboard/buyer');

  const [state, setState] = useState<ViewerState>('loading');
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<string>('Document');
  const [isImage, setIsImage] = useState(false);
  const [isPdf, setIsPdf] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+P (Print), Ctrl+S (Save), Ctrl+C (Copy), Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!propertyId || docIndex === undefined) {
      setState('error');
      return;
    }

    const load = async () => {
      const role = localStorage.getItem('user_role');

      // Buyers must verify unlock before we try to stream the file
      if (role === 'BUYER') {
        try {
          const checkRes = await api.get(`/payments/check-unlock/${propertyId}`);
          if (!checkRes.data.unlocked) {
            setState('unauthorized');
            return;
          }
        } catch {
          setState('unauthorized');
          return;
        }
      }

      // Build the document access URL (authenticated via interceptor bearer token)
      // We fetch the property to know the doc type label, then stream via the gated endpoint
      try {
        const propRes = await api.get(`/properties/${propertyId}`);
        const docs: { type: string; url: string }[] = propRes.data.documents ?? [];
        const idx = parseInt(docIndex, 10);

        if (idx < 0 || idx >= docs.length) {
          setState('error');
          return;
        }

        const doc = docs[idx];
        setDocType(doc.type);

        // Detect file type from the stored url extension
        const ext = doc.url.split('.').pop()?.toLowerCase() ?? '';
        setIsImage(['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext));
        setIsPdf(ext === 'pdf');

        // Build the bearer-authenticated blob URL for secure viewing
        const token = localStorage.getItem('token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const docEndpoint = `${apiBase}/payments/document/${propertyId}/${idx}`;

        const response = await fetch(docEndpoint, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 403) {
          setState('unauthorized');
          return;
        }
        if (!response.ok) {
          setState('error');
          return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setDocUrl(objectUrl);
        setState('ready');
      } catch {
        setState('error');
      }
    };

    load();

    return () => {
      // Revoke object URL on unmount to free memory
      if (docUrl) URL.revokeObjectURL(docUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, docIndex]);

  // Redirect unauthorized buyers back to their dashboard
  useEffect(() => {
    if (state === 'unauthorized') {
      const timer = setTimeout(() => navigate(dashboardPath), 2500);
      return () => clearTimeout(timer);
    }
  }, [state, navigate, dashboardPath]);

  // Dynamic diagonal watermark grid pattern using inline SVG background
  const watermarkSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="350" height="250" viewBox="0 0 350 250">
      <text x="50%" y="50%" fill="rgba(255, 255, 255, 0.09)" font-size="12" font-family="'Courier New', Courier, monospace" font-weight="bold" text-anchor="middle" transform="rotate(-30 175 125)">
        CONFIDENTIAL - DO NOT COPY - ${userPhone}
      </text>
    </svg>
  `;
  const watermarkBg = `url("data:image/svg+xml;utf8,${encodeURIComponent(watermarkSvg)}")`;

  return (
    <div 
      className="min-h-screen text-white flex flex-col fixed inset-0 z-[100]"
      style={{ 
        fontFamily: "'Poppins', sans-serif",
        backgroundColor: '#0a0d14',
        backgroundImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.04), transparent 40%)'
      }}
    >
      {/* Premium Glassmorphic Header */}
      <div 
        className="px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap justify-between items-center shadow-2xl flex-shrink-0 gap-3"
        style={{
          background: 'rgba(10, 13, 20, 0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          zIndex: 50
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="16" height="16" fill="none" stroke="#10b981" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 className="font-bold tracking-tight text-gray-100 truncate" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>
              Secure Document Vault
            </h1>
            <p className="text-gray-400 font-mono mt-0.5 truncate" style={{ margin: 0, color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.65rem' }}>
              {docType} &mdash; Record #{propertyId?.slice(-6).toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span 
            className="hidden sm:inline-block text-xs px-3 py-1 rounded-full font-semibold tracking-wide select-none"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#f87171',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '0.7rem'
            }}
          >
            CONFIDENTIAL &mdash; WATERMARKED
          </span>
          <Link
            to={dashboardPath}
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              color: '#0a0d14',
              padding: '0.5rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Close Viewer
          </Link>
        </div>
      </div>

      {/* Body container */}
      <div
        className="flex-grow flex items-center justify-center p-6 bg-[#0a0d14] overflow-auto relative"
        style={{ userSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        {/* Repeating text watermark layer spanning the entire document view area */}
        <div 
          className="absolute inset-0 pointer-events-none z-40"
          style={{ 
            backgroundImage: watermarkBg,
            opacity: 1
          }} 
        />

        {/* Right-click block overlay on image views ONLY */}
        {isImage && (
          <div className="absolute inset-0 z-30 cursor-not-allowed" onContextMenu={(e) => e.preventDefault()} />
        )}

        {state === 'loading' && (
          <div className="text-center z-50">
            <svg className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400 text-sm">Validating vault signature...</p>
          </div>
        )}

        {state === 'unauthorized' && (
          <div className="text-center z-50">
            <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm">Please unlock this property registry profile first.</p>
            <p className="text-gray-500 text-xs mt-2">Redirecting to dashboard&hellip;</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center z-50">
            <div className="w-16 h-16 bg-yellow-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-800">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Document Unavailable</h2>
            <p className="text-gray-400 text-sm font-light">This registry file could not be fetched or verified.</p>
            <Link to={dashboardPath} className="mt-4 inline-block text-green-400 hover:underline text-sm">
              Back to Dashboard
            </Link>
          </div>
        )}

        {state === 'ready' && docUrl && (
          <div className="relative z-0 w-full max-w-5xl" style={{ position: 'relative', zIndex: 10 }}>
            {/* Document render */}
            {isImage && (
              <div 
                className="bg-white rounded-xl shadow-2xl overflow-hidden p-2"
                style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
              >
                <img
                  src={docUrl}
                  alt={docType}
                  className="w-full h-auto pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {isPdf && (
              <div 
                className="bg-[#1e2230] rounded-xl shadow-2xl overflow-y-auto flex flex-col items-center py-4" 
                style={{ 
                  height: '80vh',
                  border: '1px solid rgba(255, 255, 255, 0.08)'
                }}
              >
                <Document 
                  file={docUrl} 
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  loading={<div className="text-gray-400 p-10 text-sm">Loading secure PDF engine...</div>}
                  error={<div className="text-red-400 p-10 text-sm">Failed to render PDF document.</div>}
                >
                  {Array.from(new Array(numPages || 0), (_, index) => (
                    <div key={`page_${index + 1}`} className="mb-6 shadow-2xl" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                      <Page 
                        pageNumber={index + 1} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false} 
                        width={Math.min(window.innerWidth * 0.8, 850)}
                      />
                    </div>
                  ))}
                </Document>
              </div>
            )}

            {!isImage && !isPdf && (
              <div 
                className="rounded-xl p-10 text-center shadow-2xl"
                style={{
                  background: '#151922',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }}
              >
                <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-300 mb-4 font-medium">{docType}</p>
                <p className="text-gray-500 text-sm mb-6">This file format cannot be previewed in the browser.</p>
                <a
                  href={docUrl}
                  download={docType}
                  className="inline-flex items-center px-5 py-2.5 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download {docType}
                </a>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`@media print { body { display: none !important; } }`}</style>
    </div>
  );
}
