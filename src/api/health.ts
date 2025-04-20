import request from '@/utils/request';
import type { ApiResponse } from '../types/auth';
import type {
  AdvancedSearchRequest,
  AdvancedSearchResponse,
  BatchUpdateVisibilityRequest,
  BatchUploadRecordsRequest,
  BatchUploadResponse,
  CreateRecordRequest,
  CreateRecordResponse,
  CreateVersionRequest,
  ExportRecordsRequest,
  ExportRecordsResponse,
  GetRecordsParams,
  GetRecordsResponse,
  GetVersionResponse,
  HealthRecord,
  HealthStatisticsResponse,
  ImportRecordsResponse,
  ImportTemplateResponse,
  PIRQueryRequest,
  PIRQueryResponse,
  PIRSettingsResponse,
  PIRStatisticsResponse,
  QueryHistoryResponse,
  RecordVersionsResponse,
  RestoreVersionRequest,
  SearchFilter,
  SecureDeleteRequest,
  ShareRecordRequest,
  SharedRecordsResponse,
  UpdatePIRSettingsRequest,
  UpdateRecordRequest,
  ViewSharedRecordResponse,
  ShareableUsersResponse,
  ShareableUserDetail,
  RecordTypesResponse,
  InstitutionsResponse,
  MonthlyRecordStatsResponse
} from '../types/health';

const API_PATH = '/health';

/**
 * 创建健康记录
 */
export const createHealthRecord = async (
  data: CreateRecordRequest
): Promise<ApiResponse<CreateRecordResponse>> => {
  const formData = new FormData();
  
  // 添加记录数据
  formData.append('record_data', JSON.stringify(data.record_data));
  
  // 添加文件
  if (data.files && data.files.length > 0) {
    data.files.forEach(file => {
      formData.append('files', file);
    });
  }
  
  // 添加文件描述
  if (data.file_description) {
    formData.append('file_description', data.file_description);
  }
  
  // 添加加密密钥（如果有）
  if (data.encryption_key) {
    formData.append('encryption_key', data.encryption_key);
  }
  
  return request.post(`${API_PATH}/records`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 获取健康记录列表
 */
export const getHealthRecords = async (
  params?: GetRecordsParams
): Promise<ApiResponse<GetRecordsResponse>> => {
  return request.get(`${API_PATH}/records`, { params });
};

/**
 * 获取单条健康记录
 */
export const getHealthRecord = async (
  recordId: string,
  anonymous: boolean = false
): Promise<ApiResponse<{ record: HealthRecord; sql_id: number | null }>> => {
  return request.get(`${API_PATH}/records/${recordId}`, { 
    params: { anonymous } 
  });
};

/**
 * 更新健康记录
 */
export const updateHealthRecord = async (
  recordId: string,
  data: UpdateRecordRequest
): Promise<ApiResponse<HealthRecord>> => {
  return request.put(`${API_PATH}/records/${recordId}`, data);
};

/**
 * 删除健康记录
 */
export const deleteHealthRecord = async (
  recordId: string
): Promise<ApiResponse<void>> => {
  return request.delete(`${API_PATH}/records/${recordId}`);
};

/**
 * 获取健康记录文件URL
 */
export const getRecordFileUrl = (filename: string): string => {
  return `${request.defaults.baseURL}${API_PATH}/files/${filename}`;
};

/**
 * 获取健康统计数据
 */
export const getHealthStatistics = async (
  startDate?: string,
  endDate?: string,
  anonymous: boolean = false
): Promise<ApiResponse<HealthStatisticsResponse>> => {
  const params: any = { anonymous };
  
  if (startDate) {
    params.start_date = startDate;
  }
  
  if (endDate) {
    params.end_date = endDate;
  }
  
  return request.get(`${API_PATH}/statistics`, { params });
};

/**
 * 高级搜索功能
 */
export const advancedSearch = async (
  params: AdvancedSearchRequest
): Promise<ApiResponse<AdvancedSearchResponse>> => {
  return request.post(`${API_PATH}/search/advanced`, params);
};

/**
 * 获取搜索过滤条件
 */
export const getSearchFilters = async (): Promise<ApiResponse<SearchFilter>> => {
  return request.get(`${API_PATH}/search/filters`);
};

/**
 * 共享健康记录
 */
export const shareHealthRecord = async (
  recordId: string,
  data: ShareRecordRequest
): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/records/${recordId}/share`, data);
};

/**
 * 获取我共享的记录列表
 */
export const getRecordsSharedByMe = async (
  page: number = 1,
  perPage: number = 10,
  validOnly: boolean = true,
  sharedWith?: number
): Promise<ApiResponse<SharedRecordsResponse>> => {
  const params = {
    page,
    per_page: perPage,
    valid_only: validOnly,
    ...(sharedWith && { shared_with: sharedWith })
  };
  
  return request.get(`${API_PATH}/shared/by-me`, { params });
};

/**
 * 获取共享给我的记录列表
 */
export const getRecordsSharedWithMe = async (
  page: number = 1,
  perPage: number = 10,
  validOnly: boolean = true,
  ownerId?: number
): Promise<ApiResponse<SharedRecordsResponse>> => {
  const params = {
    page,
    per_page: perPage,
    valid_only: validOnly,
    ...(ownerId && { owner_id: ownerId })
  };
  
  return request.get(`${API_PATH}/shared/with-me`, { params });
};

/**
 * 查看共享记录详情
 */
export const viewSharedRecord = async (
  sharedId: string
): Promise<ApiResponse<ViewSharedRecordResponse>> => {
  return request.get(`${API_PATH}/shared/records/${sharedId}`);
};

/**
 * 撤销共享
 */
export const revokeSharedRecord = async (
  sharedId: string
): Promise<ApiResponse<void>> => {
  return request.delete(`${API_PATH}/shared/${sharedId}`);
};

/**
 * PIR隐匿查询健康记录
 */
export const pirQueryHealthRecords = async (
  params: PIRQueryRequest
): Promise<ApiResponse<PIRQueryResponse>> => {
  return request.get(`${API_PATH}/pir/records`, { 
    params: { ...params, anonymous: true } 
  });
};

/**
 * 高级隐匿查询功能
 */
export const advancedPirQuery = async (
  params: PIRQueryRequest
): Promise<ApiResponse<PIRQueryResponse>> => {
  return request.post(`${API_PATH}/pir/advanced`, params);
};

/**
 * 获取PIR查询统计信息
 */
export const getPirStatistics = async (): Promise<ApiResponse<PIRStatisticsResponse>> => {
  return request.get(`${API_PATH}/pir/statistics`);
};

/**
 * 获取所有隐私查询历史
 */
export const getPirHistory = async (
  page: number = 1,
  perPage: number = 10,
  onlyPir: boolean = false
): Promise<ApiResponse<QueryHistoryResponse>> => {
  return request.get(`${API_PATH}/pir/history`, { 
    params: { page, per_page: perPage, only_pir: onlyPir } 
  });
};

/**
 * 获取PIR隐私设置
 */
export const getPirSettings = async (): Promise<ApiResponse<PIRSettingsResponse>> => {
  return request.get(`${API_PATH}/pir/settings`);
};

/**
 * 更新PIR隐私设置
 */
export const updatePirSettings = async (
  settings: UpdatePIRSettingsRequest
): Promise<ApiResponse<any>> => {
  console.log('正在提交的PIR设置:', settings);
  return request.put(`${API_PATH}/pir/settings`, settings);
};

/**
 * 导出健康记录
 */
export const exportHealthRecords = async (
  data: ExportRecordsRequest
): Promise<ApiResponse<ExportRecordsResponse>> => {
  return request.post(`${API_PATH}/export`, data);
};

/**
 * 获取导出文件下载链接
 */
export const getExportDownloadUrl = (filename: string): string => {
  return `${request.defaults.baseURL}${API_PATH}/export/download/${filename}`;
};

/**
 * 导入健康记录
 */
export const importHealthRecords = async (
  file: File
): Promise<ApiResponse<ImportRecordsResponse>> => {
  const formData = new FormData();
  formData.append('file', file);
  
  // 添加处理选项，指定返回记录使用字符串形式的tags
  formData.append('process_options', JSON.stringify({
    convert_tags_to_string: true
  }));
  
  return request.post(`${API_PATH}/import`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 获取健康记录导入模板
 */
export const getImportTemplate = async (
  format: 'excel' = 'excel'
): Promise<ApiResponse<ImportTemplateResponse>> => {
  return request.get(`${API_PATH}/import/template`, { 
    params: { format } 
  });
};

/**
 * 获取导入模板下载链接
 */
export const getImportTemplateUrl = (filename: string, token: string): string => {
  return `${request.defaults.baseURL}${API_PATH}/import/template/download/${filename}?token=${token}`;
};

/**
 * 批量上传健康记录
 */
export const batchUploadHealthRecords = async (
  data: BatchUploadRecordsRequest
): Promise<ApiResponse<BatchUploadResponse>> => {
  return request.post(`${API_PATH}/records/batch-upload`, data);
};

/**
 * 获取健康记录版本历史
 */
export const getRecordVersions = async (
  recordId: string
): Promise<ApiResponse<RecordVersionsResponse>> => {
  return request.get(`${API_PATH}/records/${recordId}/versions`);
};

/**
 * 创建记录新版本
 */
export const createRecordVersion = async (
  recordId: string,
  data: CreateVersionRequest
): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/records/${recordId}/versions`, data);
};

/**
 * 获取特定版本的记录
 */
export const getRecordVersion = async (
  recordId: string,
  versionNumber: number
): Promise<ApiResponse<GetVersionResponse>> => {
  return request.get(`${API_PATH}/records/${recordId}/versions/${versionNumber}`);
};

/**
 * 恢复到特定版本
 */
export const restoreRecordVersion = async (
  recordId: string,
  versionNumber: number,
  data: RestoreVersionRequest = {}
): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/records/${recordId}/versions/${versionNumber}/restore`, data);
};

/**
 * 安全删除健康记录
 */
export const secureDeleteHealthRecord = async (
  recordId: string,
  data: SecureDeleteRequest = {}
): Promise<ApiResponse<void>> => {
  return request.delete(`${API_PATH}/records/${recordId}/secure-delete`, { data });
};

/**
 * 批量更新记录可见性
 */
export const batchUpdateVisibility = async (
  data: BatchUpdateVisibilityRequest
): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/records/batch/visibility`, data);
};

/**
 * 批量更新PIR保护状态
 */
export const batchUpdatePirProtection = async (
  data: {
    record_ids: string[];
    pir_protected: boolean;
  }
): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/records/batch/pir-protection`, data);
};

/**
 * 获取可共享的用户列表
 */
export const getShareableUsers = async (
  page: number = 1,
  perPage: number = 20,
  search?: string,
  role?: string
): Promise<ApiResponse<ShareableUsersResponse>> => {
  const params: any = {
    page,
    per_page: perPage
  };
  
  if (search) {
    params.search = search;
  }
  
  if (role) {
    params.role = role;
  }
  
  return request.get(`${API_PATH}/share/users`, { params });
};

/**
 * 获取可共享用户详情
 */
export const getShareableUserDetail = async (
  userId: number
): Promise<ApiResponse<ShareableUserDetail>> => {
  return request.get(`${API_PATH}/share/users/${userId}`);
};

/**
 * 获取共享记录的直接访问链接
 */
export const getSharedRecordAccessUrl = (accessKey: string): string => {
  return `${window.location.origin}/shared/${accessKey}`;
};

/**
 * 通过访问密钥直接获取共享记录
 */
export const accessSharedRecordByKey = async (
  accessKey: string
): Promise<ApiResponse<ViewSharedRecordResponse>> => {
  return request.get(`${API_PATH}/shared/access/${accessKey}`);
};

/**
 * 获取医疗机构列表
 */
export const getInstitutions = (): Promise<ApiResponse<InstitutionsResponse>> => {
  return request.get(`${API_PATH}/institutions`);
};

/**
 * 解密健康记录
 */
export const decryptHealthRecord = async (
  recordId: string,
  encryptionKey: string
): Promise<ApiResponse<{ record: HealthRecord }>> => {
  return request.post(`${API_PATH}/records/${recordId}/decrypt`, { encryption_key: encryptionKey });
};

/**
 * 获取月度记录统计
 * @param month 月份 (可选，默认为当前月)，格式：YYYY-MM
 * @param recordType 记录类型 (可选)
 */
export const getMonthlyRecordStats = async (
  month?: string,
  recordType?: string
): Promise<ApiResponse<MonthlyRecordStatsResponse>> => {
  const params: any = {};
  
  if (month) {
    params.month = month;
  }
  
  if (recordType) {
    params.record_type = recordType;
  }
  
  return request.get(`${API_PATH}/statistics/monthly`, { params });
};

/**
 * 更新所有记录添加PIR保护字段
 */
export const updateAllRecordsPirProtectionField = async (): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/admin/update-pir-protection-field`);
}; 