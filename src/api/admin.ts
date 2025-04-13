import request from '@/utils/request';
import type {
  SystemStats,
  UserResponse,
  UsersResponse,
  CreateUserRequest,
  UpdateUserRequest,
  SystemLogResponse,
  SystemHealthResponse,
  UserActivityResponse,
  BatchManageRecordsRequest,
  ExportDataRequest,
  ExportDataResponse,
  SystemSettingsResponse,
  MaintenanceRequest,
  SystemMetricsResponse,
  AdminDashboardResponse,
  PatientResponse,
  DoctorResponse,
  ResearcherResponse,
  AdminResponse
} from '@/types/admin';
import type { ApiResponse } from '@/types/auth';

/**
 * 获取所有用户列表
 */
export const getUsers = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = '', 
  role: string = ''
): Promise<ApiResponse<UsersResponse>> => {
  return request.get(`/admin/users?page=${page}&per_page=${per_page}&search=${encodeURIComponent(search)}&role=${role}`);
};

/**
 * 获取单个用户详情
 */
export const getUser = (userId: number): Promise<ApiResponse<UserResponse>> => {
  return request.get(`/admin/users/${userId}`);
};

/**
 * 创建用户（管理员专用）
 */
export const createUser = (data: CreateUserRequest): Promise<ApiResponse<UserResponse>> => {
  return request.post('/admin/users', data);
};

/**
 * 更新用户信息（管理员专用）
 */
export const updateUser = (userId: number, data: UpdateUserRequest): Promise<ApiResponse<UserResponse>> => {
  return request.put(`/admin/users/${userId}`, data);
};

/**
 * 删除用户
 */
export const deleteUser = (userId: number): Promise<ApiResponse<{ message: string }>> => {
  return request.delete(`/admin/users/${userId}`);
};

/**
 * 获取系统统计数据
 */
export const getSystemStats = (): Promise<ApiResponse<SystemStats>> => {
  return request.get('/admin/stats');
};

/**
 * 获取系统日志
 */
export const getSystemLogs = (
  page: number = 1, 
  per_page: number = 50, 
  log_type: string = '', 
  start_date?: string, 
  end_date?: string
): Promise<ApiResponse<SystemLogResponse>> => {
  let url = `/admin/logs?page=${page}&per_page=${per_page}`;
  if (log_type) url += `&type=${log_type}`;
  if (start_date) url += `&start_date=${start_date}`;
  if (end_date) url += `&end_date=${end_date}`;
  return request.get(url);
};

/**
 * 获取系统健康状态
 */
export const getSystemHealth = (): Promise<ApiResponse<SystemHealthResponse>> => {
  return request.get('/admin/system/health');
};

/**
 * 获取用户活动统计
 */
export const getUserActivity = (
  days: number = 30, 
  user_id?: number
): Promise<ApiResponse<UserActivityResponse>> => {
  let url = `/admin/users/activity?days=${days}`;
  if (user_id) url += `&user_id=${user_id}`;
  return request.get(url);
};

/**
 * 批量管理记录
 */
export const batchManageRecords = (
  data: BatchManageRecordsRequest
): Promise<ApiResponse<{ message: string, deleted_count?: number, updated_count?: number }>> => {
  return request.post('/admin/records/batch', data);
};

/**
 * 导出系统数据
 */
export const exportSystemData = (
  data: ExportDataRequest
): Promise<ApiResponse<ExportDataResponse>> => {
  return request.post('/admin/export/data', data);
};

/**
 * 下载导出的数据
 */
export const downloadExportedData = (filename: string): string => {
  return `${request.defaults.baseURL}/admin/export/download/${filename}`;
};

/**
 * 获取系统设置
 */
export const getSystemSettings = (): Promise<ApiResponse<SystemSettingsResponse>> => {
  return request.get('/admin/settings');
};

/**
 * 更新系统设置
 */
export const updateSystemSettings = (
  data: Record<string, any>
): Promise<ApiResponse<{ message: string, updated: string[] }>> => {
  return request.put('/admin/settings', data);
};

/**
 * 系统维护操作
 */
export const performMaintenance = (
  data: MaintenanceRequest
): Promise<ApiResponse<{ message: string, backup_file?: string }>> => {
  return request.post('/admin/maintenance', data);
};

/**
 * 获取系统性能指标
 */
export const getSystemMetrics = (
  type: string = 'all', 
  period: string = '24h'
): Promise<ApiResponse<SystemMetricsResponse>> => {
  return request.get(`/admin/metrics?type=${type}&period=${period}`);
};

/**
 * 获取管理员仪表盘数据
 */
export const getAdminDashboard = (): Promise<ApiResponse<AdminDashboardResponse>> => {
  return request.get('/admin/dashboard');
};

/**
 * 获取患者列表
 */
export const getPatients = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = ''
): Promise<ApiResponse<PatientResponse>> => {
  return request.get(`/admin/users/patients?page=${page}&per_page=${per_page}&search=${encodeURIComponent(search)}`);
};

/**
 * 获取医生列表
 */
export const getDoctors = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = '', 
  specialty: string = ''
): Promise<ApiResponse<DoctorResponse>> => {
  let url = `/admin/users/doctors?page=${page}&per_page=${per_page}&search=${encodeURIComponent(search)}`;
  if (specialty) url += `&specialty=${encodeURIComponent(specialty)}`;
  return request.get(url);
};

/**
 * 获取研究人员列表
 */
export const getResearchers = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = '', 
  institution: string = '', 
  research_area: string = ''
): Promise<ApiResponse<ResearcherResponse>> => {
  let url = `/admin/users/researchers?page=${page}&per_page=${per_page}&search=${encodeURIComponent(search)}`;
  if (institution) url += `&institution=${encodeURIComponent(institution)}`;
  if (research_area) url += `&research_area=${encodeURIComponent(research_area)}`;
  return request.get(url);
};

/**
 * 获取管理员列表
 */
export const getAdmins = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = ''
): Promise<ApiResponse<AdminResponse>> => {
  return request.get(`/admin/users/admins?page=${page}&per_page=${per_page}&search=${encodeURIComponent(search)}`);
}; 