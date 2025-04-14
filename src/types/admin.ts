import type { ApiResponse } from './auth';
import type { User, Role } from './auth';

// User-related types
export interface UserResponse extends User {
  last_login_formatted?: string;
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
  role?: string;
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
export interface PasswordPolicy {
  min_length: number;
  require_uppercase: boolean;
  require_lowercase: boolean;
  require_numbers: boolean;
  require_special: boolean;
  require_digit?: boolean;
}

export interface SecuritySettings {
  password_policy: PasswordPolicy;
  login_attempts: number;
  session_timeout: number;
  require_email_confirmation: boolean;
}

export interface PrivacySettings {
  pir_enabled: boolean;
  pir_batch_size: number;
  default_record_visibility: string;
}

export interface RegistrationSettings {
  registration_enabled: boolean;
  require_email_confirmation: boolean;
  allow_researcher_registration: boolean;
}

export interface SystemConfig {
  debug_mode: boolean;
  upload_limit: number;
  maintenance_mode: boolean;
  max_export_size: number;
  system_version?: string;
}

export interface NotificationSettings {
  email_notifications: boolean;
  system_notifications: boolean;
  notification_types: string[];
}

export interface GroupedSettings {
  security: SecuritySettings;
  privacy: PrivacySettings;
  system: SystemConfig;
  registration: RegistrationSettings;
  notifications: NotificationSettings;
}

export interface SystemSettingsResponse {
  settings: GroupedSettings;
  raw_settings: Record<string, any>;
  settings_visibility: Record<string, boolean>;
}

export interface VisibilityUpdate {
  [key: string]: boolean;
}

export interface SystemSettingsUpdateRequest {
  [key: string]: any;
  visibility?: VisibilityUpdate;
}

export interface SystemSettingsUpdateResponse {
  updated: string[];
  errors?: Array<{ key: string; error: string }>;
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
  system_status?: {
    error_count_24h: number;
    pir_enabled: boolean;
    pir_query_count: number;
  };
  alerts?: Alert[];
}

/**
 * 批量任务状态枚举
 */
export enum BatchStatus {
  PENDING = 'pending',      // 待处理
  PROCESSING = 'processing', // 处理中
  COMPLETED = 'completed',   // 已完成
  FAILED = 'failed'          // 失败
}

/**
 * 批量任务类型枚举
 */
export enum BatchType {
  PATIENT = 'patient',       // 患者记录
  MEDICATION = 'medication',  // 药物数据
  LAB = 'lab',               // 实验室结果
  CUSTOM = 'custom'          // 自定义数据
}

/**
 * 日志级别枚举
 */
export enum LogLevel {
  INFO = 'info',           // 信息
  WARNING = 'warning',      // 警告
  ERROR = 'error',          // 错误
  SUCCESS = 'success'       // 成功
}

/**
 * 批量任务信息
 */
export interface BatchJob {
  id: string;               // 批量任务ID
  name: string;             // 任务名称
  type: BatchType;          // 任务类型
  status: BatchStatus;      // 任务状态
  progress: number;         // 处理进度 (0-100)
  file_name?: string;       // 原始文件名
  file_type?: string;       // 文件类型 (CSV, JSON, XML)
  file_size?: number;       // 文件大小 (字节)
  records_count?: number;   // 总记录数
  processed_count?: number; // 已处理记录数
  error_count: number;      // 错误记录数
  options?: {               // 处理选项
    validateOnly?: boolean;  // 仅验证
    skipDuplicates?: boolean; // 跳过重复
  };
  createdBy: string;        // 创建者用户名
  createdAt: string;        // 创建时间
  updatedAt: string;        // 更新时间
  completedAt?: string;     // 完成时间
}

/**
 * 批量任务日志
 */
export interface BatchJobLog {
  id: number;               // 日志ID
  timestamp: string;        // 时间戳
  level: LogLevel;          // 日志级别
  message: string;          // 日志消息
  details?: any;            // 附加详细信息
}

/**
 * 批量任务错误
 */
export interface BatchJobError {
  key: number;              // 错误ID
  row?: number;             // 错误所在行号
  field?: string;           // 错误字段
  value?: string;           // 错误值
  error: string;            // 错误消息
  timestamp?: string;       // 时间戳
}

/**
 * 批量任务列表响应
 */
export interface BatchJobsResponse {
  batch_jobs: BatchJob[];
}

/**
 * 批量任务详情响应
 */
export interface BatchJobDetailsResponse {
  batch_job: BatchJob;
  logs: BatchJobLog[];
  errors: BatchJobError[];
}

/**
 * 批量任务上传响应
 */
export interface BatchJobUploadResponse {
  batch_job: BatchJob;
}

/**
 * 批量任务处理响应
 */
export interface BatchJobProcessResponse {
  batch_job: BatchJob;
} 