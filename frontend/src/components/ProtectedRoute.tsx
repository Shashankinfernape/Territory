import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { role, loading } = useAuth();
  const token = getToken();

  if (loading) {
    // Better UX during auth verification to prevent flashing login page
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: "'Inter', sans-serif" }}>Verifying session...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole) {
    // ADMIN can access everything
    if (role === 'ADMIN') {
      return <>{children}</>;
    }
    
    // A standard USER can access only BUYER routes
    if (role === 'USER' && requiredRole === 'BUYER') {
      return <>{children}</>;
    }

    // Otherwise, check exact match
    if (role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
