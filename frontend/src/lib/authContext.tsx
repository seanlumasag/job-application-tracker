import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
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
  const [token, setTokenState] = useState(() => {
    const stored = sessionStorage.getItem('jat.token') ?? '';
    if (stored) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${stored}`;
    }
    return stored;
  });

  const setToken = (nextToken: string) => {
    setTokenState(nextToken);
    if (nextToken) {
      apiClient.defaults.headers.common.Authorization = `Bearer ${nextToken}`;
      sessionStorage.setItem('jat.token', nextToken);
    } else {
      delete apiClient.defaults.headers.common.Authorization;
      sessionStorage.removeItem('jat.token');
    }
  };

  const value = useMemo(() => ({ token, setToken }), [token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
