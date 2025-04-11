import type { ApiResponse } from './auth';

export interface HealthRecord {
  id: string;
  patient_id: number;
  record_type: string;
  title: string;
  description: string;
  date: string;
  doctor_name?: string;
  hospital?: string;
  department?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  notes?: string;
  attachments?: string[];
  tags?: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface MongoHealthRecord {
  _id: string;
  patient_id: number;
  record_type: string;
  title: string;
  description: string;
  date: string;
  doctor_name?: string;
  hospital?: string;
  department?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  notes?: string;
  attachments?: string[];
  tags?: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateHealthRecordRequest {
  record_type: string;
  title: string;
  description: string;
  date: string;
  doctor_name?: string;
  hospital?: string;
  department?: string;
  diagnosis?: string;
  treatment?: string;
  medication?: string;
  notes?: string;
  is_private: boolean;
  tags?: string[];
}

export interface UpdateHealthRecordRequest extends Partial<CreateHealthRecordRequest> {}

export interface RecordFileUploadResponse {
  filename: string;
  filepath: string;
}

export interface HealthStatistics {
  total_records: number;
  record_types: { [key: string]: number };
  records_by_month: { [key: string]: number };
  private_vs_public: { private: number; public: number };
  tags_frequency: { [key: string]: number };
}

export interface PirHistoryItem {
  id: string;
  query_type: string;
  timestamp: string;
  parameters: any;
  result_count: number;
}

export interface ShareRecordRequest {
  recipient_id: number;
  expiry_date?: string;
  can_download?: boolean;
  message?: string;
}

export interface SharedRecord {
  id: string;
  record_id: string;
  shared_by: number;
  shared_with: number;
  created_at: string;
  expires_at?: string;
  can_download: boolean;
  message?: string;
  record?: HealthRecord;
  shared_by_name?: string;
  shared_with_name?: string;
}

export interface AdvancedSearchRequest {
  query: string;
  date_from?: string;
  date_to?: string;
  record_types?: string[];
  hospitals?: string[];
  departments?: string[];
  tags?: string[];
  include_shared?: boolean;
}

export interface SearchFilters {
  record_types: string[];
  hospitals: string[];
  departments: string[];
  tags: string[];
}

export interface ExportRequest {
  record_ids: string[];
  format: 'json' | 'csv' | 'pdf';
}

export interface PirSettings {
  enabled: boolean;
  use_homomorphic_encryption: boolean;
  use_secure_multiparty_computation: boolean;
  use_differential_privacy: boolean;
  privacy_budget: number;
} 