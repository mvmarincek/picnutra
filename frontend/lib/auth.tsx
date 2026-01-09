'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, TokenResponse, authApi, setAccessToken, clearAllTokens } from './api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    clearAllTokens();
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authApi.getMe();
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  }, []);

  const initializeAuth = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await authApi.refresh(refreshToken);
      
      setAccessToken(response.access_token);
      localStorage.setItem('refreshToken', response.refresh_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Session initialization failed:', err);
      clearAllTokens();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    
    setAccessToken(response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const register = async (email: string, password: string, referralCode?: string) => {
    const response = await authApi.register(email, password, referralCode);
    
    setAccessToken(response.access_token);
    localStorage.setItem('refreshToken', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    setUser(response.user);
    setIsAuthenticated(true);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      isAuthenticated,
      login, 
      register, 
      logout, 
      updateUser, 
      refreshUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
