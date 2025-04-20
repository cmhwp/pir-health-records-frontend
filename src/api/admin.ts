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
  BatchStatus,
  // 添加新类型导入
  InstitutionsResponse,
  InstitutionResponse,
  CreateInstitutionRequest,
  UpdateInstitutionRequest,
  RecordTypesResponse,
  RecordTypeResponse,
  CreateRecordTypeRequest,
  UpdateRecordTypeRequest,


  ExportSystemDataParams,
  ExportTaskResponse,
  ExportHistoryQueryParams,
  ExportHistoryResponse,
  ExportTaskDetail,
  ExportOptionsResponse
} from '@/types/admin';
import type { ApiResponse } from '@/types/auth';
import type { 
  SystemSettingsUpdateRequest, 
  SystemSettingsUpdateResponse 
} from '@/types/admin';

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
  data: SystemSettingsUpdateRequest
): Promise<ApiResponse<SystemSettingsUpdateResponse>> => {
  return request.put('/admin/settings', data);
};

/**
 * 获取管理员仪表盘数据
 */
export const getAdminDashboard = (): Promise<ApiResponse<AdminDashboardResponse>> => {
  return request.get('/admin/dashboard');
};

/**
 * 获取医疗机构列表
 */
export const getInstitutions = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = ''
): Promise<ApiResponse<InstitutionsResponse>> => {
  return request.get('/admin/institutions', {
    params: {
      page,
      per_page,
      search
    }
  });
};

/**
 * 获取单个医疗机构详情
 */
export const getInstitution = (id: number): Promise<ApiResponse<InstitutionResponse>> => {
  return request.get(`/admin/institutions/${id}`);
};

/**
 * 创建新医疗机构
 */
export const createInstitution = (data: CreateInstitutionRequest): Promise<ApiResponse<InstitutionResponse>> => {
  return request.post('/admin/institutions', data);
};

/**
 * 更新医疗机构信息
 */
export const updateInstitution = (id: number, data: UpdateInstitutionRequest): Promise<ApiResponse<InstitutionResponse>> => {
  return request.put(`/admin/institutions/${id}`, data);
};

/**
 * 删除医疗机构
 */
export const deleteInstitution = (id: number): Promise<ApiResponse<{ message: string }>> => {
  return request.delete(`/admin/institutions/${id}`);
};

/**
 * 获取记录类型列表
 */
export const getRecordTypes = (
  page: number = 1, 
  per_page: number = 20, 
  search: string = ''
): Promise<ApiResponse<RecordTypesResponse>> => {
  return request.get('/admin/record-types', {
    params: {
      page,
      per_page,
      search
    }
  });
};

/**
 * 获取单个记录类型详情
 */
export const getRecordType = (id: number): Promise<ApiResponse<RecordTypeResponse>> => {
  return request.get(`/admin/record-types/${id}`);
};

/**
 * 创建新记录类型
 */
export const createRecordType = (data: CreateRecordTypeRequest): Promise<ApiResponse<RecordTypeResponse>> => {
  return request.post('/admin/record-types', data);
};

/**
 * 更新记录类型信息
 */
export const updateRecordType = (id: number, data: UpdateRecordTypeRequest): Promise<ApiResponse<RecordTypeResponse>> => {
  return request.put(`/admin/record-types/${id}`, data);
};

/**
 * 删除记录类型
 */
export const deleteRecordType = (id: number): Promise<ApiResponse<{ message: string }>> => {
  return request.delete(`/admin/record-types/${id}`);
};

// 数据导出相关接口
export async function exportSystemData(params: any): Promise<ApiResponse<any>> {
  return request.post('/admin/export/data', params);
}

export async function getExportHistory(params: any): Promise<ApiResponse<any>> {
  return request.get('/admin/export/history', { params });
}

export async function getExportDetails(exportId: string): Promise<ApiResponse<any>> {
  return request.get(`/admin/export/${exportId}`);
}

export async function cancelExportTask(exportId: string): Promise<ApiResponse<any>> {
  return request.post(`/admin/export/${exportId}/cancel`);
}

export async function deleteExportTask(exportId: string, deleteFile: boolean = false): Promise<ApiResponse<any>> {
  return request.delete(`/admin/export/${exportId}`, { params: { delete_file: deleteFile } });
}

export async function getExportOptions(): Promise<ApiResponse<any>> {
  return request.get('/admin/export/options');
}

// 获取下载链接 (用于前端直接跳转，不通过API调用)
export function getExportDownloadUrl(filename: string): string {
  return `${request.defaults.baseURL}/admin/export/download/${filename}`;
} 