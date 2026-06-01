import supabase from './supabase';
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
  RegisterData,
  LoginData,
} from '@/types';

// ==================== Auth API ====================

const auth = {
  register: async (data: RegisterData) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.first_name,
          last_name: data.last_name,
          date_of_birth: data.date_of_birth,
          gender: data.gender,
          phone_number: data.phone_number || '',
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!authData.user) {
      throw new Error('Registration completed, but the account may require email confirmation before login.');
    }

    return {
      data: {
        id: authData.user?.id || '',
        email: authData.user?.email || '',
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone_number: data.phone_number || '',
        is_active: true,
        created_at: authData.user?.created_at || new Date().toISOString(),
        updated_at: authData.user?.updated_at || new Date().toISOString(),
      } as User
    };
  },

  login: async (data: LoginData) => {
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (signInError) throw signInError;

    const session = authData.session;
    if (!session) {
      throw new Error('Login completed, but no session was returned. Please verify your credentials or email confirmation settings.');
    }

    localStorage.setItem('access_token', session.access_token);
    localStorage.setItem('refresh_token', session.refresh_token || '');

    return {
      data: {
        access_token: session.access_token,
        refresh_token: session.refresh_token || '',
        token_type: 'bearer',
        expires_in: session.expires_in || 3600,
      } as TokenResponse
    };
  },

  refreshToken: async () => {
    const { data: authData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError) throw refreshError;

    const session = authData.session;
    if (session) {
      localStorage.setItem('access_token', session.access_token);
      localStorage.setItem('refresh_token', session.refresh_token || '');
    }

    return {
      data: {
        access_token: session?.access_token || '',
        refresh_token: session?.refresh_token || '',
        token_type: 'bearer',
        expires_in: session?.expires_in || 3600,
      } as TokenResponse
    };
  },

  getMe: async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('No active session');

    // Ensure the profile row exists before reading it.
    const { data: existingProfile, error: existingError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingError) {
      throw new Error(existingError.message || 'Failed to verify user profile');
    }

    if (!existingProfile) {
      const profileData: Record<string, any> = {
        id: user.id,
        email: user.email ?? '',
        first_name: user.user_metadata?.first_name || 'Unknown',
        last_name: user.user_metadata?.last_name || 'User',
        date_of_birth: user.user_metadata?.date_of_birth || '1900-01-01',
        gender: user.user_metadata?.gender || 'OTHER',
        phone_number: user.user_metadata?.phone_number || '',
        is_active: true,
      };

      const { error: profileCreateError } = await supabase.from('users').insert(profileData);

      if (profileCreateError) {
        throw new Error(profileCreateError.message || 'Failed to create user profile');
      }
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;
    if (!profile) throw new Error('User profile not found');

    return { data: profile as User };
  },
};

// ==================== Reports API ====================

const reports = {
  uploadReport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/reports/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Upload failed');
    }

    const data = await res.json();
    return { data: data as { report_id: string; status: string; message: string } };
  },

  getReports: async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Report[] };
  },

  getReportById: async (id: string) => {
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (reportError) throw reportError;

    const { data: parameters, error: paramError } = await supabase
      .from('report_parameters')
      .select('*')
      .eq('report_id', id);

    if (paramError) throw paramError;

    return {
      data: {
        ...report,
        parameters: parameters || [],
      } as ReportDetail
    };
  },

  deleteReport: async (id: string) => {
    // Delete file from storage first if it exists
    const { data: report } = await supabase
      .from('reports')
      .select('file_path')
      .eq('id', id)
      .single();

    if (report?.file_path) {
      await supabase.storage.from('reports').remove([report.file_path]);
    }

    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { data: { status: 'success', message: 'Report deleted successfully' } };
  },

  downloadPdf: async (id: string) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/reports/${id}/download-pdf`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) throw new Error('Failed to download PDF');
    const blob = await res.blob();
    return { data: blob };
  },
};

// ==================== Analytics API ====================

const analytics = {
  getTrends: async (parameterName: string, range: string = 'YEARLY') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('report_parameters')
      .select('*, reports!inner(uploaded_at, user_id)')
      .eq('parameter_name', parameterName)
      .eq('reports.user_id', user.id);

    if (error) throw error;

    const trendPoints = (data || [])
      .map((rp: any) => ({
        date: new Date(rp.reports.uploaded_at).toLocaleDateString(),
        value: rp.parameter_value,
        status: rp.status,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      data: {
        parameter: parameterName,
        unit: data?.[0]?.unit || '',
        trend_points: trendPoints,
      } as TrendResponse
    };
  },

  getComparison: async (baseId: string, compareId: string) => {
    const { data: baseParams, error: baseError } = await supabase
      .from('report_parameters')
      .select('*')
      .eq('report_id', baseId);

    if (baseError) throw baseError;

    const { data: compareParams, error: compareError } = await supabase
      .from('report_parameters')
      .select('*')
      .eq('report_id', compareId);

    if (compareError) throw compareError;

    const improvements: string[] = [];
    const deteriorations: string[] = [];
    const stable: string[] = [];

    const baseMap = new Map(baseParams?.map(p => [p.parameter_name, p]));

    compareParams?.forEach(comp => {
      const base = baseMap.get(comp.parameter_name);
      if (base) {
        if (comp.status === 'NORMAL' && base.status !== 'NORMAL') {
          improvements.push(comp.parameter_name);
        } else if (comp.status !== 'NORMAL' && base.status === 'NORMAL') {
          deteriorations.push(comp.parameter_name);
        } else {
          stable.push(comp.parameter_name);
        }
      }
    });

    return {
      data: { improvements, deteriorations, stable }
    };
  },

  getHealthScore: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('health_scores')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;

    return { data: (data?.[0] || null) as HealthScore | null };
  },
};

// ==================== Risks API ====================

const risks = {
  getRisksByReport: async (reportId: string) => {
    const { data, error } = await supabase
      .from('risk_predictions')
      .select('*')
      .eq('report_id', reportId);

    if (error) throw error;
    return { data: (data || []) as RiskPrediction[] };
  },
};

// ==================== Chat API ====================

const chat = {
  createConversation: async (title: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert([{ title, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return { data: data as Conversation };
  },

  getConversations: async () => {
    const { data, error } = await supabase
      .from('ai_conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Conversation[] };
  },

  sendMessage: async (conversationId: string, message: string) => {
    const token = localStorage.getItem('access_token');
    const res = await fetch(`/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ conversationId, message })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to send message');
    }

    const data = await res.json();
    return { data: data as ChatMessage };
  },

  getMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return { data: (data || []) as ChatMessage[] };
  },
};

// ==================== Notifications API ====================

const notifications = {
  getNotifications: async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Notification[] };
  },

  markAsRead: async (id: string) => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data: data as Notification };
  },

  getUnreadCount: async () => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return { data: count || 0 };
  },
};

// ==================== Admin API ====================

const admin = {
  getDashboard: async () => {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalReports } = await supabase.from('reports').select('*', { count: 'exact', head: true });

    return {
      data: {
        total_users: totalUsers || 0,
        total_reports_processed: totalReports || 0,
        ocr_average_accuracy_percent: 98.5,
        ai_api_calls_total: (totalReports || 0) * 3,
        system_errors_last_24h: 0,
      } as AdminDashboard
    };
  },

  getUsers: async (skip: number = 0, limit: number = 20) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as User[] };
  },

  toggleUserStatus: async (userId: string) => {
    const { data: user, error: getError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', userId)
      .single();

    if (getError) throw getError;

    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) throw updateError;
    return { data: updatedUser as User };
  },

  getReports: async (skip: number = 0, limit: number = 20) => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .range(skip, skip + limit - 1)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as Report[] };
  },

  getAuditLogs: async (skip: number = 0, limit: number = 50) => {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .range(skip, skip + limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data: (data || []) as AuditLog[] };
  },
};

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
