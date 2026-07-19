import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import UserProfileViewer from './UserProfileViewer';
import type { Property } from '../../lib/types';

type Tab = 'overview' | 'users' | 'properties' | 'transactions' | 'trending' | 'seller_approvals' | 'property_approvals' | 'property_edits' | 'questions' | 'pending_payments' | 'qr_management' | 'delete_requests';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  users: 'Registered Users',
  properties: 'Land Listings',
  transactions: 'Payments History',
  trending: 'Trending Listings',
  seller_approvals: 'New Seller Approvals',
  property_approvals: 'New Property Approvals',
  property_edits: 'Property Edit Approvals',
  questions: 'Promotion Requests',
  pending_payments: 'Verify Payments',
  qr_management: 'Payment QR',
  delete_requests: 'Delete Requests',
};

interface User {
  id: string;
  email?: string;
  phone_number?: string;
  role: string;
  full_name?: string;
  kyc_details?: {
    aadhaar_number: string;
    pan_number: string;
    status: string;
  };
  created_at?: string;
}

interface QuestionRequest {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone_number: string;
  message: string;
  status: string;
  created_at?: string;
}

interface Transaction {
  id: string;
  buyer_id: string;
  buyer_phone: string;
  buyer_name: string;
  property_id: string;
  property_city: string;
  property_district: string;
  property_type: string;
  seller_id: string;
  seller_phone: string;
  seller_name: string;
  amount: number;
  status: string;
  created_at?: string;
}

interface AdminStats {
  total_users: number;
  active_properties: number;
  pending_properties: number;
  pending_edits?: number;
  pending_delete_requests?: number;
  pending_sellers: number;
  pending_questions?: number;
  total_transactions: number;
  total_revenue: number;
}

interface DeleteRequestProperty {
  id: string;
  seller_id: string;
  city: string;
  district?: string;
  type?: string;
  price?: number;
  area?: number;
  area_unit?: string;
  status: string;
  view_count: number;
  created_at?: string;
}

  interface PendingPayment {
    _id: string;
    buyer_id: string;
    buyer_name: string;
    buyer_email: string;
    property_id: string;
    property_details?: {
      city?: string;
      state?: string;
      district?: string;
      area?: string | number;
      area_unit?: string;
      price?: number;
    };
    owner_id: string;
    owner_name: string;
    owner_email: string;
    transaction_id: string;
    payment_method: string;
    amount: number;
    status: string;
    created_at?: string;
  }

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [searchParams] = useSearchParams();
  const [viewingUserId, setViewingUserId] = useState<string | null>(searchParams.get('view_user') || null);
  const [users, setUsers] = useState<User[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [questions, setQuestions] = useState<QuestionRequest[]>([]);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<DeleteRequestProperty[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewDocsFor, setViewDocsFor] = useState<Property | null>(null);
  const [viewKycFor, setViewKycFor] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrUploading, setQrUploading] = useState(false);
  const [qrSuccess, setQrSuccess] = useState('');
  const [qrError, setQrError] = useState('');
  const [qrTimestamp, setQrTimestamp] = useState(Date.now());
  const [expandedEditId, setExpandedEditId] = useState<string | null>(null);
  const [rejectionModal, setRejectionModal] = useState<{
    isOpen: boolean;
    propertyId: string;
    actionType: 'VERIFY_REJECT' | 'DELETE_REJECT';
    reason: string;
  }>({
    isOpen: false,
    propertyId: '',
    actionType: 'VERIFY_REJECT',
    reason: '',
  });

  const getChangedFields = (p: Property) => {
    if (!p.original_details) return [];
    const fields = [
      { key: 'price', label: 'Price', format: (v: any) => v !== undefined ? `₹${v.toLocaleString('en-IN')}` : '-' },
      { key: 'area', label: 'Area', format: (v: any, item: any) => v !== undefined ? `${v} ${item.area_unit || ''}` : '-' },
      { key: 'city', label: 'City' },
      { key: 'district', label: 'District' },
      { key: 'taluk', label: 'Taluk' },
      { key: 'type', label: 'Land Type' },
      { key: 'description', label: 'Description' },
      { key: 'soil_type', label: 'Soil Type' },
      { key: 'water_source', label: 'Water Source' },
      { key: 'road_access', label: 'Road Access' },
      { key: 'fencing', label: 'Fencing' },
      { key: 'electricity', label: 'Electricity Grid', format: (v: any) => v ? 'Connected' : 'Not Connected' },
      { key: 'irrigation', label: 'Irrigation Setup', format: (v: any) => v ? 'Configured' : 'Not Configured' },
      { key: 'nearby_town', label: 'Nearest Town' },
      { key: 'distance_from_town_km', label: 'Distance to Town', format: (v: any) => v !== undefined ? `${v} km` : '-' },
    ];

    const diffs: Array<{ label: string; oldVal: string; newVal: string }> = [];
    fields.forEach(f => {
      const oldRaw = p.original_details?.[f.key];
      const newRaw = (p as any)[f.key];
      if (oldRaw !== undefined && newRaw !== undefined && String(oldRaw) !== String(newRaw)) {
        const oldVal = f.format ? f.format(oldRaw, p.original_details) : String(oldRaw || '-');
        const newVal = f.format ? f.format(newRaw, p) : String(newRaw || '-');
        diffs.push({ label: f.label, oldVal, newVal });
      }
    });
    return diffs;
  };
  
  // Custom delete confirmation modals
  const [deleteTargetUser, setDeleteTargetUser] = useState<string | null>(null);
  const [deleteTargetProperty, setDeleteTargetProperty] = useState<string | null>(null);
  // const navigate = useNavigate();

  const BACKEND_ROOT = import.meta.env.VITE_API_ROOT || 'http://localhost:8000';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      const [statsRes, usersRes, propsRes, txsRes, questionsRes, pendingPaymentsRes, deleteReqRes] = await Promise.all([
        api.get<AdminStats>('/admin/stats'),
        api.get<User[]>('/admin/users'),
        api.get<Property[]>('/admin/properties'),
        api.get<Transaction[]>('/admin/transactions'),
        api.get<QuestionRequest[]>('/admin/questions'),
        api.get<PendingPayment[]>('/payments/admin/pending'),
        api.get<DeleteRequestProperty[]>('/admin/delete-requests'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
      setTransactions(txsRes.data);
      setQuestions(questionsRes.data);
      setPendingPayments(pendingPaymentsRes.data);
      setDeleteRequests(deleteReqRes.data);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError('Access forbidden. Admin verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (txId: string) => {
    try {
      await api.post(`/payments/admin/approve/${txId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve payment');
    }
  };

  const handleRejectPayment = async (txId: string) => {
    try {
      await api.post(`/payments/admin/reject/${txId}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject payment');
    }
  };

  const handleApproveQuestion = async (id: string) => {
    try {
      await api.put(`/admin/questions/${id}/approve`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve seller promotion');
    }
  };

  const handleRejectQuestion = async (id: string) => {
    try {
      await api.put(`/admin/questions/${id}/reject`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject seller promotion');
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const shortId = (id: string) => id.slice(-8).toUpperCase();

  const handleDeleteUser = async (id: string) => {
    try {
      await api.delete(`/admin/users/${id}`);
      setDeleteTargetUser(null);
      fetchData();
      window.dispatchEvent(new Event('admin-notifications-update'));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    try {
      await api.delete(`/admin/properties/${id}`);
      setDeleteTargetProperty(null);
      fetchData();
      window.dispatchEvent(new Event('admin-notifications-update'));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete property');
    }
  };

  const handleVerify = async (id: string, status: 'ACTIVE' | 'REJECTED', rejection_message?: string) => {
    if (status === 'REJECTED' && !rejection_message) {
      setRejectionModal({
        isOpen: true,
        propertyId: id,
        actionType: 'VERIFY_REJECT',
        reason: '',
      });
      return;
    }
    try {
      await api.put(`/admin/properties/${id}/verify`, { status, rejection_message });
      setViewDocsFor(null);
      fetchData();
      window.dispatchEvent(new Event('admin-notifications-update'));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update property status');
    }
  };

  const handleVerifySeller = async (id: string) => {
    try {
      await api.put(`/admin/users/${id}/verify-seller`);
      setViewKycFor(null);
      fetchData();
      window.dispatchEvent(new Event('admin-notifications-update'));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to verify seller');
    }
  };

  const handleEditProperty = (id: string) => {
    navigate(`/dashboard/seller/edit/${id}`);
  };

  const handleApproveDeleteRequest = async (id: string) => {
    try {
      await api.post(`/admin/delete-requests/${id}/approve`);
      fetchData();
      window.dispatchEvent(new Event('admin-notifications-update'));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve delete request');
    }
  };

  const handleRejectDeleteRequest = async (id: string, rejection_message?: string) => {
    if (!rejection_message) {
      setRejectionModal({
        isOpen: true,
        propertyId: id,
        actionType: 'DELETE_REJECT',
        reason: '',
      });
      return;
    }
    try {
      await api.post(`/admin/delete-requests/${id}/reject`, { rejection_message });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject delete request');
    }
  };

  if (loading && !stats) return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(15, 23, 42, 0.6)', fontSize: '0.9rem', fontWeight: 600 }}>Loading admin control panel...</p>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', color: '#ff3b30', fontWeight: 700 }}>
      {error}
    </div>
  );

  const filteredUsers = users.filter(u => 
    u.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.phone_number || '').includes(searchQuery) || 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.role || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProperties = properties.filter(p => 
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.district || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.seller_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    shortId(p.seller_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.type || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTransactions = transactions.filter(t => 
    (t.buyer_phone || '').includes(searchQuery) || 
    (t.property_city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.property_district || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPendingSellers = users.filter(u => 
    (u.kyc_details?.status === 'PENDING' && u.role === 'USER') &&
    ((u.phone_number || '').includes(searchQuery) || 
     (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPendingProperties = properties.filter(p => 
    p.status === 'PENDING_VERIFICATION' && !p.is_edit_pending &&
    ((p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.district || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.seller_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     shortId(p.seller_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.type || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredPendingEdits = properties.filter(p => 
    p.status === 'PENDING_VERIFICATION' && p.is_edit_pending &&
    ((p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.district || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (p.seller_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     shortId(p.seller_id).toLowerCase().includes(searchQuery.toLowerCase()) ||
     (p.type || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredQuestions = questions.filter(q => 
    ((q.phone_number || '').includes(searchQuery) || 
     (q.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
     (q.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
     (q.status || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTabIcon = (tab: Tab, isSelected: boolean) => {
    const color = isSelected ? '#ffffff' : '#64748b';
    const style = {
      width: '15px',
      height: '15px',
      flexShrink: 0,
      stroke: color,
      fill: 'none',
      strokeWidth: 2,
      strokeLinecap: 'round' as const,
      strokeLinejoin: 'round' as const,
      transition: 'stroke 0.15s ease'
    };
    
    switch (tab) {
      case 'overview':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        );
      case 'trending':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case 'users':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'properties':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'transactions':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
        );
      case 'qr_management':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <rect x="3" y="3" width="6" height="6" rx="1" />
            <rect x="15" y="3" width="6" height="6" rx="1" />
            <rect x="3" y="15" width="6" height="6" rx="1" />
            <rect x="15" y="15" width="6" height="6" rx="1" />
          </svg>
        );
      case 'seller_approvals':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8" cy="7" r="4" />
            <polyline points="16 11 18 13 22 9" />
          </svg>
        );
      case 'property_approvals':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
        );
      case 'property_edits':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        );
      case 'delete_requests':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        );
      case 'pending_payments':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
        );
      case 'questions':
        return (
          <svg viewBox="0 0 24 24" style={style}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderNavItem = (tab: Tab, label: string, badgeCount?: number, badgeBg: string = '#ff3b30') => {
    const isSelected = activeTab === tab;
    return (
      <button
        onClick={() => {
          setActiveTab(tab);
          setSearchQuery('');
        }}
        style={{
          width: '100%',
          textAlign: 'left',
          padding: '0.55rem 0.75rem',
          borderRadius: '8px',
          border: 'none',
          background: isSelected ? '#0f172a' : 'transparent',
          color: isSelected ? '#ffffff' : '#475569',
          fontWeight: isSelected ? 700 : 500,
          fontSize: '0.8rem',
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          boxSizing: 'border-box'
        }}
        onMouseEnter={e => {
          if (!isSelected) {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.04)';
            e.currentTarget.style.color = '#0f172a';
          }
        }}
        onMouseLeave={e => {
          if (!isSelected) {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#475569';
          }
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {getTabIcon(tab, isSelected)}
          <span>{label}</span>
        </span>
        {badgeCount ? (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0.1rem 0.35rem',
            borderRadius: '4px',
            fontSize: '0.62rem',
            fontWeight: 800,
            background: isSelected ? '#ffffff' : badgeBg,
            color: isSelected ? '#0f172a' : '#ffffff',
            transition: 'all 0.15s ease'
          }}>
            {badgeCount}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <div style={{ background: '#faf9f6', minHeight: '100vh', padding: '1rem 1.5rem 3rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <style>{`
          .admin-layout {
            display: flex;
            flex-direction: row;
            gap: 2rem;
            align-items: stretch;
          }
          .admin-sidebar {
            width: 260px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.85);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(15, 23, 42, 0.08);
            padding: 1.25rem;
            display: flex;
            flex-direction: column;
            gap: 1.25rem;
            align-self: start;
            position: sticky;
            top: 20px;
            box-sizing: border-box;
          }
          .admin-content {
            flex-grow: 1;
            min-width: 0;
          }
          @media (max-width: 900px) {
            .admin-layout {
              flex-direction: column;
              gap: 1.5rem;
            }
            .admin-sidebar {
              width: 100%;
              position: static;
              flex-direction: row;
              flex-wrap: wrap;
              gap: 1rem;
              padding: 1.25rem;
            }
            .admin-sidebar > div {
              flex: 1 1 200px;
            }
          }
        `}</style>

        {!viewingUserId && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Admin Control Panel</h1>
            <span className="badge-premium" style={{ border: '1px solid #ff3b30', color: '#ff3b30', background: 'rgba(255,59,48,0.06)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.5rem', textTransform: 'uppercase' }}>System Console</span>
          </div>
        )}

        {viewingUserId ? (
          <UserProfileViewer userId={viewingUserId} onClose={() => setViewingUserId(null)} />
        ) : (
        <div className="admin-layout">
          {/* Sidebar Navigation */}
          <div className="admin-sidebar">
            {/* Category 1: Insights */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15, 23, 42, 0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                Insights
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {renderNavItem('overview', 'Overview')}
                {renderNavItem('trending', 'Trending')}
              </div>
            </div>

            {/* Category 2: Management */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15, 23, 42, 0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                System Data
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {renderNavItem('users', 'Registered Users')}
                {renderNavItem('properties', 'Land Listings')}
                {renderNavItem('transactions', 'Payments History')}
                {renderNavItem('qr_management', 'Payment QR')}
              </div>
            </div>

            {/* Category 3: Approvals & Requests */}
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15, 23, 42, 0.45)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
                Approvals & Requests
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {renderNavItem('seller_approvals', 'Seller Approvals', stats?.pending_sellers)}
                {renderNavItem('property_approvals', 'Listing Approvals', stats?.pending_properties)}
                {renderNavItem('property_edits', 'Edit Approvals', stats?.pending_edits)}
                {renderNavItem('delete_requests', 'Delete Approvals', stats?.pending_delete_requests ?? deleteRequests.length)}
                {renderNavItem('pending_payments', 'Verify Payments', pendingPayments.length)}
                {renderNavItem('questions', 'Promotion Requests', stats?.pending_questions)}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="admin-content">
            {activeTab !== 'overview' && (
              <div style={{ marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  placeholder={`Search in ${TAB_LABELS[activeTab]}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(15, 23, 42, 0.1)',
                    background: '#ffffff',
                    fontSize: '0.85rem',
                    fontFamily: 'inherit',
                    color: '#0f172a',
                    outline: 'none',
                    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.02)'
                  }}
                />
              </div>
            )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="admin-overview-grid">
            {/* Left Column: Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1.25rem'
              }}>
                {[
                  { label: 'Total Users', value: stats.total_users, color: '#0f172a' },
                  { label: 'Active Properties', value: stats.active_properties, color: '#0f172a' },
                  { label: 'Pending Reviews', value: stats.pending_properties, color: '#b8963e' },
                  { label: 'KYC Sellers Awaiting Approval', value: stats.pending_sellers, color: '#b8963e' },
                  { label: 'Promotion Requests Awaiting Approval', value: stats.pending_questions || 0, color: '#b8963e' },
                  { label: 'Delete Requests Awaiting Approval', value: stats.pending_delete_requests || 0, color: '#b91c1c' },
                  { label: 'Total Transactions', value: stats.total_transactions, color: '#0f172a' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{
                    background: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '85px'
                  }}>
                    <h3 style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>{label}</h3>
                    <p style={{ marginTop: '0.5rem', fontSize: '1.6rem', fontWeight: 900, color: color, margin: 0, letterSpacing: '-0.5px' }}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Platform Revenue Card */}
              <div style={{
                background: '#ffffff',
                padding: '1.25rem 1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(15, 23, 42, 0.06)',
                boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <h3 style={{ fontSize: '0.68rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Total Platform Revenue</h3>
                  <p style={{ marginTop: '0.35rem', fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0, letterSpacing: '-0.5px' }}>
                    ₹{(stats.total_revenue ?? 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: '#10b981',
                  borderRadius: '50%',
                  width: '42px',
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  fontFamily: 'inherit',
                  userSelect: 'none'
                }}>
                  ₹
                </div>
              </div>
            </div>

            {/* Right Column: Quick Actions */}
            <div style={{
              background: '#ffffff',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid rgba(15, 23, 42, 0.06)',
              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '0.75rem'
            }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '0.5rem' }}>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => setActiveTab('properties')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  Review Land Listings ({stats.pending_properties} pending)
                </button>
                <button
                  onClick={() => setActiveTab('users')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  Manage Registered Users ({stats.total_users})
                </button>
                <button
                  onClick={() => setActiveTab('trending')}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid rgba(15, 23, 42, 0.06)',
                    borderRadius: '6px',
                    padding: '0.5rem 0.75rem',
                    textAlign: 'left',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#0f172a',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                >
                  View Trending Listings (by views)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRENDING TAB */}
        {activeTab === 'trending' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Trending Properties</h2>
                <p style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.5)', marginTop: '0.2rem' }}>Listings ordered by total views count</p>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Rank', 'City / Type', 'Seller ID', 'Views Count', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...filteredProperties]
                    .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
                    .length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No listings found.</td></tr>
                    ) : [...filteredProperties]
                      .sort((a, b) => (b.view_count ?? 0) - (a.view_count ?? 0))
                      .map((p, index) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: index === 0 ? '#b8963e' : index === 1 ? '#64748b' : index === 2 ? '#b45309' : '#0f172a' }}>
                            #{index + 1}
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.city}{p.district ? `, ${p.district}` : ''}</div>
                            {p.type && <div style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.4)' }}>{p.type}</div>}
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'monospace' }}>
                            <span 
                              onClick={() => p.seller_id && setViewingUserId(p.seller_id)}
                              style={{ background: 'rgba(0,122,255,0.06)', color: '#007aff', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'underline' }}
                              title="Click to view seller details"
                            >
                              {p.seller_name || shortId(p.seller_id)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 800 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#b8963e' }}>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                              {p.view_count ?? 0}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <span className="badge-verified" style={{
                              border: p.status === 'ACTIVE' ? '1px solid #10b981' : p.status === 'REJECTED' ? '1px solid #ff3b30' : '1px solid #b8963e',
                              color: p.status === 'ACTIVE' ? '#10b981' : p.status === 'REJECTED' ? '#ff3b30' : '#b8963e',
                              background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.04)' : p.status === 'REJECTED' ? 'rgba(255, 59, 48, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                            }}>{p.status}</span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleEditProperty(p.id)}
                                style={{
                                  background: 'rgba(0, 122, 255, 0.08)',
                                  border: 'none',
                                  color: '#007aff',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setViewDocsFor(p)}
                                style={{
                                  background: 'rgba(184, 150, 62, 0.08)',
                                  border: 'none',
                                  color: '#b8963e',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                              >
                                Docs
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Phone', 'Role', 'Full Name', 'Registered', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No users found.</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace' }}>{u.phone_number || u.email || 'N/A'}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: u.role === 'ADMIN' ? '1px solid #ff3b30' : u.role === 'SELLER' ? '1px solid #007aff' : '1px solid #0f2042',
                          color: u.role === 'ADMIN' ? '#ff3b30' : u.role === 'SELLER' ? '#007aff' : '#0f2042',
                          background: u.role === 'ADMIN' ? 'rgba(255,59,48,0.04)' : u.role === 'SELLER' ? 'rgba(0,122,255,0.04)' : 'rgba(15, 32, 66, 0.05)'
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.7)' }}>
                        <span 
                          onClick={() => setViewingUserId(u.id)}
                          style={{ cursor: 'pointer', color: '#007aff', textDecoration: 'underline' }}
                          title="View full profile"
                        >
                          {u.full_name ?? '-'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {u.kyc_details?.status === 'PENDING' && u.role === 'USER' && (
                            <button
                              onClick={() => setViewKycFor(u)}
                              style={{
                                background: 'rgba(184, 150, 62, 0.08)',
                                border: 'none',
                                color: '#b8963e',
                                fontWeight: 600,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                            >
                              Review KYC
                            </button>
                          )}
                          {u.role !== 'ADMIN' && (
                            <button
                              onClick={() => setDeleteTargetUser(u.id)}
                              style={{
                                background: 'rgba(255, 59, 48, 0.08)',
                                border: 'none',
                                color: '#ff3b30',
                                fontWeight: 600,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROPERTIES TAB */}
        {activeTab === 'properties' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['City / Type', 'Seller ID', 'Status', 'Views', 'Docs', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No properties found.</td></tr>
                  ) : filteredProperties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.city}{p.district ? `, ${p.district}` : ''}</div>
                        {p.type && <div style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.4)' }}>{p.type}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'monospace' }}>
                        <span 
                          onClick={() => p.seller_id && setViewingUserId(p.seller_id)}
                          style={{ background: 'rgba(0,122,255,0.06)', color: '#007aff', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'underline' }}
                          title="Click to view seller details"
                        >
                          {p.seller_name || shortId(p.seller_id)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: p.status === 'ACTIVE' ? '1px solid #10b981' : p.status === 'REJECTED' ? '1px solid #ff3b30' : '1px solid #b8963e',
                          color: p.status === 'ACTIVE' ? '#10b981' : p.status === 'REJECTED' ? '#ff3b30' : '#b8963e',
                          background: p.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.04)' : p.status === 'REJECTED' ? 'rgba(255, 59, 48, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                        }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{p.view_count}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <button
                          onClick={() => setViewDocsFor(p)}
                          style={{
                            background: 'rgba(184, 150, 62, 0.08)',
                            border: 'none',
                            color: '#b8963e',
                            fontWeight: 600,
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                        >
                          {p.documents?.length || 0} Docs
                        </button>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {p.status === 'PENDING_VERIFICATION' && (
                            <>
                              <button
                                onClick={() => handleVerify(p.id, 'ACTIVE')}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  border: 'none',
                                  color: '#10b981',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleVerify(p.id, 'REJECTED')}
                                style={{
                                  background: 'rgba(255, 59, 48, 0.08)',
                                  border: 'none',
                                  color: '#ff3b30',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleEditProperty(p.id)}
                            style={{
                              background: 'rgba(0, 122, 255, 0.08)',
                              border: 'none',
                              color: '#007aff',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTargetProperty(p.id)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SELLER APPROVALS TAB */}
        {activeTab === 'seller_approvals' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Phone', 'Role', 'Full Name', 'KYC Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingSellers.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No pending seller approvals.</td></tr>
                  ) : filteredPendingSellers.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td 
                        onClick={() => {
                          setViewingUserId(u.id);
                        }}
                        style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#b8963e', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view in Registered Users"
                      >
                        {u.phone_number || u.email || 'N/A'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: '1px solid #0f2042',
                          color: '#0f2042',
                          background: 'rgba(15, 32, 66, 0.05)'
                        }}>{u.role}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#b8963e' }}>
                        <span 
                          onClick={() => setViewingUserId(u.id)}
                          style={{ cursor: 'pointer', color: '#007aff', textDecoration: 'underline' }}
                          title="View full profile"
                        >
                          {u.full_name ?? '-'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <span style={{ color: '#b8963e', fontWeight: 700 }}>{u.kyc_details?.status || 'PENDING'}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => setViewKycFor(u)}
                            style={{
                              background: 'rgba(184, 150, 62, 0.08)',
                              border: 'none',
                              color: '#b8963e',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                          >
                            Review KYC & Approve
                          </button>
                          <button
                            onClick={() => setDeleteTargetUser(u.id)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROPERTY APPROVALS TAB */}
        {activeTab === 'property_approvals' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['City / Type', 'Seller ID', 'Status', 'Docs', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingProperties.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No properties pending approval.</td></tr>
                  ) : filteredPendingProperties.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                       <td 
                        onClick={() => {
                          setActiveTab('properties');
                          setSearchQuery(p.id);
                        }}
                        style={{ padding: '1rem 1.5rem', cursor: 'pointer' }}
                        title="Click to view in Land Listings"
                      >
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b8963e', textDecoration: 'underline' }}>
                          {p.city}{p.district ? `, ${p.district}` : ''}{p.state ? `, ${p.state}` : ''}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(15,23,42,0.5)', marginTop: '0.15rem' }}>
                          {p.area} {p.area_unit} · {p.type} · <strong style={{ color: '#0f172a' }}>₹{p.price?.toLocaleString('en-IN')}</strong>
                        </div>
                      </td>
                      <td 
                        onClick={() => {
                          setViewingUserId(p.seller_id);
                        }}
                        style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#007aff', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                        title="Click to view seller details"
                      >
                        <span style={{ background: 'rgba(0,122,255,0.06)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {p.seller_name || shortId(p.seller_id)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: '1px solid #b8963e',
                          color: '#b8963e',
                          background: 'rgba(184, 150, 62, 0.04)'
                        }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <button
                          onClick={() => setViewDocsFor(p)}
                          style={{
                            background: 'rgba(184, 150, 62, 0.08)',
                            border: 'none',
                            color: '#b8963e',
                            fontWeight: 600,
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                        >
                          {p.documents?.length || 0} Docs
                        </button>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <button
                            onClick={() => handleVerify(p.id, 'ACTIVE')}
                            style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: 'none',
                              color: '#10b981',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleVerify(p.id, 'REJECTED')}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleEditProperty(p.id)}
                            style={{
                              background: 'rgba(0, 122, 255, 0.08)',
                              border: 'none',
                              color: '#007aff',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteTargetProperty(p.id)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROPERTY EDITS TAB */}
        {activeTab === 'property_edits' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['City / Type', 'Seller ID', 'Status', 'Docs', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingEdits.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No properties pending edit approval.</td></tr>
                  ) : filteredPendingEdits.map(p => {
                    const diffs = getChangedFields(p);
                    const isExpanded = expandedEditId === p.id;
                    return (
                      <React.Fragment key={p.id}>
                        <tr style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                           <td 
                            onClick={() => {
                              setActiveTab('properties');
                              setSearchQuery(p.id);
                            }}
                            style={{ padding: '1rem 1.5rem', cursor: 'pointer' }}
                            title="Click to view in Land Listings"
                          >
                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b8963e', textDecoration: 'underline' }}>
                              {p.city}{p.district ? `, ${p.district}` : ''}{p.state ? `, ${p.state}` : ''}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(15,23,42,0.5)', marginTop: '0.15rem' }}>
                              {p.area} {p.area_unit} · {p.type} · <strong style={{ color: '#0f172a' }}>₹{p.price?.toLocaleString('en-IN')}</strong>
                            </div>
                          </td>
                          <td 
                            onClick={() => {
                              setViewingUserId(p.seller_id);
                            }}
                            style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#007aff', fontFamily: 'monospace', cursor: 'pointer', textDecoration: 'underline' }}
                            title="Click to view seller details"
                          >
                            <span style={{ background: 'rgba(0,122,255,0.06)', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                              {p.seller_name || shortId(p.seller_id)}
                            </span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem' }}>
                            <span className="badge-verified" style={{
                              border: '1px solid #7c3aed',
                              color: '#7c3aed',
                              background: 'rgba(124, 58, 237, 0.04)'
                            }}>PENDING EDIT</span>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                            <button
                              onClick={() => setViewDocsFor(p)}
                              style={{
                                background: 'rgba(184, 150, 62, 0.08)',
                                border: 'none',
                                color: '#b8963e',
                                fontWeight: 600,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(184, 150, 62, 0.08)'}
                            >
                              {p.documents?.length || 0} Docs
                            </button>
                          </td>
                          <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <button
                                onClick={() => setExpandedEditId(isExpanded ? null : p.id)}
                                style={{
                                  background: isExpanded ? '#7c3aed' : 'rgba(124, 58, 237, 0.08)',
                                  border: 'none',
                                  color: isExpanded ? '#ffffff' : '#7c3aed',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                {isExpanded ? 'Hide Changes' : `Compare (${diffs.length})`}
                              </button>
                              <button
                                onClick={() => handleVerify(p.id, 'ACTIVE')}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.08)',
                                  border: 'none',
                                  color: '#10b981',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerify(p.id, 'REJECTED')}
                                style={{
                                  background: 'rgba(255, 59, 48, 0.08)',
                                  border: 'none',
                                  color: '#ff3b30',
                                  fontWeight: 600,
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: '#fbfbfd' }}>
                            <td colSpan={5} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                              <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '8px', padding: '1.25rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 800, color: '#2C2C2C', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                                  Proposed Modifications (Compare Current vs Proposed Changes)
                                </h4>
                                {diffs.length === 0 ? (
                                  <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0, fontStyle: 'italic' }}>
                                    No changes detected in compared fields (check custom fields/documents).
                                  </p>
                                ) : (
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                                    {diffs.map(d => (
                                      <div key={d.label} style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(15,23,42,0.4)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{d.label}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.35rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                          <span style={{ color: '#dc2626', textDecoration: 'line-through', background: 'rgba(220,38,38,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px dashed rgba(220,38,38,0.2)' }}>
                                            {d.oldVal}
                                          </span>
                                          <span style={{ color: 'rgba(15,23,42,0.4)', fontWeight: 600 }}>&rarr;</span>
                                          <span style={{ color: '#16a34a', fontWeight: 700, background: 'rgba(22,163,74,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px', border: '1px solid rgba(22,163,74,0.2)' }}>
                                            {d.newVal}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DELETE REQUESTS TAB */}
        {activeTab === 'delete_requests' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Property Delete Requests</h2>
              <p style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)', marginTop: '0.2rem' }}>Sellers have requested these properties be permanently deleted. Review and approve or reject.</p>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Property', 'Seller ID', 'Price / Area', 'Views', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deleteRequests.length === 0 ? (
                    <tr><td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      No pending delete requests.
                    </td></tr>
                  ) : deleteRequests.filter(p =>
                    (p.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.district || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.seller_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    shortId(p.seller_id).toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{p.city}{p.district ? `, ${p.district}` : ''}</div>
                        {p.type && <div style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.4)' }}>{p.type}</div>}
                        <div style={{ fontSize: '0.68rem', color: '#b91c1c', fontWeight: 600, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                          Delete Requested
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)', fontFamily: 'monospace' }}>
                        <span 
                          onClick={() => p.seller_id && setViewingUserId(p.seller_id)}
                          style={{ background: 'rgba(0,122,255,0.06)', color: '#007aff', cursor: 'pointer', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.75rem', textDecoration: 'underline' }}
                          title="Click to view seller details"
                        >
                          {p.seller_name || shortId(p.seller_id)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a' }}>
                        {p.price ? <div style={{ fontWeight: 700 }}>₹{p.price.toLocaleString('en-IN')}</div> : null}
                        {p.area ? <div style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.5)' }}>{p.area} {p.area_unit}</div> : null}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontWeight: 600 }}>{p.view_count}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleApproveDeleteRequest(p.id)}
                            style={{ background: 'rgba(255,59,48,0.08)', border: 'none', color: '#ff3b30', fontWeight: 600, padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', transition: 'all 0.15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.08)'}
                          >
                            Approve &amp; Delete
                          </button>
                          <button
                            onClick={() => handleRejectDeleteRequest(p.id)}
                            style={{ background: 'rgba(16,185,129,0.08)', border: 'none', color: '#10b981', fontWeight: 600, padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', transition: 'all 0.15s ease' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.18)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,185,129,0.08)'}
                          >
                            Reject Request
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TRANSACTIONS TAB */}
        {activeTab === 'transactions' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Buyer', 'Seller', 'Property', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No transactions yet.</td></tr>
                  ) : filteredTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          <span 
                            onClick={() => tx.buyer_id && setViewingUserId(tx.buyer_id)}
                            style={{ cursor: tx.buyer_id ? 'pointer' : 'default', color: tx.buyer_id ? '#007aff' : 'inherit', textDecoration: tx.buyer_id ? 'underline' : 'none' }}
                          >
                            {tx.buyer_name !== 'Unknown' ? tx.buyer_name : tx.buyer_phone}
                          </span>
                        </div>
                        {tx.buyer_name !== 'Unknown' && <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.4)', fontFamily: 'monospace' }}>{tx.buyer_phone}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>
                          <span 
                            onClick={() => tx.seller_id && setViewingUserId(tx.seller_id)}
                            style={{ cursor: tx.seller_id ? 'pointer' : 'default', color: tx.seller_id ? '#007aff' : 'inherit', textDecoration: tx.seller_id ? 'underline' : 'none' }}
                          >
                            {tx.seller_name !== 'Unknown' ? tx.seller_name : tx.seller_phone}
                          </span>
                        </div>
                        {tx.seller_name !== 'Unknown' && <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.4)', fontFamily: 'monospace' }}>{tx.seller_phone}</div>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.7)' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{tx.property_city}{tx.property_district ? `, ${tx.property_district}` : ''}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.4)' }}>{tx.property_type || 'Land'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                        ₹{tx.amount.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: tx.status === 'COMPLETED' ? '1px solid #10b981' : '1px solid #b8963e',
                          color: tx.status === 'COMPLETED' ? '#10b981' : '#b8963e',
                          background: tx.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                        }}>{tx.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.5)' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleString('en-IN') : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <button
                          onClick={() => navigate(`/property/${tx.property_id}`)}
                          style={{
                            background: 'rgba(0, 122, 255, 0.08)',
                            border: 'none',
                            color: '#007aff',
                            fontWeight: 600,
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.8rem',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.15)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)'}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QUESTIONS (PROMOTION REQUESTS) TAB */}
        {activeTab === 'questions' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Name', 'Email', 'Phone', 'Requested Date', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No promotion requests found.</td></tr>
                  ) : filteredQuestions.map(q => (
                    <tr key={q.id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                        <span 
                          onClick={() => q.user_id && setViewingUserId(q.user_id)} 
                          style={{ cursor: q.user_id ? 'pointer' : 'default', color: q.user_id ? '#007aff' : 'inherit', textDecoration: q.user_id ? 'underline' : 'none' }}
                        >
                          {q.full_name || 'Google User'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.7)' }}>{q.email}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: '#0f172a', fontFamily: 'monospace' }}>{q.phone_number}</td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)' }}>
                        {q.created_at ? new Date(q.created_at).toLocaleDateString('en-IN') : '-'}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className="badge-verified" style={{
                          border: q.status === 'APPROVED' ? '1px solid #10b981' : q.status === 'REJECTED' ? '1px solid #ff3b30' : '1px solid #b8963e',
                          color: q.status === 'APPROVED' ? '#10b981' : q.status === 'REJECTED' ? '#ff3b30' : '#b8963e',
                          background: q.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.04)' : q.status === 'REJECTED' ? 'rgba(255, 59, 48, 0.04)' : 'rgba(184, 150, 62, 0.04)'
                        }}>{q.status}</span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem' }}>
                        {q.status === 'PENDING' ? (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleApproveQuestion(q.id)}
                              style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                border: 'none',
                                color: '#10b981',
                                fontWeight: 600,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectQuestion(q.id)}
                              style={{
                                background: 'rgba(255, 59, 48, 0.08)',
                                border: 'none',
                                color: '#ff3b30',
                                fontWeight: 600,
                                padding: '0.4rem 0.8rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontFamily: 'inherit',
                                fontSize: '0.8rem',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'rgba(15, 23, 42, 0.4)', fontStyle: 'italic', fontSize: '0.8rem' }}>Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PENDING PAYMENTS TAB */}
        {activeTab === 'pending_payments' && (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(15, 23, 42, 0.02)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
                    {['Buyer Info', 'Property Info', 'Owner Info', 'Payment Details', 'Submitted Date', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.length === 0 ? (
                    <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgba(15,23,42,0.45)' }}>No pending payments to verify.</td></tr>
                  ) : pendingPayments.filter(p => 
                    (p.buyer_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.buyer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.transaction_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.payment_method || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (p.property_details?.city || '').toLowerCase().includes(searchQuery.toLowerCase())
                  ).map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid rgba(15, 23, 42, 0.06)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.015)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td 
                        onClick={() => {
                          setViewingUserId(p.buyer_id);
                        }}
                        style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                        title="Click to view full profile"
                      >
                        <div style={{ fontWeight: 700, color: '#b8963e', textDecoration: 'underline' }}>{p.buyer_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.6)', marginTop: '0.15rem' }}>{p.buyer_email}</div>
                      </td>
                      <td 
                        onClick={() => {
                          setActiveTab('properties');
                          setSearchQuery(p.property_id);
                        }}
                        style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                        title="Click to view in Land Listings"
                      >
                        {p.property_details ? (
                          <>
                            <div style={{ fontWeight: 600, color: '#b8963e', textDecoration: 'underline' }}>
                              {p.property_details.city}, {p.property_details.state}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.6)', marginTop: '0.15rem' }}>
                              {p.property_details.area} {p.property_details.area_unit} • ₹{p.property_details.price?.toLocaleString('en-IN') || '500'}
                            </div>
                          </>
                        ) : (
                          <div style={{ color: '#b8963e', textDecoration: 'underline' }}>Property ID: {p.property_id}</div>
                        )}
                      </td>
                      <td 
                        onClick={() => {
                          setViewingUserId(p.owner_id);
                        }}
                        style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer' }}
                        title="Click to view full profile"
                      >
                        <div style={{ fontWeight: 600, color: '#b8963e', textDecoration: 'underline' }}>{p.owner_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(15, 23, 42, 0.6)', marginTop: '0.15rem' }}>{p.owner_email}</div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ 
                            background: '#f1f5f9', 
                            color: '#475569', 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: '4px', 
                            fontSize: '0.7rem', 
                            fontWeight: 700 
                          }}>
                            {p.payment_method}
                          </span>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                            {p.transaction_id}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                          ₹{p.amount}
                        </div>
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem', color: 'rgba(15,23,42,0.5)' }}>
                        {p.created_at ? new Date(p.created_at).toLocaleString('en-IN') : '-'}
                      </td>
                      <td style={{ padding: '1.25rem 1.5rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleApprovePayment(p._id)}
                            style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: 'none',
                              color: '#10b981',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)'}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayment(p._id)}
                            style={{
                              background: 'rgba(255, 59, 48, 0.08)',
                              border: 'none',
                              color: '#ff3b30',
                              fontWeight: 600,
                              padding: '0.4rem 0.8rem',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontSize: '0.8rem',
                              transition: 'all 0.15s ease'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 59, 48, 0.08)'}
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* QR MANAGEMENT TAB */}
        {activeTab === 'qr_management' && (() => {
          const rootUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace('/api/v1', '');
          const handleQrFileChange = (file: File | null) => {
            setQrFile(file);
            setQrSuccess('');
            setQrError('');
            if (file) {
              const reader = new FileReader();
              reader.onloadend = () => setQrPreview(reader.result as string);
              reader.readAsDataURL(file);
            } else {
              setQrPreview(null);
            }
          };
          const handleQrUpload = async () => {
            if (!qrFile) return;
            setQrUploading(true);
            setQrSuccess('');
            setQrError('');
            try {
              const formData = new FormData();
              formData.append('file', qrFile);
              await api.post('/payments/admin/update-qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              setQrSuccess('QR code updated successfully! The new QR is now live for all payments.');
              setQrFile(null);
              setQrPreview(null);
              setQrTimestamp(Date.now());
            } catch (err: any) {
              setQrError(err?.response?.data?.detail || 'Failed to upload QR code.');
            } finally {
              setQrUploading(false);
            }
          };
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Action Required Banner */}
              {!qrSuccess && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem 1.25rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: '#92400e' }}>Payment QR needs to be uploaded</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#b45309', lineHeight: 1.5 }}>
                      No QR image is stored in the database yet. Buyers cannot see a valid payment QR until you upload one below. Use the upload panel to add your UPI payment QR.
                    </p>
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Current QR */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>Current Payment QR</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.5)', margin: '0 0 1.25rem 0' }}>This is the QR code users see when they pay ₹500 to unlock property documents.</p>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '1.5rem', border: '1px solid rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                    <img
                      key={qrTimestamp}
                      src={`${rootUrl}/api/v1/payments/qr-code?t=${qrTimestamp}`}
                      alt="Current Payment QR Code"
                      style={{ width: '200px', height: '200px', objectFit: 'contain', display: 'block' }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent && !parent.querySelector('.qr-placeholder')) {
                          const ph = document.createElement('div');
                          ph.className = 'qr-placeholder';
                          ph.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:0.75rem;color:rgba(15,23,42,0.35);';
                          ph.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="3" height="3" rx="0.5"/></svg><span style="font-size:0.78rem;font-weight:500;text-align:center">No QR uploaded yet.<br/>Use the panel to upload one.</span>';
                          parent.appendChild(ph);
                        }
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(15,23,42,0.4)', textAlign: 'center', margin: 0 }}>
                    Stored in <code style={{ background: '#f1f5f9', padding: '0.1rem 0.3rem', borderRadius: '3px', fontSize: '0.7rem' }}>Atlas &rarr; auth_db.settings</code>
                  </p>
                </div>
              </div>

              {/* Upload New QR */}
              <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid rgba(15, 23, 42, 0.06)', padding: '1.75rem', boxShadow: '0 4px 20px rgba(15, 23, 42, 0.015)' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem 0' }}>Upload New QR Code</h3>
                <p style={{ fontSize: '0.78rem', color: 'rgba(15,23,42,0.5)', margin: '0 0 1.25rem 0' }}>Upload a new QR image to replace the one shown to buyers. Accepts JPG, PNG, WEBP.</p>

                {/* Drop zone */}
                <label
                  htmlFor="qr-upload-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    border: `2px dashed ${qrPreview ? '#b8963e' : 'rgba(15,23,42,0.15)'}`,
                    borderRadius: '10px',
                    padding: '2rem 1rem',
                    cursor: 'pointer',
                    background: qrPreview ? 'rgba(184,150,62,0.03)' : '#f8fafc',
                    transition: 'all 0.2s ease',
                    minHeight: '160px',
                  }}
                  onDragOver={e => { e.preventDefault(); }}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleQrFileChange(f); }}
                >
                  {qrPreview ? (
                    <img src={qrPreview} alt="Preview" style={{ width: '140px', height: '140px', objectFit: 'contain', borderRadius: '6px' }} />
                  ) : (
                    <>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="1.5">
                        <rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/>
                        <rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="3" height="3" rx="0.5"/>
                        <rect x="18" y="13" width="3" height="3" rx="0.5"/><rect x="13" y="18" width="3" height="3" rx="0.5"/>
                        <rect x="18" y="18" width="3" height="3" rx="0.5"/>
                      </svg>
                      <span style={{ fontSize: '0.8rem', color: 'rgba(15,23,42,0.4)', textAlign: 'center' }}>
                        Drag & drop a QR image here<br/>or <span style={{ color: '#b8963e', fontWeight: 600 }}>click to browse</span>
                      </span>
                    </>
                  )}
                </label>
                <input
                  id="qr-upload-input"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => handleQrFileChange(e.target.files?.[0] || null)}
                />

                {qrFile && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', borderRadius: '6px', padding: '0.5rem 0.75rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>{qrFile.name}</span>
                    <button onClick={() => handleQrFileChange(null)} style={{ background: 'none', border: 'none', color: 'rgba(15,23,42,0.4)', cursor: 'pointer', fontSize: '1rem', padding: '0', lineHeight: 1 }}>&times;</button>
                  </div>
                )}

                {qrSuccess && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: '#065f46', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#065f46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    {qrSuccess}
                  </div>
                )}
                {qrError && (
                  <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.15)', borderRadius: '8px', color: '#991b1b', fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    {qrError}
                  </div>
                )}

                <button
                  onClick={handleQrUpload}
                  disabled={!qrFile || qrUploading}
                  style={{
                    marginTop: '1.25rem',
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: qrFile && !qrUploading ? 'linear-gradient(135deg, #b8963e, #d4a843)' : 'rgba(15,23,42,0.08)',
                    color: qrFile && !qrUploading ? '#ffffff' : 'rgba(15,23,42,0.35)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: qrFile && !qrUploading ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    letterSpacing: '0.02em',
                    boxShadow: qrFile && !qrUploading ? '0 4px 12px rgba(184,150,62,0.3)' : 'none',
                  }}
                >
                  {qrUploading ? 'Uploading...' : '↑ Update Payment QR'}
                </button>
              </div>
            </div> {/* end inner two-column grid */}
            </div>
          );
        })()}

          </div> {/* End .admin-content */}
        </div>
        )} {/* End .admin-layout or UserProfileViewer */}

        {/* Docs Verification Modal */}
        {viewDocsFor && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', maxWidth: '600px', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Verify Property Documents</h2>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(15, 23, 42, 0.55)', marginTop: '0.25rem' }}>{viewDocsFor.city}{viewDocsFor.district ? `, ${viewDocsFor.district}` : ''}</p>
                </div>
                <button onClick={() => setViewDocsFor(null)} style={{ background: 'none', border: 'none', color: 'rgba(15, 23, 42, 0.5)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {viewDocsFor.documents && viewDocsFor.documents.length > 0 ? (
                  viewDocsFor.documents.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '6px' }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>{doc.type}</span>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(15,23,42,0.45)', fontFamily: 'monospace', marginTop: '0.2rem', wordBreak: 'break-all' }}>{doc.url}</p>
                      </div>
                      <a
                        href={`${BACKEND_ROOT}${doc.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="badge-verified"
                        style={{
                          textDecoration: 'none',
                          border: '1px solid #2C2C2C',
                          color: '#ffffff',
                          background: '#2C2C2C',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '0.4rem 0.8rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#333333'}
                        onMouseLeave={e => e.currentTarget.style.background = '#2C2C2C'}
                      >
                        Open
                      </a>
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(15,23,42,0.45)', fontStyle: 'italic', padding: '1rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '6px' }}>No documents uploaded by seller.</div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '1.25rem' }}>
                {viewDocsFor.status === 'PENDING_VERIFICATION' ? (
                  <>
                    <button
                      onClick={() => handleVerify(viewDocsFor.id, 'REJECTED')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '6px',
                        border: '1px solid #ff3b30',
                        background: 'rgba(255,59,48,0.05)',
                        color: '#ff3b30',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,59,48,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,59,48,0.05)'}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerify(viewDocsFor.id, 'ACTIVE')}
                      style={{
                        padding: '0.55rem 1.25rem',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#10b981',
                        color: '#ffffff',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                      onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                    >
                      Approve &amp; Activate
                    </button>
                  </>
                ) : (
                  <div style={{ color: 'rgba(15,23,42,0.55)', fontStyle: 'italic', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                    Property is already <span style={{ fontWeight: 700, margin: '0 0.25rem', color: '#0f172a' }}>{viewDocsFor.status}</span>.
                    <button
                      onClick={() => handleVerify(viewDocsFor.id, viewDocsFor.status === 'ACTIVE' ? 'REJECTED' : 'ACTIVE')}
                      style={{
                        marginLeft: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: '#b8963e',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        fontFamily: 'inherit'
                      }}
                    >
                      Change to {viewDocsFor.status === 'ACTIVE' ? 'REJECTED' : 'ACTIVE'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* KYC Verification Modal */}
        {viewKycFor && viewKycFor.kyc_details && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', maxWidth: '500px', width: '100%', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(15, 23, 42, 0.06)', paddingBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Review Seller Request</h2>
                  <p style={{ fontSize: '0.8rem', color: 'rgba(15, 23, 42, 0.55)', marginTop: '0.25rem' }}>User: {viewKycFor.phone_number}</p>
                </div>
                <button onClick={() => setViewKycFor(null)} style={{ background: 'none', border: 'none', color: 'rgba(15, 23, 42, 0.5)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'rgba(15,23,42,0.6)', textTransform: 'uppercase' }}>Aadhaar Number</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem', fontFamily: 'monospace' }}>{viewKycFor.kyc_details.aadhaar_number}</p>
                </div>
                <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px solid rgba(15, 23, 42, 0.06)', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.75rem', color: 'rgba(15,23,42,0.6)', textTransform: 'uppercase' }}>PAN Number</span>
                  <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>{viewKycFor.kyc_details.pan_number}</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid rgba(15, 23, 42, 0.06)', paddingTop: '1.25rem' }}>
                <button
                  onClick={() => setViewKycFor(null)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(15,23,42,0.1)',
                    background: 'transparent',
                    color: 'rgba(15,23,42,0.7)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,23,42,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleVerifySeller(viewKycFor.id)}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#10b981',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#059669'}
                  onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                >
                  Approve Seller
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete User Modal */}
        {deleteTargetUser && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', maxWidth: '400px', width: '100%', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Delete User?</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.6)', marginBottom: '1.5rem', lineHeight: 1.5 }}>Are you sure you want to delete this user? This action will permanently remove all their properties, transactions, and data. This cannot be undone.</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setDeleteTargetUser(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(15,23,42,0.1)',
                    background: 'transparent',
                    color: 'rgba(15,23,42,0.7)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteTargetUser) handleDeleteUser(deleteTargetUser);
                  }}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ff3b30',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Property Modal */}
        {deleteTargetProperty && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', maxWidth: '400px', width: '100%', padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Delete Property?</h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.6)', marginBottom: '1.5rem', lineHeight: 1.5 }}>Are you sure you want to delete this property listing? This action cannot be undone.</p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setDeleteTargetProperty(null)}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(15,23,42,0.1)',
                    background: 'transparent',
                    color: 'rgba(15,23,42,0.7)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (deleteTargetProperty) handleDeleteProperty(deleteTargetProperty);
                  }}
                  style={{
                    padding: '0.55rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ff3b30',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Delete Property
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {rejectionModal.isOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 110 }}>
            <div style={{ background: '#ffffff', border: '1px solid rgba(15, 23, 42, 0.08)', borderRadius: '12px', boxShadow: '0 12px 40px rgba(15,23,42,0.08)', maxWidth: '440px', width: '100%', padding: '1.75rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff3b30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                Enter Rejection Reason
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'rgba(15, 23, 42, 0.6)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                Please provide a clear explanation for this rejection. The seller will see this message and any rejected changes on their dashboard so they can correct the listing.
              </p>
              
              <textarea
                value={rejectionModal.reason}
                onChange={e => setRejectionModal(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Type the reason for rejection here..."
                style={{
                  width: '100%',
                  height: '110px',
                  borderRadius: '8px',
                  border: '1.5px solid rgba(15, 23, 42, 0.12)',
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  color: '#0f172a',
                  fontFamily: 'inherit',
                  resize: 'none',
                  outline: 'none',
                  transition: 'border-color 0.15s ease',
                  marginBottom: '1.5rem',
                  boxSizing: 'border-box'
                }}
                onFocus={e => e.target.style.borderColor = '#7c3aed'}
                onBlur={e => e.target.style.borderColor = 'rgba(15, 23, 42, 0.12)'}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  onClick={() => setRejectionModal({ isOpen: false, propertyId: '', actionType: 'VERIFY_REJECT', reason: '' })}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: '1px solid rgba(15,23,42,0.1)',
                    background: 'transparent',
                    color: 'rgba(15,23,42,0.7)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const { propertyId, actionType, reason } = rejectionModal;
                    if (!reason.trim()) {
                      alert('Rejection reason is required.');
                      return;
                    }
                    setRejectionModal({ isOpen: false, propertyId: '', actionType: 'VERIFY_REJECT', reason: '' });
                    if (actionType === 'VERIFY_REJECT') {
                      await handleVerify(propertyId, 'REJECTED', reason.trim());
                    } else {
                      await handleRejectDeleteRequest(propertyId, reason.trim());
                    }
                  }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#ff3b30',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                >
                  Submit Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
