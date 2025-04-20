import type { ApiResponse } from './auth';

// 记录类型别名
export type RecordType = string;

export interface RecordTypeInfo {
  id: number;
  code: string;
  name: string;
  color?: string;
  icon?: string;
}

export enum RecordVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  DOCTOR = 'doctor',
  RESEARCHER = 'researcher'
}

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit',
  FULL = 'full'
}

export interface FileInfo {
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description?: string;
  uploaded_at: string;
}

export interface MedicationInfo {
  medication_name: string;
  dosage?: string;
  frequency?: string;
  start_date?: string;
  end_date?: string;
  instructions?: string;
  side_effects?: string;
}

export interface VitalSign {
  type: string;
  value: number;
  unit: string;
  measured_at: string;
}

export interface VersionInfo {
  version: number;
  created_at: string;
  created_by: number;
  description: string;
  changes?: string[];
  restored_from?: number;
}

export interface HealthRecord {
  _id: string;
  title: string;
  record_type: string;
  description?: string;
  record_date: string;
  institution?: string;
  doctor_name?: string;
  patient_id: number;
  visibility: RecordVisibility;
  tags?: string;
  files?: FileInfo[];
  medication?: MedicationInfo;
  vital_signs?: VitalSign[];
  data?: any;
  created_at: string;
  updated_at: string;
  version: number;
  version_history?: VersionInfo[];
  is_encrypted?: boolean;
  requires_decryption?: boolean;
  encryption_date?: string;
  integrity_hash?: string;
  pir_protected?: boolean;
}

// Request/Response interfaces

export interface CreateRecordRequest {
  record_data: {
    title: string;
    record_type: string;
    description?: string;
    record_date?: string;
    institution?: string;
    doctor_name?: string;
    doctor_id?: number;
    visibility?: RecordVisibility;
    tags?: string;
    medication?: MedicationInfo;
    vital_signs?: VitalSign[];
    data?: any;
  };
  files?: File[];
  file_description?: string;
  encryption_key?: string;
  pir_protected?: boolean;
}

export interface CreateRecordResponse {
  record_id: string;
  sql_id: number;
  storage_type: string;
}

export interface UpdateRecordRequest {
  title?: string;
  description?: string;
  institution?: string;
  doctor_name?: string;
  visibility?: RecordVisibility;
  tags?: string;
  record_date?: string;
  data?: any;
  medication?: MedicationInfo;
}

export interface GetRecordsParams {
  page?: number;
  per_page?: number;
  record_type?: string;
  start_date?: string;
  end_date?: string;
  keyword?: string;
  anonymous?: boolean;
}

export interface GetRecordsResponse {
  records: HealthRecord[];
  total: number;
  pages: number;
  current_page: number;
  metadata?: {
    pir_enabled: boolean;
    records_processed?: number;
    obfuscation_level?: string;
  };
}

export interface SearchFilter {
  institutions: string[];
  record_types: string[];
  doctor_names: string[];
  tags: string[];
  date_range: {
    min: string | null;
    max: string | null;
  };
}

export interface AdvancedSearchRequest {
  page?: number;
  per_page?: number;
  date_range?: {
    start_date?: string;
    end_date?: string;
  };
  record_types?: string[];
  institutions?: string[];
  tags?: string;
  keywords?: string;
  sort?: {
    field: 'record_date' | 'created_at' | 'title';
    order: 'asc' | 'desc';
  };
}

export interface AdvancedSearchResponse {
  records: HealthRecord[];
  total: number;
  pages: number;
  current_page: number;
  filter_options: SearchFilter;
}

export interface ShareRecordRequest {
  share_with_id: number;
  permission?: SharePermission;
  expiry_days?: number;
}

export interface SharedRecordInfo {
  shared_id: number;
  record_id: number;
  mongo_id?: string;
  permission: string;
  created_at: string;
  expires_at: string | null;
  is_valid: boolean;
  access_count: number;
  last_accessed: string | null;
  access_key?: string;
  record_info: {
    title: string | null;
    record_type: string | null;
    record_date: string | null;
  };
}

export interface SharedRecordWithOwner extends SharedRecordInfo {
  owner: {
    id: number | null;
    username: string | null;
    full_name: string | null;
  };
}

export interface SharedRecordWithUser extends SharedRecordInfo {
  shared_with: {
    id: number | null;
    username: string | null;
    full_name: string | null;
  };
}

export interface SharedRecordsResponse {
  shared_records: SharedRecordWithUser[] | SharedRecordWithOwner[];
  total: number;
  pages: number;
  current_page: number;
}

export interface ViewSharedRecordResponse {
  shared_info: {
    id: number;
    permission: string;
    created_at: string | null;
    expires_at: string | null;
    is_valid: boolean;
    access_count: number;
    last_accessed: string | null;
    owner: {
      id: number | null;
      username: string | null;
      full_name: string | null;
    };
    shared_with: {
      id: number | null;
      username: string | null;
      full_name: string | null;
    };
  };
  sharing_info?: {
    id: number;
    permission: string;
    created_at: string | null;
    expires_at: string | null;
    is_valid: boolean;
    access_count: number;
    last_accessed: string | null;
    owner: {
      id: number | null;
      username: string | null;
      full_name: string | null;
    };
    shared_with: {
      id: number | null;
      username: string | null;
      full_name: string | null;
    };
  };
  record: HealthRecord;
  sql_id: number;
}

export interface ExportRecordsRequest {
  record_ids?: string[];
  export_all?: boolean;
  format?: 'json' | 'csv';
}

export interface ExportRecordsResponse {
  export_format: string;
  filename: string;
  record_count: number;
  download_url: string;
}

export interface ImportRecordsResponse {
  imported_records: {
    id: string;
    title: string;
    record_type: string;
  }[];
  count: number;
}

export interface ImportTemplateResponse {
  filename: string;
  format: string; 
  download_url: string;
}

export interface BatchUploadRecordsRequest {
  records: {
    title: string;
    record_type: string;
    description?: string;
    record_date?: string;
    institution?: string;
    doctor_name?: string;
    visibility?: RecordVisibility;
    tags?: string;
    medication?: MedicationInfo;
    vital_signs?: VitalSign[];
    data?: any;
  }[];
}

export interface BatchUploadResponse {
  uploaded_records: {
    record_id: string;
    title: string;
    record_type: string;
  }[];
  total_uploaded: number;
  total_requested: number;
}

export interface RecordVersionsResponse {
  record_id: string;
  sql_id: number | null;
  current_version: number;
  title: string;
  versions: {
    version: number;
    created_at: string;
    description: string;
    creator: {
      id: number | null;
      username: string | null;
    } | null;
    changes: string[];
  }[];
}

export interface CreateVersionRequest {
  description?: string;
  changes?: string[];
  data?: {
    title?: string;
    description?: string;
    institution?: string;
    doctor_name?: string;
    visibility?: RecordVisibility;
    tags?: string;
    record_date?: string;
    data?: any;
    medication?: MedicationInfo;
  };
}

export interface GetVersionResponse {
  record: HealthRecord;
  version: number;
  version_info: VersionInfo;
  is_current: boolean;
  current_version: number;
}

export interface RestoreVersionRequest {
  description?: string;
}

export interface PIRQueryRequest {
  record_type?: string;
  start_date?: string;
  end_date?: string;
  keyword?: string;
}

export interface PIRQueryResponse {
  records: HealthRecord[];
  metadata: {
    pir_enabled: boolean;
    records_processed: number;
    matches_found?: number;
    noise_queries?: number;
    obfuscation_level: string;
    query_vector_size?: number;
  };
}

export interface PIRStatisticsResponse {
  total_queries: number;
  standard_queries: number;
  pir_queries: number;
  privacy_protection_ratio: number;
  query_types: Record<string, number>;
  monthly_stats: Record<string, number>;
}

export interface PIRSettings {
  pir_enabled: boolean;
  max_noise_queries: number;
  encryption_strength: 'low' | 'medium' | 'high';
}

export interface PIRSettingsResponse {
  settings: PIRSettings;
  statistics: {
    total_queries: number;
    pir_queries: number;
    pir_usage_ratio: number;
    privacy_score: number;
  };
  recommendations: {
    use_pir: boolean;
    increase_noise: boolean;
    increase_encryption: boolean;
  };
}

export interface UpdatePIRSettingsRequest {
  pir_enabled?: boolean;
  max_noise_queries?: number;
  encryption_strength?: 'low' | 'medium' | 'high';
}

export interface QueryHistoryItem {
  _id: string;
  user_id: number;
  record_id?: string;
  query_type: string;
  is_anonymous: boolean;
  query_params: any;
  query_time: string;
}

export interface QueryHistoryResponse {
  history: QueryHistoryItem[];
  total: number;
  pages: number;
  current_page: number;
}

export interface SecureDeleteRequest {
  reason?: string;
  create_backup?: boolean;
}

export interface HealthStatisticsResponse {
  record_types: Record<string, number>;
  time_stats: Array<{
    date?: string;
    year?: number;
    month?: number;
    count: number;
  }>;
  vital_signs: Record<string, {
    values: number[];
    dates: string[];
    unit: string;
  }>;
  medications: Record<string, number>;
  doctor_stats: Array<{
    id: number;
    name: string;
    count: number;
    hospital?: string;
    department?: string;
    specialty?: string;
  }>;
  prescription_stats: Record<string, number>;
  appointment_stats: Record<string, number>;
  total_records: number;
  total_doctors: number;
}

export interface BatchUpdateVisibilityRequest {
  record_ids: string[];
  visibility: RecordVisibility;
}

// 可共享用户接口
export interface ShareableUser {
  id: number;
  username: string;
  full_name: string;
  email: string;
  avatar?: string;
  role: string;
  doctor_info?: {
    specialty?: string;
    hospital?: string;
    department?: string;
    years_of_experience?: number;
    bio?: string;
  };
  patient_info?: {
    gender?: string;
    address?: string;
  };
  shared_records_count: number;
}

export interface ShareableUserDetail extends ShareableUser {
  created_at?: string;
  shared_records: Array<{
    share_id: number;
    record_id: string;
    title: string;
    record_type: string;
    permission: string;
    created_at?: string;
  }>;
}

export interface ShareableUsersResponse {
  users: ShareableUser[];
  role_stats: Record<string, number>;
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface RecordTypesResponse {
  record_types: RecordTypeInfo[];
}

export interface InstitutionInfo {
  id: number;
  name: string;
  address?: string;
  type?: string;
  phone?: string;
  website?: string;
  description?: string;
}

export interface InstitutionsResponse {
  institutions: InstitutionInfo[];
}

// 月度记录统计响应
export interface MonthlyRecordStatsResponse {
  // 当月新增记录数
  current_month_count: number;
  // 按月统计数据，格式为 yyyy-MM: count
  monthly_counts: Record<string, number>;
  // 按记录类型统计当月数据
  type_counts: Record<string, number>;
  // 同比上月增长率
  month_over_month_growth: number; 
  // 同比去年增长率（可选）
  year_over_year_growth?: number;
}