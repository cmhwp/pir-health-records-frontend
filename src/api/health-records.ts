import request from '@/utils/request';
import type {
  ApiResponse,
} from '@/types/auth';
import type {
  HealthRecord,
  CreateHealthRecordRequest,
  UpdateHealthRecordRequest,
  HealthStatistics,
  PirHistoryItem,
  ShareRecordRequest,
  SharedRecord,
  AdvancedSearchRequest,
  SearchFilters,
  ExportRequest,
  PirSettings,
  MongoHealthRecord,
} from '@/types/health-records';

/**
 * 创建健康记录
 */
export const createHealthRecord = (data: CreateHealthRecordRequest): Promise<ApiResponse<HealthRecord>> => {
  return request.post('/health/records', data);
};

/**
 * 上传健康记录附件
 */
export const uploadRecordFile = (formData: FormData): Promise<ApiResponse<{ filename: string }>> => {
  return request.post('/health/files', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 获取健康记录列表
 */
export const getHealthRecords = (): Promise<ApiResponse<HealthRecord[]>> => {
  return request.get('/health/records');
};

/**
 * 获取单个健康记录详情
 */
export const getHealthRecord = (recordId: string): Promise<ApiResponse<HealthRecord>> => {
  return request.get(`/health/records/${recordId}`);
};

/**
 * 更新健康记录
 */
export const updateHealthRecord = (recordId: string, data: UpdateHealthRecordRequest): Promise<ApiResponse<HealthRecord>> => {
  return request.put(`/health/records/${recordId}`, data);
};

/**
 * 删除健康记录
 */
export const deleteHealthRecord = (recordId: string): Promise<ApiResponse> => {
  return request.delete(`/health/records/${recordId}`);
};

/**
 * 获取健康统计数据
 */
export const getHealthStatistics = (): Promise<ApiResponse<HealthStatistics>> => {
  return request.get('/health/statistics');
};

/**
 * 创建MongoDB健康记录
 */
export const createMongoHealthRecord = (data: CreateHealthRecordRequest): Promise<ApiResponse<MongoHealthRecord>> => {
  return request.post('/health/mongo/records', data);
};

/**
 * PIR查询健康记录
 */
export const pirQueryHealthRecords = (): Promise<ApiResponse<HealthRecord[]>> => {
  return request.get('/health/pir/records');
};

/**
 * 获取PIR统计数据
 */
export const getPirStatistics = (): Promise<ApiResponse<HealthStatistics>> => {
  return request.get('/health/pir/statistics');
};

/**
 * 获取MongoDB健康记录详情
 */
export const getMongoHealthRecord = (recordId: string): Promise<ApiResponse<MongoHealthRecord>> => {
  return request.get(`/health/mongo/records/${recordId}`);
};

/**
 * 获取PIR历史记录
 */
export const getPirHistory = (): Promise<ApiResponse<PirHistoryItem[]>> => {
  return request.get('/health/pir/history');
};

/**
 * 分享健康记录
 */
export const shareHealthRecord = (recordId: string, data: ShareRecordRequest): Promise<ApiResponse<SharedRecord>> => {
  return request.post(`/health/records/${recordId}/share`, data);
};

/**
 * 获取我分享的记录列表
 */
export const getRecordsSharedByMe = (): Promise<ApiResponse<SharedRecord[]>> => {
  return request.get('/health/shared/by-me');
};

/**
 * 获取分享给我的记录列表
 */
export const getRecordsSharedWithMe = (): Promise<ApiResponse<SharedRecord[]>> => {
  return request.get('/health/shared/with-me');
};

/**
 * 查看分享的记录详情
 */
export const viewSharedRecord = (sharedId: string): Promise<ApiResponse<SharedRecord>> => {
  return request.get(`/health/shared/records/${sharedId}`);
};

/**
 * 撤销分享的记录
 */
export const revokeSharedRecord = (sharedId: string): Promise<ApiResponse> => {
  return request.delete(`/health/shared/${sharedId}`);
};

/**
 * 高级搜索
 */
export const advancedSearch = (data: AdvancedSearchRequest): Promise<ApiResponse<HealthRecord[]>> => {
  return request.post('/health/search/advanced', data);
};

/**
 * 获取搜索过滤条件
 */
export const getSearchFilters = (): Promise<ApiResponse<SearchFilters>> => {
  return request.get('/health/search/filters');
};

/**
 * 导出健康记录
 */
export const exportHealthRecords = (data: ExportRequest): Promise<ApiResponse<{ filename: string }>> => {
  return request.post('/health/export', data);
};

/**
 * 下载导出的记录文件
 */
export const downloadExportedRecords = (filename: string): string => {
  return `${request.defaults.baseURL}/health/export/download/${filename}`;
};

/**
 * 导入健康记录
 */
export const importHealthRecords = (formData: FormData): Promise<ApiResponse<{ imported_count: number }>> => {
  return request.post('/health/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 高级PIR查询
 */
export const advancedPirQuery = (data: AdvancedSearchRequest): Promise<ApiResponse<HealthRecord[]>> => {
  return request.post('/health/pir/advanced', data);
};

/**
 * 获取PIR设置
 */
export const getPirSettings = (): Promise<ApiResponse<PirSettings>> => {
  return request.get('/health/pir/settings');
};

/**
 * 更新PIR设置
 */
export const updatePirSettings = (data: Partial<PirSettings>): Promise<ApiResponse<PirSettings>> => {
  return request.put('/health/pir/settings', data);
}; 