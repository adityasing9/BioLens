// ==================== Auth Types ====================

export interface AdminProfile {
  id: string;
  user_id: string;
  role: "SUPERADMIN" | "ANALYST" | "SUPPORT";
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "MALE" | "FEMALE" | "OTHER" | string;
  phone_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  admin_profile?: AdminProfile | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  phone_number?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// ==================== Report Types ====================

export interface Report {
  id: string;
  file_name: string;
  file_path?: string;
  file_type?: string;
  file_size?: number;
  upload_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | string;
  health_score?: number;
  status_message?: string;
  uploaded_at: string;
  updated_at?: string;
}

export interface Parameter {
  parameter_name: string;
  parameter_value: number;
  reference_range_min: number;
  reference_range_max: number;
  unit: string;
  status: "NORMAL" | "LOW" | "HIGH" | "CRITICAL" | string;
  ai_interpretation?: string;
}

export interface ReportDetail extends Report {
  ai_summary?: string;
  parameters: Parameter[];
}

// ==================== Analytics Types ====================

export interface TrendPoint {
  date: string;
  value: number;
  status?: string;
}

export interface TrendResponse {
  parameter: string;
  unit: string;
  trend_points: TrendPoint[];
}

export interface HealthScore {
  id: string;
  score: number;
  grade: "GOOD" | "MODERATE" | "POOR" | "EXCELLENT" | string;
  factors?: Record<string, number> | null;
  created_at: string;
}

// ==================== Risk Types ====================

export interface RiskPrediction {
  id?: string;
  disease_name: "DIABETES" | "ANEMIA" | "THYROID_DISORDERS" | "LIVER_DISEASE" | "KIDNEY_DISEASE" | "HEART_DISEASE" | string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | string;
  confidence_percentage: number;
  details?: string;
  created_at?: string;
}

// ==================== Chat Types ====================

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id?: string;
  sender: "USER" | "ASSISTANT" | string;
  message_text: string;
  source_reports?: string[] | null;
  created_at: string;
}

// ==================== Notification Types ====================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "CRITICAL_ALERT" | "REPORT_ANALYZED" | "HEALTH_CHANGE" | "SYSTEM" | string;
  is_read: boolean;
  created_at: string;
}

// ==================== Admin Types ====================

export interface AdminDashboard {
  total_users: number;
  total_reports_processed: number;
  ocr_average_accuracy_percent: number;
  ai_api_calls_total: number;
  system_errors_last_24h: number;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  ip_address: string;
  details?: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
}
