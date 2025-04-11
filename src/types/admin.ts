import type { ApiResponse } from './auth';
import type { User, Role } from './auth';

export interface SystemStats {
  total_users: number;
  users_by_role: {
    patient: number;
    doctor: number;
    researcher: number;
    admin: number;
  };
  total_records: number;
  records_by_type: Record<string, number>;
  active_users: number;
  records_created_today: number;
  records_shared_count: number;
}

export interface UserManagementFilters {
  role?: Role;
  status?: 'active' | 'inactive';
  search?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role: Role;
  is_active: boolean;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: Role;
  is_active?: boolean;
}

export interface AuditLogEntry {
  id: string;
  user_id: number;
  username: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address: string;
  timestamp: string;
}

export interface AuditLogFilters {
  user_id?: number;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}

export interface SystemSettings {
  site_name: string;
  site_description: string;
  enable_registration: boolean;
  default_user_role: Role;
  max_upload_size_mb: number;
  session_timeout_minutes: number;
  enable_pir_features: boolean;
  maintenance_mode: boolean;
} 