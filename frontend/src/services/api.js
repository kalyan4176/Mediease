import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer token if present
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('mediease_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid or expired, log user out
    if (error.response && error.response.status === 401) {
      console.log('Session expired. Logging out...');
      localStorage.removeItem('mediease_token');
      localStorage.removeItem('mediease_user');
      // Redirect optional, context handles state sync
    }
    return Promise.reject(error);
  }
);

export default API;
