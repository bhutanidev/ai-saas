// src/api/api.ts
import axios, { type AxiosResponse } from 'axios';

// Base API configuration
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  withCredentials: true, // Important for cookie-based auth
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login only if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authApi = {
  googleLogin: async (credential: string) => {
    const res = await api.post('/auth/google', { credential });
    console.log(res.data);
    return res.data; // Return the response data
  },
  
  logout: async () => {
    const res = await api.post('/auth/logout');
    return res.data;
  },
  
  checkAuth: async () => {
    const res = await api.get('/auth');
    return res.data;
  },
  
  checkHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },
};

// Organization API endpoints
export const orgApi = {
  // Add org endpoints as needed
};

// Document API endpoints
export const docApi = {
  // Add document endpoints as needed
};

// GenAI API endpoints
export const genaiApi = {
  // Add genai endpoints as needed
};

export default api;