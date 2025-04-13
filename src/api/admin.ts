import request from '@/utils/request';
import type {
  SystemStats,
  UserResponse,
  UsersResponse,
  CreateUserRequest,
  UpdateUserRequest,
  SystemLogResponse,
  UserActivityResponse,
  BatchManageRecordsRequest,
  ExportDataRequest,
  ExportDataResponse,
  SystemSettingsResponse,
  AdminDashboardResponse,
  // 批量任务相关类型
  BatchJobsResponse,
  BatchJobDetailsResponse,
  BatchJobUploadResponse,
  BatchJobProcessResponse,
  BatchStatus
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
 * 获取用户详情
 */
export const getUser = (user_id: number): Promise<ApiResponse<UserResponse>> => {
  return request.get(`/admin/users/${user_id}`);
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
 * 获取管理员仪表盘数据
 */
export const getAdminDashboard = (): Promise<ApiResponse<AdminDashboardResponse>> => {
  return request.get('/admin/dashboard');
};

/**
 * 获取批量任务列表
 */
export const getBatchJobs = (
  status?: string
): Promise<ApiResponse<BatchJobsResponse>> => {
  const params = status ? { status } : {};
  return request.get('/admin/batch-records', { params });
};

/**
 * 获取批量任务详情
 */
export const getBatchJobDetails = (
  jobId: string
): Promise<ApiResponse<BatchJobDetailsResponse>> => {
  return request.get(`/admin/batch-records/${jobId}`);
};

/**
 * 上传批量数据文件
 */
export const uploadBatchFile = (
  formData: FormData
): Promise<ApiResponse<BatchJobUploadResponse>> => {
  return request.post('/admin/batch-records/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 开始处理批量任务
 */
export const startBatchProcessing = (
  jobId: string
): Promise<ApiResponse<BatchJobProcessResponse>> => {
  return request.post(`/admin/batch-records/${jobId}/start`);
};

/**
 * 删除批量任务
 */
export const deleteBatchJob = (
  jobId: string
): Promise<ApiResponse<{ message: string }>> => {
  return request.delete(`/admin/batch-records/${jobId}`);
};

/**
 * 获取批量任务结果下载URL
 */
export const getBatchResultsDownloadUrl = (
  jobId: string
): string => {
  return `${request.defaults.baseURL}/admin/batch-records/${jobId}/download`;
}; 