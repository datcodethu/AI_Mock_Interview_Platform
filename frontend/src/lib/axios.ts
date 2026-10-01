import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthenticationResponse } from '../types/auth.types';
import { getAccessToken, setAccessToken } from './tokenStore';

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const publicAuthEndpoints = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh-token',
  '/auth/logout',
  '/auth/verify',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
]);

function isPublicRequest(url?: string): boolean {
  const path = url?.split('?')[0].replace(/\/+$/, '');
  return path !== undefined && (
    publicAuthEndpoints.has(path) ||
    path === '/categories' ||
    path.startsWith('/categories/')
  );
}

function isLogoutRequest(url?: string): boolean {
  return url?.split('?')[0].replace(/\/+$/, '') === '/auth/logout';
}

apiClient.interceptors.request.use((config) => {
  if (isPublicRequest(config.url) && !isLogoutRequest(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RefreshSubscriber = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let isRefreshing = false;
let refreshSubscribers: RefreshSubscriber[] = [];

function notifyRefreshSubscribers(error?: unknown) {
  const subscribers = refreshSubscribers;
  refreshSubscribers = [];
  subscribers.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
}

function dispatchSessionExpired() {
  setAccessToken(null);
  window.dispatchEvent(new CustomEvent('auth:session-expired'));
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;
    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      isPublicRequest(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      dispatchSessionExpired();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshSubscribers.push({
          resolve: () => resolve(apiClient(originalRequest)),
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const response = await apiClient.post<ApiResponse<AuthenticationResponse>>(
        '/auth/refresh-token',
        {},
      );
      setAccessToken(response.data.data.accessToken);
      notifyRefreshSubscribers();
      return apiClient(originalRequest);
    } catch (refreshError) {
      notifyRefreshSubscribers(refreshError);
      dispatchSessionExpired();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
