import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add a response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    // Handle 401 Unauthorized errors (token expired)
    if (error.response && error.response.status === 401) {
      // Only redirect if not on the login page
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Set the auth token on app load if it exists
const token = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Add a request interceptor to ensure token is added to all requests
api.interceptors.request.use(
  (config) => {
    // 添加一些调试信息
    console.log('Request:', config.method, config.url);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request');
    }
    
    // 确保OPTIONS请求可以通过
    if (config.method.toLowerCase() === 'options') {
      console.log('Processing OPTIONS request');
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

export default api; 