import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach Authorization Bearer token from authStore
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to unwrap standardized { success, data, message } payloads
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      return response.data; // Return the inner { success, message, data }
    }
    return response.data;
  },
  (error) => {
    const customMessage = error.response?.data?.message || error.message || 'API request failed';
    return Promise.reject(new Error(customMessage));
  },
);

export const checkBackendHealth = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/health`, { timeout: 3000 });
    return res.data;
  } catch (err: any) {
    return { status: 'offline', error: err.message };
  }
};
