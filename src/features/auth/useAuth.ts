import { useState, useEffect, useCallback } from 'react';
import type { User, LoginCredentials, RegisterData } from './types';

const STORAGE_KEY = 'sla_auth';
const STORAGE_USER_KEY = 'sla_user';

function mockLogin(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Mock: 简单的用户名密码验证
      if (credentials.username && credentials.password.length >= 6) {
        const user: User = {
          id: `user_${Date.now()}`,
          username: credentials.username,
          email: `${credentials.username}@example.com`,
          createdAt: new Date().toISOString()
        };
        const token = `mock_token_${Date.now()}`;
        resolve({ user, token });
      } else {
        reject(new Error('用户名或密码错误'));
      }
    }, 800);
  });
}

function mockRegister(data: RegisterData): Promise<{ user: User; token: string }> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (data.password !== data.confirmPassword) {
        reject(new Error('两次输入的密码不一致'));
        return;
      }
      if (data.password.length < 6) {
        reject(new Error('密码长度至少6位'));
        return;
      }
      if (!data.username || data.username.length < 3) {
        reject(new Error('用户名长度至少3位'));
        return;
      }
      const user: User = {
        id: `user_${Date.now()}`,
        username: data.username,
        email: data.email,
        createdAt: new Date().toISOString()
      };
      const token = `mock_token_${Date.now()}`;
      resolve({ user, token });
    }, 800);
  });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      const token = localStorage.getItem(STORAGE_KEY);
      if (stored && token) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load user:', e);
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const { user: loggedInUser, token } = await mockLogin(credentials);
      setUser(loggedInUser);
      localStorage.setItem(STORAGE_KEY, token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(loggedInUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setLoading(true);
    try {
      const { user: newUser, token } = await mockRegister(data);
      setUser(newUser);
      localStorage.setItem(STORAGE_KEY, token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(newUser));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
  }, []);

  const isAuthenticated = user !== null;

  return {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout
  };
}

