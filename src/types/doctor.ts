import type { ApiResponse } from './auth';
import type { HealthRecord, FileInfo, RecordType, RecordVisibility } from './health';

// Request interfaces
export interface CreateEncryptedRecordRequest {
  record_data: {
    title: string;
    record_type: RecordType;
    patient_id: number;
    description?: string;
    record_date?: string;
    visibility?: RecordVisibility;
    tags?: string;
    data?: any;
  };
  files?: File[];
  file_description?: string;
  encryption_key?: string;
}

export interface UpdateDoctorRecordRequest {
  record_data?: {
    title?: string;
    record_type?: RecordType;
    description?: string;
    record_date?: string;
    visibility?: RecordVisibility;
    tags?: string;
    data?: any;
  };
  encryption_key?: string;
}

export interface GetDoctorRecordsParams {
  page?: number;
  per_page?: number;
  record_type?: RecordType;
  patient_id?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: 'created_at' | 'record_date' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface DecryptRecordRequest {
  encryption_key: string;
}

export interface VerifyComplianceRequest {
  encryption_key?: string;
}

export interface PIRQueryPatientRequest {
  patient_id?: number;
  query_params?: {
    record_type?: RecordType;
    start_date?: string;
    end_date?: string;
    keyword?: string;
  };
}

// Response interfaces
export interface CreateEncryptedRecordResponse {
  record_id: string;
  sql_id: number;
}

export interface GetDoctorRecordsResponse {
  records: Array<{
    id: number;
    mongo_id: string;
    title: string;
    record_type: RecordType;
    record_date: string;
    created_at: string;
    updated_at: string;
    visibility: RecordVisibility;
    is_encrypted: boolean;
    patient_id: number;
    patient_name: string;
  }>;
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface DecryptRecordResponse {
  record: HealthRecord;
}

export interface VerifyComplianceResponse {
  verification: {
    integrity: boolean;
    has_required_fields: boolean;
    has_doctor_info: boolean;
    privacy_compliance: boolean;
    compliance: boolean;
  };
}

export interface PIRQueryPatientResponse {
  records: Array<HealthRecord>;
  total: number;
}

// Adding audit logs related interfaces
export interface AuditLog {
  id: number;
  type: 'query' | 'system_log';
  action: string;
  user_id: number;
  user_name: string | null;
  user_role: string | null;
  timestamp: string;
  is_anonymous?: boolean;
  details?: any;
}

export interface AuditLogsResponse {
  record: {
    id: number;
    mongo_id: string;
    title: string;
  };
  audit_logs: AuditLog[];
}

// 工作台数据接口
export interface DoctorDashboardResponse {
  doctor: {
    id: number;
    name: string;
    info: {
      specialty: string;
      hospital: string;
      department: string;
      years_of_experience: number;
    } | null;
  };
  statistics: {
    today_patients: number;
    total_patients: number;
    total_records: number;
  };
  recent_records: Array<{
    id: number;
    mongo_id: string;
    title: string;
    patient_id: number;
    patient_name: string;
    record_type: string;
    record_date: string | null;
    created_at: string | null;
  }>;
}

// 患者列表接口
export interface DoctorPatientsParams {
  page?: number;
  per_page?: number;
  search?: string;
  sort_by?: 'name' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface PatientInfo {
  gender?: string;
  date_of_birth?: string;
  allergies?: string;
  medical_history?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  address?: string;
}

export interface Patient {
  id: number;
  name: string;
  email: string;
  phone?: string;
  info: PatientInfo | null;
  record_count?: number;
  latest_visit?: string | null;
  created_at?: string | null;
}

export interface GetDoctorPatientsResponse {
  patients: Patient[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 患者详情接口
export interface PatientDetailsResponse {
  patient: Patient;
  record_statistics: Record<string, number>;
  recent_records: Array<{
    id: number;
    mongo_id: string;
    title: string;
    record_type: string;
    record_date: string | null;
    created_at: string | null;
  }>;
  total_records: number;
}

// 处方相关接口
export type PrescriptionStatus = 'ACTIVE' | 'COMPLETED' | 'EXPIRED' | 'REVOKED';

export interface GetPrescriptionsParams {
  page?: number;
  per_page?: number;
  patient_id?: number;
  status?: PrescriptionStatus;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PrescriptionItem {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  patient_name: string;
  diagnosis: string;
  symptoms?: string;
  instructions?: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  created_at: string;
  valid_until?: string;
  patient_info?: {
    gender?: string;
    date_of_birth?: string;
    allergies?: string;
  };
}

export interface GetPrescriptionsResponse {
  prescriptions: Prescription[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface CreatePrescriptionRequest {
  patient_id: number;
  diagnosis: string;
  instructions?: string;
  valid_days?: number;
  items: {
    medicine_name: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    notes?: string;
  }[];
}

export interface UpdatePrescriptionRequest {
  status?: PrescriptionStatus;
  diagnosis?: string;
  instructions?: string;
  valid_until?: string;
}

// 处理处方申请接口
export interface ProcessPrescriptionRequest {
  action: 'approve' | 'reject';
  reason?: string;
  diagnosis?: string;
  instructions?: string;
  valid_days?: number;
  replace_items?: boolean;
  items?: {
    id?: number;
    medicine_name: string;
    dosage: string;
    frequency?: string;
    duration?: string;
    notes?: string;
  }[];
}

// 处方申请处理响应
export interface ProcessPrescriptionResponse {
  prescription_id: number;
  status: PrescriptionStatus;
}

// 待处理处方响应
export interface PendingPrescriptionsResponse {
  prescriptions: Prescription[];
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 统计数据接口
export interface PatientStatisticsResponse {
  total_patients: number;
  record_types: Record<string, number>;
  monthly_patients: Array<{
    year: number;
    month: number;
    count: number;
  }>;
  gender_distribution: Record<string, number>;
  age_distribution: Record<string, number>;
}

export interface DiseaseStatisticsResponse {
  common_diagnoses: Record<string, number>;
  disease_trends: Array<{
    year: number;
    month: number;
    diagnoses: Record<string, number>;
  }>;
  medication_stats: Record<string, number>;
  treatment_stats: Record<string, number>;
}

export interface GetComplianceStatsResponse {
  compliance_rate: number;
  total_records: number;
  compliant_records: number;
  non_compliant_records: number;
  compliance_by_type: Record<string, {
    total: number;
    compliant: number;
    rate: number;
  }>;
  recent_non_compliant: Array<{
    id: number;
    title: string;
    record_type: string;
    created_at: string;
    issues: string[];
  }>;
} 