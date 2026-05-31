import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  TokenResponse,
  Report,
  ReportDetail,
  TrendResponse,
  HealthScore,
  RiskPrediction,
  Conversation,
  ChatMessage,
  Notification,
  AdminDashboard,
  AuditLog,
  PaginatedResponse,
  RegisterData,
  LoginData,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (error: Error) => void }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor - attach auth token
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('access_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(axiosInstance(originalRequest));
            },
            reject: (err: Error) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        processQueue(null, access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================== Auth API ====================

const auth = {
  register: (data: RegisterData) =>
    axiosInstance.post<User>('/auth/register', data),

  login: (data: LoginData) => {
    return axiosInstance.post<TokenResponse>('/auth/login', {
      email: data.email,
      password: data.password,
    });
  },

  refreshToken: () => {
    const refreshToken = localStorage.getItem('refresh_token');
    return axiosInstance.post<TokenResponse>('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    });
  },

  getMe: () => axiosInstance.get<User>('/auth/me'),
};

// ==================== Reports API ====================

const reports = {
  uploadReport: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post<{ report_id: string; status: string; message: string }>('/reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getReports: () =>
    axiosInstance.get<Report[]>('/reports'),

  getReportById: (id: string) =>
    axiosInstance.get<ReportDetail>(`/reports/${id}`),

  deleteReport: (id: string) =>
    axiosInstance.delete(`/reports/${id}`),

  downloadPdf: (id: string) =>
    axiosInstance.get(`/reports/${id}/download-pdf`, { responseType: 'blob' }),
};

// ==================== Analytics API ====================

const analytics = {
  getTrends: (parameterName: string, range: string = 'YEARLY') =>
    axiosInstance.get<TrendResponse>('/analytics/trends', {
      params: { parameter_name: parameterName, range },
    }),

  getComparison: (baseId: string, compareId: string) =>
    axiosInstance.get<{ improvements: string[]; deteriorations: string[]; stable: string[] }>('/analytics/comparison', {
      params: { base_report_id: baseId, compare_report_id: compareId },
    }),

  getHealthScore: () =>
    axiosInstance.get<HealthScore>('/analytics/health-score'),
};

// ==================== Risks API ====================

const risks = {
  getRisksByReport: (reportId: string) =>
    axiosInstance.get<RiskPrediction[]>(`/risks/${reportId}`),
};

// ==================== Chat API ====================

const chat = {
  createConversation: (title: string) =>
    axiosInstance.post<Conversation>('/chat/conversations', { title }),

  getConversations: () =>
    axiosInstance.get<Conversation[]>('/chat/conversations'),

  sendMessage: (conversationId: string, message: string) =>
    axiosInstance.post<ChatMessage>(`/chat/conversations/${conversationId}/messages`, { message }),

  getMessages: (conversationId: string) =>
    axiosInstance.get<ChatMessage[]>(`/chat/conversations/${conversationId}/messages`),
};

// ==================== Notifications API ====================

const notifications = {
  getNotifications: () =>
    axiosInstance.get<Notification[]>('/notifications'),

  markAsRead: (id: string) =>
    axiosInstance.patch(`/notifications/${id}/read`),

  getUnreadCount: () =>
    axiosInstance.get<{ unread_count: number }>('/notifications/unread-count').then(res => ({ data: res.data?.unread_count || 0 })),
};

// ==================== Admin API ====================

const admin = {
  getDashboard: () =>
    axiosInstance.get<AdminDashboard>('/admin/analytics/dashboard'),

  getUsers: (skip: number = 0, limit: number = 20) =>
    axiosInstance.get<User[]>('/admin/users', { params: { skip, limit } }),

  toggleUserStatus: (userId: string) =>
    axiosInstance.patch(`/admin/users/${userId}/status`),

  getReports: (skip: number = 0, limit: number = 20) =>
    axiosInstance.get<Report[]>('/admin/reports', { params: { skip, limit } }),

  getAuditLogs: (skip: number = 0, limit: number = 50) =>
    axiosInstance.get<AuditLog[]>('/admin/audit-logs', { params: { skip, limit } }),
};

// Export consolidated API client layers matching the frontend queries
export const api = {
  auth,
  reports,
  analytics,
  risks,
  chat,
  notifications,
  admin,
};

export default api;
