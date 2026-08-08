/** @jsxRuntime automatic */
/** @jsx React.createElement */
// eslint-disable-next-line @next/next/no-img-element
'use client';

import React from 'react';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAccessToken, getRefreshToken, getStoredUser, refreshAccessToken } from '@/lib/auth';

type User = {
  id: number;
  username: string;
  email: string;
  roles: string[];
  is_active: boolean;
};

type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  clearAuth: () => void;
  performRefresh: () => Promise<boolean>;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUserState] = useState<User | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    const refreshTokenValue = getRefreshToken();
    const storedUser = getStoredUser();

    setAccessTokenState(token);
    setRefreshTokenState(refreshTokenValue);
    if (storedUser) {
      setUserState(storedUser);
    }
    setLoading(false);
  }, []);

  const handleSetTokens = (newAccessToken: string, newRefreshToken: string): void => {
    setAccessTokenState(newAccessToken);
    setRefreshTokenState(newRefreshToken);
    localStorage.setItem('mcstap_token', newAccessToken);
    localStorage.setItem('mcstap_refresh', newRefreshToken);
    // Middleware runs server-side and can't read localStorage, so it
    // needs the token mirrored into a cookie to recognize the session.
    document.cookie = `mcstap_token=${newAccessToken}; path=/; max-age=3600; SameSite=Lax`;
  };

  const handleSetUser = (newUser: User | null): void => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
  };

  const handleClearAuth = (): void => {
    setUserState(null);
    setAccessTokenState(null);
    setRefreshTokenState(null);
    localStorage.removeItem('mcstap_token');
    localStorage.removeItem('mcstap_refresh');
    localStorage.removeItem('user');
    document.cookie = 'mcstap_token=; path=/; max-age=0; SameSite=Lax';
  };

  const handlePerformRefresh = async (): Promise<boolean> => {
    if (!refreshToken) return false;
    try {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        setAccessTokenState(newAccessToken);
        localStorage.setItem('mcstap_token', newAccessToken);
        document.cookie = `mcstap_token=${newAccessToken}; path=/; max-age=3600; SameSite=Lax`;
        return true;
      }
    } catch (err) {
      console.error('Token refresh failed:', err);
    }
    return false;
  };

  const value: AuthContextType = {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    setTokens: handleSetTokens,
    setUser: handleSetUser,
    clearAuth: handleClearAuth,
    performRefresh: handlePerformRefresh,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
