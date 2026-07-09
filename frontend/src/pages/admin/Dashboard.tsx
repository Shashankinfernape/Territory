import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { PlatformStats, AdminUser, AdminProperty } from '../../lib/types';
import { shortId } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

type Tab = 'overview' | 'users' | 'properties';

const TAB_LABELS: Record<Tab, string> = { overview: 'Overview', users: 'Users', properties: 'Properties' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [properties, setProperties] = useState<AdminProperty[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [viewDocsFor, setViewDocsFor] = useState<AdminProperty | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, propsRes] = await Promise.all([
        api.get<PlatformStats>('/admin/stats'),
        api.get<AdminUser[]>('/admin/users'),
        api.get<AdminProperty[]>('/admin/properties'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
    } catch {
      setError('Failed to load admin data. Please ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user and all their properties?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    try {
      await api.delete(`/admin/properties/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete property');
    }
  };

  const handleVerify = async (id: string, status: 'ACTIVE' | 'REJECTED') => {
    try {
      await api.put(`/admin/properties/${id}/verify`, { status });
      setViewDocsFor(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update property status');
    }
  };

  const handleEditProperty = (id: string) => {
    navigate(`/dashboard/seller/edit/${id}`);
  };

  if (loading && !stats) return (
    <div className="p-10 text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <p className="mt-2 text-gray-500">Loading admin dashboard...</p>
    </div>
  );

  if (error) return (
    <div className="p-10 text-center">
      <p className="text-red-500 font-medium">{error}</p>
    </div>
  );

  const tabBtnClass = (tab: Tab) =>
    `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === tab
        ? 'border-primary text-primary'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Control Panel</h1>
        <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold uppercase tracking-wide">Admin / God Mode</span>
      </div>

      <div className="mb-8 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={tabBtnClass(tab)}>
              {TAB_LABELS[tab]}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Users', value: stats.total_users, color: 'text-gray-900' },
            { label: 'Total Properties', value: stats.total_properties, color: 'text-primary' },
            { label: 'Total Transactions', value: stats.total_transactions, color: 'text-gray-900' },
            { label: 'Total Revenue', value: `₹${(stats.total_revenue ?? 0).toLocaleString('en-IN')}`, color: 'text-emerald-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</h3>
              <p className={`mt-2 text-4xl font-extrabold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Phone', 'Role', 'Full Name', 'Registered', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No users found.</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{u.phone_number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 inline-flex text-xs font-bold rounded-full ${
                      u.role === 'ADMIN' ? 'bg-red-100 text-red-700' :
                      u.role === 'SELLER' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    }`}>{u.role}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.full_name ?? '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {u.role !== 'ADMIN' && (
                      <button onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['City', 'Seller', 'Status', 'Docs', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {properties.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No properties found.</td></tr>
              ) : properties.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500" title={p.seller_id}>{shortId(p.seller_id)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      p.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                      p.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 
                      'bg-yellow-100 text-yellow-800'
                    }`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onClick={() => setViewDocsFor(p)} className="text-primary hover:underline">
                      {p.documents?.length || 0} Docs
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-x-3">
                    <button onClick={() => handleEditProperty(p.id)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                    <button onClick={() => handleDeleteProperty(p.id)} className="text-red-500 hover:text-red-700 font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Docs Verification Modal */}
      {viewDocsFor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Verify Property Documents</h2>
              <button onClick={() => setViewDocsFor(null)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            
            <div className="space-y-4 mb-8">
              {viewDocsFor.documents && viewDocsFor.documents.length > 0 ? (
                viewDocsFor.documents.map((doc, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="font-medium text-gray-700">{doc.type}</span>
                    <a href={`http://localhost:8000${doc.url}`} target="_blank" rel="noreferrer" className="text-primary hover:underline bg-green-50 px-3 py-1 rounded">
                      Open File ↗
                    </a>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic p-4 bg-gray-50 rounded">No documents uploaded.</div>
              )}
            </div>

            <div className="flex justify-end gap-4 border-t pt-4">
              {viewDocsFor.status === 'PENDING_VERIFICATION' && (
                <>
                  <button onClick={() => handleVerify(viewDocsFor.id, 'REJECTED')} className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 font-medium transition-colors">
                    Reject
                  </button>
                  <button onClick={() => handleVerify(viewDocsFor.id, 'ACTIVE')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors">
                    Approve Property
                  </button>
                </>
              )}
              {viewDocsFor.status !== 'PENDING_VERIFICATION' && (
                <div className="text-gray-500 italic">Property is already {viewDocsFor.status}.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
