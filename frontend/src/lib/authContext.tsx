import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiClient } from './apiClient';

type AuthContextValue = {
  token: string;
  setToken: (token: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setTokenState] = useState(() => sessionStorage.getItem('jat.token') ?? '');

  const setToken = (nextToken: string) => {
    setTokenState(nextToken);
  };

  useEffect(() => {
    if (token) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
      sessionStorage.setItem('jat.token', token);
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      sessionStorage.removeItem('jat.token');
    }
  }, [token]);

  const value = useMemo(() => ({ token, setToken }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
