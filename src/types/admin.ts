import type { ApiResponse } from './auth';
import type { User, Role } from './auth';

// User-related types
export interface UserResponse {
  user: User;
}

export interface UsersResponse {
  users: User[];
  total: number;
  pages: number;
  current_page: number;
}

export interface PatientInfo {
  gender?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  allergies?: string;
}

export interface DoctorInfo {
  specialty?: string;
  license_number?: string;
  years_of_experience?: number;
  education?: string;
  hospital?: string;
  department?: string;
  bio?: string;
}

export interface ResearcherInfo {
  institution?: string;
  department?: string;
  research_area?: string;
  education?: string;
  publications?: string;
  projects?: string;
  bio?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  role: string;
  patient_info?: PatientInfo;
  doctor_info?: DoctorInfo;
  researcher_info?: ResearcherInfo;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  phone?: string;
  is_active?: boolean;
  role?: string;
  patient_info?: PatientInfo;
  doctor_info?: DoctorInfo;
  researcher_info?: ResearcherInfo;
}

// System stats types
export interface SystemStats {
  total_users: number;
  role_distribution: {
    patients: number;
    doctors: number;
    researchers: number;
    admins: number;
  };
  active_users: number;
  inactive_users: number;
}

// System logs types
export interface SystemLog {
  id: number;
  user_id: number;
  log_type: string;
  message: string;
  details?: string;
  created_at: string;
}

export interface SystemLogResponse {
  logs: SystemLog[];
  total: number;
  pages: number;
  current_page: number;
}

// System health types
export interface SystemHealthResponse {
  system: {
    cpu_usage: number;
    memory_usage: {
      total: number;
      available: number;
      percent: number;
    };
    disk_usage: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
    uptime: number;
  };
  database: {
    mysql_status: boolean;
    mongo_status: boolean;
    record_count: number;
  };
  users: {
    active_users: number;
    total_users: number;
    last_login_time?: string;
  };
  timestamp: string;
}

// User activity types
export interface ActivityData {
  date: string;
  count: number;
}

export interface ActiveUser {
  id: number;
  username: string;
  email: string;
  role: string;
  activity_count: number;
}

export interface UserActivityResponse {
  daily_activity: ActivityData[];
  role_distribution: Record<string, number>;
  most_active_users: ActiveUser[];
  period_days: number;
}

// Batch manage records types
export interface BatchManageRecordsRequest {
  action: 'delete' | 'visibility';
  record_ids: string[];
  reason?: string;
  visibility?: string;
}

// Export data types
export interface ExportDataRequest {
  export_type: 'users' | 'health_records' | 'system_logs';
  patient_id?: number;
  limit?: number;
  start_date?: string;
  end_date?: string;
}

export interface ExportDataResponse {
  filename: string;
  download_url: string;
  record_count: number;
}

// System settings types
export interface SecuritySettings {
  password_policy: Record<string, any>;
  login_attempts: number;
  session_timeout: number;
  require_email_confirmation: boolean;
}

export interface PrivacySettings {
  pir_enabled: boolean;
  pir_batch_size: number;
  default_record_visibility: string;
}

export interface SystemConfig {
  debug_mode: boolean;
  upload_limit: number;
  maintenance_mode: boolean;
  max_export_size: number;
}

export interface NotificationSettings {
  email_notifications: boolean;
  system_notifications: boolean;
  notification_types: string[];
}

export interface SystemSettingsResponse {
  settings: {
    security: SecuritySettings;
    privacy: PrivacySettings;
    system: SystemConfig;
    notifications: NotificationSettings;
  };
  raw_settings: Record<string, any>;
}

// Maintenance request types
export interface MaintenanceRequest {
  action: 'clear_cache' | 'vacuum_db' | 'backup';
}

// System metrics types
export interface ActivityMetrics {
  labels: string[];
  values: number[];
}

export interface SystemMetricsResponse {
  metrics: {
    user?: {
      query_count: number;
      active_users: number;
      activity_data: ActivityMetrics;
    };
    system?: {
      cpu_usage: number;
      memory_usage: number;
      system_uptime: number;
    };
    database?: {
      mysql: {
        table_counts: Record<string, number>;
        total_rows: number;
      };
      mongodb: {
        storage_size: number;
        data_size: number;
        collections: number;
        objects: number;
      };
    };
  };
  period: string;
  timestamp: string;
}

// Admin dashboard types
export interface SystemOverview {
  total_users: number;
  total_records: number;
  total_shared_records: number;
  total_queries: number;
}

export interface RecentActivity {
  logs: SystemLog[];
  users: User[];
  queries: any[];
}

export interface TimelineData {
  date: string;
  count: number;
}

export interface SystemStatus {
  maintenance_mode: boolean;
  error_count_24h: number;
  needs_backup: boolean;
  pir_enabled: boolean;
  pir_query_count: number;
}

export interface Alert {
  type: 'error' | 'warning' | 'info';
  message: string;
  details: string;
}

export interface AdminDashboardResponse {
  system_overview: SystemOverview;
  user_distribution: Record<string, number>;
  recent_activity: RecentActivity;
  timeline_data: TimelineData[];
  system_status: SystemStatus;
  alerts: Alert[];
}

// User role-specific list responses
export interface PatientData extends User {
  patient_info: PatientInfo;
  record_count: number;
  shared_records_count: number;
}

export interface PatientResponse {
  patients: PatientData[];
  total: number;
  pages: number;
  current_page: number;
}

export interface DoctorData extends User {
  doctor_info: DoctorInfo;
  viewed_records: number;
}

export interface DoctorResponse {
  doctors: DoctorData[];
  total: number;
  pages: number;
  current_page: number;
  specialty_options: string[];
}

export interface ResearcherData extends User {
  researcher_info: ResearcherInfo;
  query_count: number;
}

export interface ResearcherResponse {
  researchers: ResearcherData[];
  total: number;
  pages: number;
  current_page: number;
  institution_options: string[];
  research_area_options: string[];
}

export interface AdminData extends User {
  log_count: number;
  recent_activities: {
    time: string;
    action: string;
  }[];
}

export interface AdminResponse {
  admins: AdminData[];
  total: number;
  pages: number;
  current_page: number;
  current_admin: User;
} 