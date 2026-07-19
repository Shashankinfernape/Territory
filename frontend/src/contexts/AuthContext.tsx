import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken } from '../lib/api';

export interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  phone_number?: string;
  address?: any;
}

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, role: null, loading: true, refreshUser: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<User>('/auth/me');
      setUser(res.data);
    } catch (err) {
      console.error("AuthContext: failed to fetch user", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    
    // Listen for local-auth-changed event from api.ts
    const handleAuthChange = () => {
      refreshUser();
    };
    window.addEventListener('local-auth-changed', handleAuthChange);
    return () => window.removeEventListener('local-auth-changed', handleAuthChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, role: user?.role || null, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
