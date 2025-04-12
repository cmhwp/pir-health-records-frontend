import type { ApiResponse } from './auth';

export enum RecordType {
  GENERAL = 'general',
  LABORATORY = 'laboratory',
  MEDICATION = 'medication',
  IMAGING = 'imaging',
  VITAL_SIGNS = 'vital_signs',
  SURGERY = 'surgery',
  VACCINATION = 'vaccination',
  ALLERGY = 'allergy',
  DIAGNOSIS = 'diagnosis',
  OTHER = 'other'
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
  record_type: RecordType;
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
}

// Request/Response interfaces

export interface CreateRecordRequest {
  record_data: {
    title: string;
    record_type: RecordType;
    description?: string;
    record_date?: string;
    institution?: string;
    doctor_name?: string;
    visibility?: RecordVisibility;
    tags?: string;
    medication?: MedicationInfo;
    vital_signs?: VitalSign[];
    data?: any;
  };
  files?: File[];
  file_description?: string;
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
  record_type?: RecordType;
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
  tags?: string[];
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
  shared_with: number;
  permission?: SharePermission;
  expires_days?: number;
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

export interface BatchUploadRecordsRequest {
  records: {
    title: string;
    record_type: RecordType;
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
  monthly_records: Record<string, number>;
  vital_signs: Record<string, {
    values: number[];
    dates: string[];
    unit: string;
  }>;
  medications: Record<string, number>;
}

export interface BatchUpdateVisibilityRequest {
  record_ids: string[];
  visibility: RecordVisibility;
} 