'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const TOKEN_KEY = 'praman_auth_token';
const REFRESH_TOKEN_KEY = 'praman_refresh_token';

function setAuthCookie(authToken: string) {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
  document.cookie = `${TOKEN_KEY}=${encodeURIComponent(authToken)}; path=/; max-age=604800; SameSite=Lax${isSecure ? '; Secure' : ''}`;
}

function removeAuthCookie() {
  if (typeof document === 'undefined') return;
  // biome-ignore lint/suspicious/noDocumentCookie: Client cookie synchronization for Next.js 16 proxy boundary
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  refreshSession: () => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    const currentToken =
      token || (typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null);
    if (currentToken) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${currentToken}`,
          },
        });
      } catch {
        // Silently proceed - credentials must always be purged locally even if offline
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    removeAuthCookie();
    setToken(null);
    setUser(null);
  }, [token]);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    const storedRefreshToken =
      typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;

    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken || undefined }),
      });

      if (!res.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await res.json();
      const newAccessToken = data.accessToken;
      const newRefreshToken = data.refreshToken;
      const authUser = data.user;

      localStorage.setItem(TOKEN_KEY, newAccessToken);
      setAuthCookie(newAccessToken);
      if (newRefreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      }
      setToken(newAccessToken);
      setUser(authUser);
      return newAccessToken;
    } catch {
      await logout();
      return null;
    }
  }, [logout]);

  // Hydrate user session on initial page load
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      removeAuthCookie();
      setIsLoading(false);
      return;
    }

    setToken(storedToken);
    setAuthCookie(storedToken);

    fetch(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Session invalid');
        }
        return res.json() as Promise<AuthUser>;
      })
      .then((userData) => {
        setUser(userData);
      })
      .catch(async () => {
        // Attempt silent refresh before logging out
        await refreshSession();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [refreshSession]);

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed. Please check your credentials.');
    }

    const data = await res.json();
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;
    const authUser = data.user;

    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setAuthCookie(accessToken);
    setToken(accessToken);
    setUser(authUser);
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Registration failed. Please try again.');
    }

    const data = await res.json();
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken;
    const authUser = data.user;

    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
    setAuthCookie(accessToken);
    setToken(accessToken);
    setUser(authUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        refreshSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
