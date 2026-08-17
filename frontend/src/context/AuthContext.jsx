import React, { useCallback, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { AuthContext } from './authContextStore';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  // ตรวจสอบ Token และดึงข้อมูลผู้ใช้ปัจจุบันเมื่อโหลดหน้าเว็บครั้งแรก
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const data = await authService.getMe();
          setUser(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
        } catch (error) {
          console.error('Failed to verify token:', error);
          logout();
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout]);

  useEffect(() => {
    const handleSessionExpired = () => logout();
    window.addEventListener('auth:session-expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session-expired', handleSessionExpired);
  }, [logout]);

  // ฟังก์ชันเข้าสู่ระบบ
  const login = (username, password) => authService.login(username, password);

  const completeLogin = (data) => {
    if (!data?.token || !data?.user) return false;
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return true;
  };

  // ฟังก์ชันสมัครสมาชิกใหม่
  const register = (username, email, password) => authService.register(username, email, password);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isCustomer: user?.role === 'customer',
    login,
    completeLogin,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
