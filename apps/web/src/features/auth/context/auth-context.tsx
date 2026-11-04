'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  UserSummary,
  AuthResponse,
  UserProfile,
  RegisterRequest,
  LoginRequest,
  UpdateProfileRequest,
  MessageResponse,
} from '@devspace/contracts';
import { apiClient } from '@/lib/api-client';

interface AuthContextType {
  user: UserSummary | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthResponse>;
  register: (data: RegisterRequest) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<UserProfile>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await apiClient<UserSummary>('/auth/me');
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
    const result = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      skipRefresh: true,
    });
    setUser(result.user);
    return result;
  };

  const register = async (data: RegisterRequest): Promise<AuthResponse> => {
    const result = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      skipRefresh: true,
    });
    setUser(result.user);
    return result;
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient<MessageResponse>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const updated = await apiClient<UserProfile>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setUser((prev) => (prev ? { ...prev, displayName: updated.displayName } : null));
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
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
