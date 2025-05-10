import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // 确保应用启动时设置token
  useEffect(() => {
    // Check if token exists and is valid
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Check if token is expired
        const decodedToken = jwt_decode(token);
        const currentTime = Date.now() / 1000;
        
        if (decodedToken.exp < currentTime) {
          // Token has expired, logout
          console.log('Token expired, logging out');
          handleLogout();
        } else {
          // Token is valid, set auth header
          console.log('Token valid, setting auth header');
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Fetch user info
          fetchUserInfo();
        }
      } catch (error) {
        console.error('Invalid token:', error);
        handleLogout();
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserInfo = async () => {
    try {
      console.log('Fetching user info...');
      // 确保在请求前重新设置token
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      console.log('Current headers:', api.defaults.headers.common['Authorization']);
      const response = await api.get('/api/auth/me');
      console.log('User info response:', response.data);
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user info:', error);
      if (error.response) {
        console.error('Error details:', error.response.status, error.response.data);
      }
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const response = await api.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Set auth header
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Set user and auth state
      setUser(user);
      setIsAuthenticated(true);
      
      // Redirect to dashboard
      navigate('/dashboard');
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.'
      };
    }
  };

  const handleLogout = () => {
    // Remove token from localStorage
    localStorage.removeItem('token');
    
    // Clear auth header
    delete api.defaults.headers.common['Authorization'];
    
    // Reset state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to login
    navigate('/login');
  };

  const updateUserInfo = (updatedUser) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUser }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
        updateUserInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 