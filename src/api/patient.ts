import request from '@/utils/request';
import type { ApiResponse } from '@/types/auth';
import type { 
  PrescriptionsResponse, 
  DoctorsResponse,
  RequestPrescriptionRequest,
  RequestPrescriptionResponse,
  DoctorAppointmentInfo,
  DoctorPrescriptionsResponse,
  GroupedPrescriptionResponse,
  HealthRecordInfo,
  HealthRecordListCountsResponse,
  Institution,
  InstitutionsResponse,
  InstitutionResponse,
  InstitutionDoctorsResponse,
  CustomRecordType,
  RecordTypesResponse,
  RecordTypeResponse
} from '@/types/patient';

/**
 * 获取患者的处方列表
 */
export const getPatientPrescriptions = (
  params: {
    page?: number;
    per_page?: number;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}
): Promise<ApiResponse<PrescriptionsResponse>> => {
  return request.get('/patient/prescriptions', { params });
};

/**
 * 获取医生列表
 */
export const getDoctors = (
  params: {
    page?: number;
    per_page?: number;
    search?: string;
    hospital?: string;
    department?: string;
    specialty?: string;
    sort_by?: 'name' | 'experience' | 'created_at';
    sort_order?: 'asc' | 'desc';
    include_prescription_history?: boolean;
  } = {}
): Promise<ApiResponse<DoctorsResponse>> => {
  return request.get('/patient/doctors', { params });
};

/**
 * 患者申请处方
 */
export const requestPrescription = (
  data: RequestPrescriptionRequest
): Promise<ApiResponse<RequestPrescriptionResponse>> => {
  return request.post('/patient/prescriptions/request', data);
};

/**
 * 获取医生处方列表
 */
export async function getPrescriptionsByDoctor(
  doctor_id: number,
  page = 1,
  per_page = 10,
  filters?: Record<string, string | number>
): Promise<ApiResponse<DoctorPrescriptionsResponse>> {
  const params: Record<string, string | number> = {
    page,
    per_page
  };
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });
  }
  
  return request.get(`/patient/prescriptions/doctor/${doctor_id}`, { params });
}

/**
 * 获取医疗机构列表
 */
export const getInstitutions = (
  params: {
    page?: number;
    per_page?: number;
    search?: string;
  } = {}
): Promise<ApiResponse<InstitutionsResponse>> => {
  return request.get('/patient/institutions', { params });
};

/**
 * 获取单个医疗机构详情
 */
export const getInstitution = (
  institutionId: number
): Promise<ApiResponse<InstitutionResponse>> => {
  return request.get(`/patient/institutions/${institutionId}`);
};

/**
 * 获取指定医疗机构的医生列表
 */
export const getInstitutionDoctors = (
  institutionId: number,
  params: {
    page?: number;
    per_page?: number;
    search?: string;
    department?: string;
    specialty?: string;
    sort_by?: 'name' | 'experience' | 'created_at';
    sort_order?: 'asc' | 'desc';
  } = {}
): Promise<ApiResponse<InstitutionDoctorsResponse>> => {
  return request.get(`/patient/institutions/${institutionId}/doctors`, { params });
};

/**
 * 获取记录类型列表
 */
export const getRecordTypes = (): Promise<ApiResponse<RecordTypesResponse>> => {
  return request.get('/patient/record-types');
};

/**
 * 获取单个记录类型详情
 */
export const getRecordType = (
  typeId: number
): Promise<ApiResponse<RecordTypeResponse>> => {
  return request.get(`/patient/record-types/${typeId}`);
}; 