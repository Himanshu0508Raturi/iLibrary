import { set } from 'date-fns';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  username: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string, email: string, roles: string[]) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BASE_URL = 'http://ec2-98-84-15-104.compute-1.amazonaws.com:8080';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load token and user from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      console.log(setUser);
    }
  }, []);

  const signup = async (username: string, password: string, email: string, roles: string[]) => {
    // POST request to /public/signup endpoint
    const response = await fetch(`${BASE_URL}/public/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email, roles }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || 'Signup failed');
    }
  };

  const login = async (username: string, password: string) => {
    // POST request to /public/login endpoint
    const response = await fetch(`${BASE_URL}/public/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    // Get JSON response from login endpoint
    const data = await response.json();
    const jwtToken = data.token;
    const roles = data.roles || [];

    console.log('Login response:', data); // For debugging
    console.log('Extracted token:', jwtToken);
    console.log('Extracted roles:', roles);

    // Decode JWT to get additional user info (optional, for username/email)
    let payload: any = {};
    try {
      payload = JSON.parse(atob(jwtToken.split('.')[1]));
      console.log('JWT payload:', payload); // For debugging
    } catch (error) {
      console.warn('Failed to decode JWT payload:', error);
    }

    const userData: User = {
      username: payload.sub || username,
      email: payload.email || '',
      roles: roles, // Use roles from JSON response
    };

    setToken(jwtToken);
    setUser(userData);
    
    // Store in localStorage
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        signup,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
