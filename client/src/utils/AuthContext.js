import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : '';

  useEffect(() => {
    // Load user
    const loadUser = async () => {
      if (token) {
        try {
          const res = await axios.get('/api/auth/me');
          setCurrentUser(res.data.data);
        } catch (error) {
          console.error('Error loading user:', error);
          // If token is invalid or expired, clear it
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  // Login
  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token: newToken, data } = res.data;
      
      // Save token to local storage
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(data);
      
      // Update axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  // Register
  const register = async (userData) => {
    try {
      const res = await axios.post('/api/auth/register', userData);
      const { token: newToken, data } = res.data;
      
      // Save token to local storage
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setCurrentUser(data);
      
      // Update axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Register error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  // Logout
  const logout = () => {
    // Remove token from local storage
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    
    // Remove axios default header
    delete axios.defaults.headers.common['Authorization'];
  };

  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const res = await axios.put('/api/members/profile', userData);
      setCurrentUser({ ...currentUser, ...res.data.data });
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update profile'
      };
    }
  };

  // Change password
  const changePassword = async (passwords) => {
    try {
      await axios.put('/api/members/password', passwords);
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthenticated: !!token,
        isAdmin: currentUser?.membershipType === 'Staff',
        login,
        register,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;