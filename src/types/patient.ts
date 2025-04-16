export enum PrescriptionStatus {
  PENDING = 'PENDING', // 待确认/处理 
  ACTIVE = 'ACTIVE', // 已激活/有效
  COMPLETED = 'COMPLETED', // 已完成/已使用
  EXPIRED = 'EXPIRED', // 已过期
  REVOKED = 'REVOKED' // 已撤销/拒绝
}

export interface DoctorInfo {
  hospital?: string;
  department?: string;
  specialty?: string;
  years_of_experience?: number;
  bio?: string;
}

export interface PrescriptionItem {
  id: number;
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface PrescriptionInfo {
  id: number;
  doctor_id: number;
  doctor_name: string;
  symptoms?: string;
  diagnosis: string;
  instructions: string;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  created_at: string;
  valid_until: string;
  doctor_info?: DoctorInfo;
}

export interface Doctor {
  id: number;
  username: string;
  full_name: string;
  avatar?: string;
  info?: DoctorInfo;
  interaction?: {
    record_count: number;
    has_interaction: boolean;
    has_prescription?: boolean;
  };
}

export interface FilterOptions {
  hospitals: Record<string, number>;
  departments: Record<string, number>;
  specialties: Record<string, number>;
}

export interface PrescriptionsResponse {
  prescriptions: PrescriptionInfo[];
  status_counts: Record<string, number>;
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface DoctorsResponse {
  doctors: Doctor[];
  filters: FilterOptions;
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface DoctorPrescriptionsResponse {
  prescriptions: PrescriptionInfo[];
  doctor: {
    id: number;
    name: string;
    hospital?: string;
    department?: string;
    specialty?: string;
  };
  status_counts: Record<string, number>;
  total_count: number;
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// 处方申请相关接口
export interface RequestPrescriptionMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface RequestPrescriptionRequest {
  doctor_id: number;
  symptoms: string;
  medications?: RequestPrescriptionMedication[];
  notes?: string;
}

export interface RequestPrescriptionResponse {
  prescription_id: number;
  status: string;
}

export interface GroupedPrescriptionResponse {
  groups: { [key: string]: PrescriptionInfo[] };
  status_counts: Record<string, number>;
  total_count: number;
}

export interface HealthRecordInfo {
  id: number;
  title: string;
  type: string;
  date: string;
  summary: string;
  doctor_name?: string;
  doctor_id?: number;
  hospital?: string;
}

export interface HealthRecordListCountsResponse {
  records: HealthRecordInfo[];
  type_counts: Record<string, number>;
  total_count: number;
  pagination: {
    total: number;
    pages: number;
    page: number;
    per_page: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface DoctorAppointmentInfo {
  id: number;
  doctor_id: number;
  doctor_name: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  location?: string;
  department?: string;
} 