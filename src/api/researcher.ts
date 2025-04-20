import request from '@/utils/request';
import type { ApiResponse } from '@/types/auth';
import type {
  ResearcherDashboardResponse,
  ProjectStatusesResponse,
  GetResearcherRecordsParams,
  GetResearcherRecordsResponse,
  RecordTypeStatisticsResponse,
  TimeDistributionParams,
  TimeDistributionResponse,
  ResearchProject,
  CreateResearchProjectRequest,
  UpdateResearchProjectRequest,
  AddTeamMemberRequest,
  ProjectTeamMember,
  BatchPIRQueryRequest,
  BatchPIRQueryResponse,
  AggregateHealthStatsRequest,
  AggregateHealthStatsResponse,
  ProjectStatisticsResponse,
  GenerateMockDataRequest,
  GenerateMockDataResponse,
  ConfigureProtocolRequest,
  ConfigureProtocolResponse,
  ExecuteQueryRequest,
  ExecuteQueryResponse,
  PerformanceMetricsResponse,
  CompareProtocolsRequest,
  CompareProtocolsResponse,
  ExperimentsListResponse,
  ExperimentDetailResponse
} from '@/types/researcher';
import type { HealthRecord } from '@/types/health';

const API_PATH = '/researcher';

/**
 * 获取研究员控制台数据
 */
export const getResearcherDashboard = async (): Promise<ApiResponse<ResearcherDashboardResponse>> => {
  return request.get(`${API_PATH}/dashboard`);
};

/**
 * 获取项目状态列表
 */
export const getProjectStatuses = async (): Promise<ApiResponse<ProjectStatusesResponse>> => {
  return request.get(`${API_PATH}/project-statuses`);
};

/**
 * 获取可访问的健康记录列表
 */
export const getAccessibleRecords = async (
  params?: GetResearcherRecordsParams
): Promise<ApiResponse<GetResearcherRecordsResponse>> => {
  return request.get(`${API_PATH}/records`, { params });
};

/**
 * 获取健康记录详情
 */
export const getRecordDetails = async (
  recordId: string | number
): Promise<ApiResponse<HealthRecord>> => {
  return request.get(`${API_PATH}/records/${recordId}`);
};

/**
 * 导出匿名化的健康记录数据
 */
export const exportAnonymizedRecords = async (): Promise<Blob> => {
  return request.get(`${API_PATH}/export/records`, {
    responseType: 'blob'
  });
};

/**
 * 获取记录类型统计
 */
export const getRecordTypeStatistics = async (): Promise<ApiResponse<RecordTypeStatisticsResponse>> => {
  return request.get(`${API_PATH}/statistics/record-types`);
};

/**
 * 获取时间分布统计
 */
export const getTimeDistribution = async (
  params?: TimeDistributionParams
): Promise<ApiResponse<TimeDistributionResponse>> => {
  return request.get(`${API_PATH}/statistics/time-distribution`, { params });
};

/**
 * 获取研究项目列表
 */
export const getResearchProjects = async (): Promise<ApiResponse<ResearchProject[]>> => {
  return request.get(`${API_PATH}/studies`);
};

/**
 * 创建研究项目
 */
export const createResearchProject = async (
  data: CreateResearchProjectRequest
): Promise<ApiResponse<ResearchProject>> => {
  return request.post(`${API_PATH}/studies`, data);
};

/**
 * 更新研究项目
 */
export const updateResearchProject = async (
  studyId: number,
  data: UpdateResearchProjectRequest
): Promise<ApiResponse<ResearchProject>> => {
  return request.put(`${API_PATH}/studies/${studyId}`, data);
};

/**
 * 删除研究项目
 */
export const deleteResearchProject = async (
  studyId: number
): Promise<ApiResponse> => {
  return request.delete(`${API_PATH}/studies/${studyId}`);
};

/**
 * 获取研究项目详情
 */
export const getResearchProjectDetails = async (
  studyId: number
): Promise<ApiResponse<ResearchProject>> => {
  return request.get(`${API_PATH}/studies/${studyId}`);
};

/**
 * 添加研究项目团队成员
 */
export const addTeamMember = async (
  studyId: number,
  data: AddTeamMemberRequest
): Promise<ApiResponse<ProjectTeamMember>> => {
  return request.post(`${API_PATH}/studies/${studyId}/team-members`, data);
};

/**
 * 删除研究项目团队成员
 */
export const deleteTeamMember = async (
  studyId: number,
  memberId: number
): Promise<ApiResponse> => {
  return request.delete(`${API_PATH}/studies/${studyId}/team-members/${memberId}`);
};

/**
 * 批量PIR查询
 */
export const batchPIRQuery = async (
  data: BatchPIRQueryRequest
): Promise<ApiResponse<BatchPIRQueryResponse>> => {
  return request.post(`${API_PATH}/pir/batch-query`, data);
};

/**
 * 健康数据聚合统计
 */
export const aggregateHealthStats = async (
  data: AggregateHealthStatsRequest
): Promise<ApiResponse<AggregateHealthStatsResponse>> => {
  return request.post(`${API_PATH}/stats/aggregate`, data);
};

/**
 * 获取项目统计信息
 */
export const getProjectStatistics = async (): Promise<ApiResponse<ProjectStatisticsResponse>> => {
  return request.get(`${API_PATH}/statistics/projects`);
};

/**
 * 获取PIR查询匹配的记录详情
 */
export const getPIRRecordDetail = async (
  recordId: string
): Promise<ApiResponse<any>> => {
  return request.get(`${API_PATH}/pir/record/${recordId}`);
};

/**
 * 解密PIR查询结果
 */
export const decryptPIRResult = async (
  encryptedResult: string,
  recordId?: string,
  decryptKey?: string
): Promise<ApiResponse<any>> => {
  return request.post(`${API_PATH}/pir/decrypt`, {
    encrypted_result: encryptedResult,
    record_id: recordId,
    decrypt_key: decryptKey
  });
};

/**
 * 获取PIR记录解密密钥
 */
export const getPIRDecryptKey = async (
  recordId: string
): Promise<ApiResponse<any>> => {
  return request.get(`${API_PATH}/pir/decrypt-key/${recordId}`);
};

/**
 * 生成模拟健康数据
 */
export const generateMockData = async (
  data: GenerateMockDataRequest
): Promise<ApiResponse<GenerateMockDataResponse>> => {
  return request.post(`${API_PATH}/experiment/generate-mock-data`, data);
};

/**
 * 配置PIR协议参数
 */
export const configureProtocol = async (
  data: ConfigureProtocolRequest
): Promise<ApiResponse<ConfigureProtocolResponse>> => {
  return request.post(`${API_PATH}/experiment/configure-protocol`, data);
};

/**
 * 执行隐私查询测试
 */
export const executeQueryExperiment = async (
  data: ExecuteQueryRequest
): Promise<ApiResponse<ExecuteQueryResponse>> => {
  return request.post(`${API_PATH}/experiment/execute-query`, data);
};

/**
 * 获取性能指标
 */
export const getPerformanceMetrics = async (
  experimentId: string
): Promise<ApiResponse<PerformanceMetricsResponse>> => {
  return request.get(`${API_PATH}/experiment/performance-metrics`, {
    params: { experiment_id: experimentId }
  });
};

/**
 * 比较多个协议性能
 */
export const compareProtocols = async (
  data: CompareProtocolsRequest
): Promise<ApiResponse<CompareProtocolsResponse>> => {
  return request.post(`${API_PATH}/experiment/compare-protocols`, data);
};

/**
 * 获取实验列表
 */
export const getExperiments = async (): Promise<ApiResponse<ExperimentsListResponse>> => {
  return request.get(`${API_PATH}/experiments`);
};

/**
 * 获取实验详情
 */
export const getExperimentDetails = async (
  experimentId: string
): Promise<ApiResponse<ExperimentDetailResponse>> => {
  return request.get(`${API_PATH}/experiments/${experimentId}`);
};

/**
 * 删除实验
 */
export const deleteExperiment = async (
  experimentId: string
): Promise<ApiResponse<{ experiment_id: string }>> => {
  return request.delete(`${API_PATH}/experiments/${experimentId}`);
}; 