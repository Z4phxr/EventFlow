import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    const role = localStorage.getItem('role');

    if (token && username && role) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.exp && decoded.exp * 1000 > Date.now()) {
        const userId = decoded.userId;
        setUser({ id: userId, username, email, role, token });
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
      }
    }
    setLoading(false);
  }, []);

  const login = (authData) => {
    const { token, username, email, role } = authData;
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('email', email || '');
    localStorage.setItem('role', role);
    
    const decoded = decodeJWT(token);
    const userId = decoded?.userId;
    
    setUser({ id: userId, username, email, role, token });
  };

  const register = (authData) => {
    login(authData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    setUser(null);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
