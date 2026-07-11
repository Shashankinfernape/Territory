import { Navigate } from 'react-router-dom';
import { getToken } from '../lib/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const token = getToken();
  const role = localStorage.getItem('user_role');

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
