import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('fecms_session_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fecms_session_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fecms_session_user');
    }
  }, [user]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const userData = await api.login(username, password);
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemo = async (role = 'ADMIN') => {
    setLoading(true);
    try {
      const username = role === 'ADMIN' ? 'admin' : 'amit';
      const userData = await api.login(username, 'password123');
      setUser(userData);
      return userData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fecms_session_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAdmin: user?.role === 'ADMIN',
        isMember: user?.role === 'USER',
        loading,
        login,
        loginAsDemo,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
