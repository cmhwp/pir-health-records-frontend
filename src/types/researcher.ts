import type { ApiResponse } from './auth';
import type { HealthRecord, RecordVisibility } from './health';

// 研究人员基本信息
export interface ResearcherInfo {
  id: number;
  name: string;
  institution: string | null;
  department: string | null;
  research_area: string | null;
}

// 项目状态枚举
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SUSPENDED = 'suspended',
  CANCELLED = 'cancelled'
}

// 研究项目类型
export interface ResearchProject {
  id: number;
  title: string;
  description: string;
  status: ProjectStatus | string;
  start_date: string;
  end_date: string;
  participants: number;
  researcher_id: number;
  created_at: string;
  updated_at?: string;
  team_members?: ProjectTeamMember[];
  progress?: Record<string, string>;
}

// 项目团队成员
export interface ProjectTeamMember {
  id: number;
  name: string;
  role: string;
  project_id: number;
  created_at: string;
}

// 研究员控制台响应
export interface ResearcherDashboardResponse {
  researcher: {
    id: number;
    name: string;
    institution: string | null;
    department: string | null;
    research_area: string | null;
  };
  statistics: {
    accessible_records: number;
    recent_queries: number;
    total_projects: number;
    active_projects: number;
  };
  recent_projects: ResearchProject[];
}

// 项目状态响应
export interface ProjectStatusesResponse {
  statuses: Array<{
    key: string;
    value: string;
  }>;
}

// 获取记录列表参数
export interface GetResearcherRecordsParams {
  page?: number;
  per_page?: number;
  record_type?: string;
  keyword?: string;
}

// 健康记录扩展信息 (不使用扩展接口以避免类型不兼容问题)
export interface ResearcherAccessibleRecord {
  id: number;
  mongo_id: string;
  title: string;
  record_type: string;
  patient_id: number;
  doctor_id: number | null;
  created_at: string;
  updated_at?: string | null;
  visibility: string;
  is_encrypted: boolean;
  description?: string | null;
  doctor_name?: string | null;
  patient_name?: string | null;
  tags?: string | string[];
  institution?: string | null;

  _id?: string;
  files?: any[];
  data?: any;
}

// 记录列表响应
export interface GetResearcherRecordsResponse {
  records: ResearcherAccessibleRecord[];
  total: number;
  pages: number;
  current_page: number;
}

// 记录类型统计响应
export interface RecordTypeStatisticsResponse {
  stats: Array<{
    record_type: string;
    count: number;
  }>;
}

// 时间分布统计参数
export interface TimeDistributionParams {
  interval?: 'day' | 'week' | 'month';
  limit?: number;
}

// 时间分布统计响应
export interface TimeDistributionResponse {
  interval: string;
  stats: Array<{
    time_period: string;
    count: number;
  }>;
}

// 创建研究项目请求
export interface CreateResearchProjectRequest {
  title: string;
  description: string;
  status?: string;
  start_date: string;
  end_date: string;
  participants?: number;
}

// 更新研究项目请求
export interface UpdateResearchProjectRequest {
  title?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  participants?: number;
}

// 添加团队成员请求
export interface AddTeamMemberRequest {
  name: string;
  role: string;
}

// PIR批量查询请求
export interface BatchPIRQueryRequest {
  encrypted_query_ids: string[];
  pir_protocol?: string;
}

// PIR批量查询响应
export interface BatchPIRQueryResponse {
  results: Array<{
    encrypted_result: string;
    protocol: string;
    matched_record_id?: string;
    error?: string;
    metadata: {
      timestamp: string;
      query_id: number;
    };
  }>;
  protocol: string;
  total_queries: number;
}

// 健康数据聚合统计请求
export interface AggregateHealthStatsRequest {
  dimension: 'disease' | 'age_group' | 'gender' | 'region' | 'medication';
  sub_dimension?: 'disease' | 'age_group' | 'gender' | 'record_type' | 'time_period' | 'medication' | 'doctor_department';
  metric?: string;
  min_count?: number;
  filters?: {
    record_type?: string;
    date_range?: {
      start?: string;
      end?: string;
    };
  };
}

// 子分组统计数据
export interface SubGroupStatItem {
  name: string;
  count: number;
  percentage: number;
}

// 疾病统计数据项
export interface DiseaseStatItem {
  disease: string;
  count: number;
  metric?: string;
  mean?: number;
  std?: number;
  confidence_interval?: [number, number];
  sub_groups?: SubGroupStatItem[];
}

// 年龄组统计数据项
export interface AgeGroupStatItem {
  age_group: string;
  count: number;
  sub_groups?: SubGroupStatItem[];
}

// 性别统计数据项
export interface GenderStatItem {
  gender: string;
  count: number;
  sub_groups?: SubGroupStatItem[];
}

// 地区统计数据项
export interface RegionStatItem {
  region: string;
  count: number;
  sub_groups?: SubGroupStatItem[];
}

// 药物统计数据项
export interface MedicationStatItem {
  medication: string;
  count: number;
  sub_groups?: SubGroupStatItem[];
}

// 按疾病聚合统计响应
export interface DiseaseAggregateResponse {
  dimension: 'disease';
  total_records: number;
  total_diseases: number;
  data: DiseaseStatItem[];
}

// 按年龄组聚合统计响应
export interface AgeGroupAggregateResponse {
  dimension: 'age_group';
  total_records: number;
  total_groups: number;
  data: AgeGroupStatItem[];
}

// 按性别聚合统计响应
export interface GenderAggregateResponse {
  dimension: 'gender';
  total_records: number;
  total_groups: number;
  data: GenderStatItem[];
}

// 按地区聚合统计响应
export interface RegionAggregateResponse {
  dimension: 'region';
  total_records: number;
  total_groups: number;
  data: RegionStatItem[];
}

// 按药物聚合统计响应
export interface MedicationAggregateResponse {
  dimension: 'medication';
  total_records: number;
  total_medications: number;
  data: MedicationStatItem[];
}

// 健康数据聚合统计通用响应
export type AggregateHealthStatsResponse = 
  | DiseaseAggregateResponse 
  | AgeGroupAggregateResponse 
  | GenderAggregateResponse 
  | RegionAggregateResponse 
  | MedicationAggregateResponse
  | {
      dimension: string;
      message: string;
      count: number;
      data: [];
    };

// 项目统计信息响应
export interface ProjectStatisticsResponse {
  total_projects: number;
  status_distribution: Record<string, number>;
  recent_projects: number;
  ending_soon: number;
  total_participants: number;
  monthly_trend: Array<{
    month: string;
    count: number;
  }>;
}

// PIR协议类型枚举
export enum PIRProtocolType {
  BASIC = 'basic',
  HOMOMORPHIC = 'homomorphic',
  HYBRID = 'hybrid',
  ONION = 'onion'
}

// PIR性能指标枚举
export enum PIRPerformanceMetric {
  QUERY_TIME = 'query_time',
  ACCURACY = 'accuracy',
  COMM_COST = 'comm_cost',
  SERVER_LOAD = 'server_load',
  CLIENT_LOAD = 'client_load',
  PRIVACY_LEVEL = 'privacy_level'
}

// 生成模拟数据请求参数
export interface GenerateMockDataRequest {
  count?: number;
  structured?: boolean;
  record_types?: string[];
}

// 生成模拟数据响应
export interface GenerateMockDataResponse {
  experiment_id: string;
  data_count: number;
  sample: {
    encrypted: Array<{
      _id: string;
      patient_id: number;
      doctor_id: number;
      record_type: string;
      is_encrypted: boolean;
      encrypted_data: {
        ciphertext: string;
        iv: string;
        tag: string;
        aad: string;
      };
      key_salt: string;
      encryption_algorithm: string;
      encryption_date: string;
      integrity_hash: string;
    }>;
    plaintext: Array<{
      _id: string;
      patient_id: number;
      doctor_id: number;
      record_type: string;
      title: string;
      description: string;
      [key: string]: any;
      is_encrypted: boolean;
    }>;
  };
}

// 配置协议请求参数
export interface ConfigureProtocolRequest {
  experiment_id: string;
  protocol_type: PIRProtocolType;
  params?: Record<string, any>;
}

// 配置协议响应
export interface ConfigureProtocolResponse {
  experiment_id: string;
  protocol_type: PIRProtocolType;
  protocol_config: Record<string, any>;
}

// 执行查询请求参数
export interface ExecuteQueryRequest {
  experiment_id: string;
  query_count?: number;
}

// 执行查询响应
export interface ExecuteQueryResponse {
  experiment_id: string;
  query_count: number;
  results: {
    results: any[];
    metrics: Record<string, any>;
    protocol: Record<string, any>;
  };
}

// 性能指标响应
export interface PerformanceMetricsResponse {
  experiment_id: string;
  protocol: Record<string, any>;
  metrics: Record<PIRPerformanceMetric | string, any>;
  timestamp: string;
}

// 比较协议请求参数
export interface CompareProtocolsRequest {
  experiment_ids: string[];
}

// 协议比较项
export interface ProtocolComparison {
  experiment_id: string;
  protocol_type: PIRProtocolType;
  metrics: Record<string, any>;
  timestamp?: string;
}

// 比较报告项
export interface ComparisonReport {
  baseline: {
    experiment_id: string;
    protocol_type: PIRProtocolType;
  };
  current: {
    experiment_id: string;
    protocol_type: PIRProtocolType;
  };
  report: {
    summary: Record<string, any>;
    comparisons: Record<string, any>;
    recommendations: string[];
  };
}

// 比较协议响应
export interface CompareProtocolsResponse {
  protocols: ProtocolComparison[];
  comparisons: ComparisonReport[];
}

// 实验列表项
export interface ExperimentListItem {
  id: string;
  experiment_type: string;
  created_at: string;
  updated_at?: string;
  data_count: number;
  protocol_type?: PIRProtocolType;
  has_results: boolean;
  query_time?: string;
  metrics_summary?: {
    query_time?: number;
    privacy_level?: number;
  };
}

// 实验列表响应
export interface ExperimentsListResponse {
  experiments: ExperimentListItem[];
}

// 实验查询样本结果项
export interface ExperimentSampleResult {
  target_index: number;
  result: number[];
  original_data: {
    _id: { $oid: string };
    patient_id: number;
    is_encrypted: boolean;
    [key: string]: any;
  };
  query_time: number;
  comm_cost: number;
  accuracy: number;
  privacy_level: number;
  needs_decrypt?: boolean;
  result_index: number;
  decrypt_api?: string;
}

// 实验详情响应
export interface ExperimentDetailResponse {
  id: string;
  experiment_type: string;
  created_at: string;
  updated_at?: string;
  parameters: Record<string, any>;
  data_count: number;
  protocol_config?: Record<string, any>;
  query_time?: string;
  results?: {
    metrics: Record<string, any>;
    sample_results: ExperimentSampleResult[];
  };
  data_samples?: any[] | {
    encrypted: Array<{
      _id: string;
      patient_id: number;
      doctor_id: number;
      record_type: string;
      is_encrypted: boolean;
      encrypted_data: {
        ciphertext: string;
        iv: string;
        tag: string;
        aad: string;
      };
      key_salt: string;
      encryption_algorithm: string;
      encryption_date: string;
      integrity_hash: string;
    }>;
    plaintext: Array<{
      _id: string;
      patient_id: number;
      doctor_id: number;
      record_type: string;
      title: string;
      description: string;
      [key: string]: any;
      is_encrypted: boolean;
    }>;
  };
  plaintext_samples?: Array<{
    _id: string;
    patient_id: number;
    doctor_id: number;
    record_type: string;
    title: string;
    description: string;
    [key: string]: any;
    is_encrypted: boolean;
  }>;
  data_comparison?: {
    encrypted_example: any;
    plaintext_example: any;
    explanation: string;
  };
  protocol_explanation?: {
    protocol_type: PIRProtocolType;
    description: string;
    parameter_descriptions: Record<string, string>;
  };
}

// 解密实验查询结果请求
export interface DecryptExperimentResultRequest {
  experiment_id: string;
  result_index: number;
  encrypted_data: number[];
}

// 解密实验查询结果响应
export interface DecryptExperimentResultResponse {
  decrypted_data: number[];
  original_data: {
    target_index: number;
    result: number[];
    query_time: number;
    original_data: {
      _id: { $oid: string };
      patient_id: number;
      is_encrypted: boolean;
      [key: string]: any;
    };
  };
  plaintext_data: {
    _id: { $oid: string };
    patient_id: number;
    doctor_id: number;
    record_type: string;
    [key: string]: any;
  };
  protocol_type: PIRProtocolType;
}

// 解密结构化健康记录请求
export interface DecryptStructuredRecordRequest {
  encrypted_record: {
    encrypted_data: {
      ciphertext: string;
      iv: string;
      tag: string;
      aad: string;
    };
    key_salt: string;
    encryption_algorithm: string;
    integrity_hash?: string;
    [key: string]: any;
  };
  decryption_key?: string;
}

// 解密结构化健康记录响应
export interface DecryptStructuredRecordResponse {
  decrypted_record: {
    [key: string]: any;
  };
  metadata: {
    decryption_time?: number;
    algorithm?: string;
    [key: string]: any;
  };
} 

