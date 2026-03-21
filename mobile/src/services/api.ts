import axios, { AxiosError } from 'axios';
import { supabase } from './supabaseClient';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  timeout: 120_000, // 2 minutes — long transcriptions can take time
});

// Attach Supabase JWT on every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error: string; message?: string }>) => {
    const status = error.response?.status;
    const serverMessage = error.response?.data?.message;

    if (status === 401) {
      return Promise.reject(new Error('auth_expired'));
    }
    if (status === 402) {
      return Promise.reject(new Error('insufficient_balance'));
    }
    if (status === 413) {
      return Promise.reject(new Error('file_too_large'));
    }
    if (status === 422) {
      return Promise.reject(new Error(serverMessage ?? 'unsupported_format'));
    }
    if (status === 503) {
      return Promise.reject(new Error('service_unavailable'));
    }

    return Promise.reject(new Error(serverMessage ?? error.message ?? 'network_error'));
  }
);

export default api;
