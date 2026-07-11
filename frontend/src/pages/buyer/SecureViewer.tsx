import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../lib/api';

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

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col fixed inset-0 z-[100]">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center shadow-lg flex-shrink-0">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Secure Document Viewer</h1>
          <p className="text-xs text-gray-400 font-mono mt-0.5">{docType} &mdash; Property #{propertyId?.slice(-6).toUpperCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-red-950 text-red-300 text-xs px-3 py-1 rounded-full border border-red-800 font-semibold tracking-wide select-none">
            CONFIDENTIAL &mdash; DO NOT COPY
          </span>
          <Link
            to={dashboardPath}
            className="text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors border border-gray-700 text-sm"
          >
            Close
          </Link>
        </div>
      </div>

      {/* Body */}
      <div
        className="flex-grow flex items-center justify-center p-6 bg-gray-900 overflow-auto relative"
        style={{ userSelect: 'none', WebkitTouchCallout: 'none' }}
      >
        {/* Invisible overlay blocks right-click saving on images */}
        <div className="absolute inset-0 z-10 cursor-not-allowed" onContextMenu={(e) => e.preventDefault()} />

        {state === 'loading' && (
          <div className="text-center z-20">
            <svg className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-400 text-sm">Verifying access and loading document&hellip;</p>
          </div>
        )}

        {state === 'unauthorized' && (
          <div className="text-center z-20">
            <div className="w-16 h-16 bg-red-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-800">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
            <p className="text-gray-400 text-sm">You need to unlock this property before viewing its documents.</p>
            <p className="text-gray-500 text-xs mt-2">Redirecting to dashboard&hellip;</p>
          </div>
        )}

        {state === 'error' && (
          <div className="text-center z-20">
            <div className="w-16 h-16 bg-yellow-950 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-800">
              <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-yellow-400 mb-2">Document Not Found</h2>
            <p className="text-gray-400 text-sm">This document could not be loaded.</p>
            <Link to={dashboardPath} className="mt-4 inline-block text-green-400 hover:underline text-sm">
              Back to Dashboard
            </Link>
          </div>
        )}

        {state === 'ready' && docUrl && (
          <div className="relative z-0 w-full max-w-5xl">
            {/* Watermark */}
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden select-none"
              style={{ transform: 'rotate(-30deg)', opacity: 0.07 }}
            >
              <span className="text-white text-6xl font-black whitespace-nowrap">
                TERRITORY VERIFIED &bull; {userPhone}
              </span>
            </div>

            {/* Document render */}
            {isImage && (
              <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
                <img
                  src={docUrl}
                  alt={docType}
                  className="w-full h-auto pointer-events-none"
                  draggable={false}
                />
              </div>
            )}

            {isPdf && (
              <div className="bg-gray-800 rounded-lg shadow-2xl overflow-hidden" style={{ height: '80vh' }}>
                <iframe
                  src={docUrl}
                  title={docType}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            )}

            {!isImage && !isPdf && (
              <div className="bg-gray-800 rounded-lg p-10 text-center shadow-2xl border border-gray-700">
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
