import request from '@/utils/request';
import type { ApiResponse } from '@/types/auth';
import type { User } from '@/types/auth';
import type {
  SystemStats,
  UserManagementFilters,
  CreateUserRequest,
  UpdateUserRequest,
  AuditLogEntry,
  AuditLogFilters,
  SystemSettings
} from '@/types/admin';

/**
 * 获取系统统计数据
 */
export const getSystemStats = (): Promise<ApiResponse<SystemStats>> => {
  return request.get('/admin/stats');
};

/**
 * 获取用户列表
 */
export const getUsers = (filters?: UserManagementFilters, page = 1, limit = 10): Promise<ApiResponse<{ users: User[], total: number }>> => {
  let query = `?page=${page}&limit=${limit}`;
  if (filters) {
    if (filters.role) query += `&role=${filters.role}`;
    if (filters.status) query += `&status=${filters.status}`;
    if (filters.search) query += `&search=${encodeURIComponent(filters.search)}`;
  }
  return request.get(`/admin/users${query}`);
};

/**
 * 获取单个用户详情
 */
export const getUser = (userId: number): Promise<ApiResponse<User>> => {
  return request.get(`/admin/users/${userId}`);
};

/**
 * 创建用户
 */
export const createUser = (data: CreateUserRequest): Promise<ApiResponse<User>> => {
  return request.post('/admin/users', data);
};

/**
 * 更新用户
 */
export const updateUser = (userId: number, data: UpdateUserRequest): Promise<ApiResponse<User>> => {
  return request.put(`/admin/users/${userId}`, data);
};

/**
 * 删除用户
 */
export const deleteUser = (userId: number): Promise<ApiResponse> => {
  return request.delete(`/admin/users/${userId}`);
};

/**
 * 重置用户密码
 */
export const resetUserPassword = (userId: number, newPassword: string): Promise<ApiResponse> => {
  return request.post(`/admin/users/${userId}/reset-password`, { new_password: newPassword });
};

/**
 * 获取审计日志
 */
export const getAuditLogs = (filters?: AuditLogFilters, page = 1, limit = 10): Promise<ApiResponse<{ logs: AuditLogEntry[], total: number }>> => {
  let query = `?page=${page}&limit=${limit}`;
  if (filters) {
    if (filters.user_id) query += `&user_id=${filters.user_id}`;
    if (filters.action) query += `&action=${filters.action}`;
    if (filters.resource_type) query += `&resource_type=${filters.resource_type}`;
    if (filters.date_from) query += `&date_from=${filters.date_from}`;
    if (filters.date_to) query += `&date_to=${filters.date_to}`;
  }
  return request.get(`/admin/audit-logs${query}`);
};

/**
 * 获取系统设置
 */
export const getSystemSettings = (): Promise<ApiResponse<SystemSettings>> => {
  return request.get('/admin/settings');
};

/**
 * 更新系统设置
 */
export const updateSystemSettings = (data: Partial<SystemSettings>): Promise<ApiResponse<SystemSettings>> => {
  return request.put('/admin/settings', data);
};

/**
 * 备份系统数据
 */
export const backupSystem = (): Promise<ApiResponse<{ backup_id: string, backup_file: string }>> => {
  return request.post('/admin/backup');
};

/**
 * 获取备份列表
 */
export const getBackups = (): Promise<ApiResponse<{ id: string, filename: string, size: number, created_at: string }[]>> => {
  return request.get('/admin/backups');
};

/**
 * 恢复备份
 */
export const restoreBackup = (backupId: string): Promise<ApiResponse> => {
  return request.post(`/admin/backups/${backupId}/restore`);
};

/**
 * 下载备份文件
 */
export const downloadBackup = (backupId: string): string => {
  return `${request.defaults.baseURL}/admin/backups/${backupId}/download`;
}; 