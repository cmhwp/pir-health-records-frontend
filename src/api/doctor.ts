import request from '@/utils/request';
import type { ApiResponse } from '@/types/auth';
import type {
  AuditLogsResponse,
  CreateEncryptedRecordRequest,
  CreateEncryptedRecordResponse,
  DecryptRecordRequest,
  DecryptRecordResponse,
  DoctorDashboardResponse,
  DoctorPatientsParams,
  GetDoctorPatientsResponse,
  GetDoctorRecordsParams,
  GetDoctorRecordsResponse,
  PIRQueryPatientRequest,
  PIRQueryPatientResponse,
  PatientDetailsResponse,
  UpdateDoctorRecordRequest,
  VerifyComplianceRequest,
  VerifyComplianceResponse,
  GetPrescriptionsParams,
  GetPrescriptionsResponse,
  CreatePrescriptionRequest,
  UpdatePrescriptionRequest,
  PatientStatisticsResponse,
  DiseaseStatisticsResponse,
  GetComplianceStatsResponse,
  Prescription
} from '@/types/doctor';
import type { HealthRecord } from '@/types/health';

const API_PATH = '/doctor';

/**
 * 存储加密的健康记录
 */
export const createEncryptedHealthRecord = async (
  data: CreateEncryptedRecordRequest
): Promise<ApiResponse<CreateEncryptedRecordResponse>> => {
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
 * 获取医生创建的记录列表
 */
export const getDoctorRecords = async (
  params?: GetDoctorRecordsParams
): Promise<ApiResponse<GetDoctorRecordsResponse>> => {
  return request.get(`${API_PATH}/records`, { params });
};

/**
 * 更新医生创建的记录
 */
export const updateDoctorRecord = async (
  recordId: string,
  data: UpdateDoctorRecordRequest
): Promise<ApiResponse<HealthRecord>> => {
  return request.put(`${API_PATH}/records/${recordId}`, data);
};

/**
 * 解密单个记录（医生需要解密密钥）
 */
export const decryptRecord = async (
  recordId: string,
  data: DecryptRecordRequest
): Promise<ApiResponse<DecryptRecordResponse>> => {
  return request.post(`${API_PATH}/records/${recordId}/decrypt`, data);
};

/**
 * 合规性验证接口 - 验证记录是否符合合规要求
 */
export const verifyRecordCompliance = async (
  recordId: string,
  data: VerifyComplianceRequest = {}
): Promise<ApiResponse<VerifyComplianceResponse>> => {
  return request.post(`${API_PATH}/records/${recordId}/verify-compliance`, data);
};

/**
 * PIR查询接口 - 安全查询患者记录，不泄露具体查询内容
 */
export const pirQueryPatientRecords = async (
  data: PIRQueryPatientRequest
): Promise<ApiResponse<PIRQueryPatientResponse>> => {
  return request.post(`${API_PATH}/pir/query`, data);
};

/**
 * 获取健康记录审计日志 - 查看记录访问和修改历史
 */
export const getRecordAuditLogs = async (
  recordId: string
): Promise<ApiResponse<AuditLogsResponse>> => {
  return request.get(`${API_PATH}/records/${recordId}/audit-logs`);
};

/**
 * 获取医生工作台统计和信息
 */
export const getDoctorDashboard = async (): Promise<ApiResponse<DoctorDashboardResponse>> => {
  return request.get(`${API_PATH}/dashboard`);
};

/**
 * 获取医生的患者列表
 */
export const getDoctorPatients = async (
  params?: DoctorPatientsParams
): Promise<ApiResponse<GetDoctorPatientsResponse>> => {
  return request.get(`${API_PATH}/patients`, { params });
};

/**
 * 获取患者详情
 */
export const getPatientDetails = async (
  patientId: number
): Promise<ApiResponse<PatientDetailsResponse>> => {
  return request.get(`${API_PATH}/patients/${patientId}`);
};

/**
 * 获取医生的处方列表
 */
export const getDoctorPrescriptions = async (
  params?: GetPrescriptionsParams
): Promise<ApiResponse<GetPrescriptionsResponse>> => {
  return request.get(`${API_PATH}/prescriptions`, { params });
};

/**
 * 创建新处方
 */
export const createPrescription = async (
  data: CreatePrescriptionRequest
): Promise<ApiResponse<{ prescription_id: number }>> => {
  return request.post(`${API_PATH}/prescriptions`, data);
};

/**
 * 获取处方详情
 */
export const getPrescriptionDetail = async (
  prescriptionId: number
): Promise<ApiResponse<Prescription>> => {
  return request.get(`${API_PATH}/prescriptions/${prescriptionId}`);
};

/**
 * 更新处方状态
 */
export const updatePrescriptionStatus = async (
  prescriptionId: number,
  data: UpdatePrescriptionRequest
): Promise<ApiResponse<{ prescription_id: number }>> => {
  return request.put(`${API_PATH}/prescriptions/${prescriptionId}`, data);
};

/**
 * 获取患者统计数据
 */
export const getPatientStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<PatientStatisticsResponse>> => {
  return request.get(`${API_PATH}/statistics/patients`, {
    params: { start_date: startDate, end_date: endDate }
  });
};

/**
 * 获取疾病统计数据
 */
export const getDiseaseStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<DiseaseStatisticsResponse>> => {
  return request.get(`${API_PATH}/statistics/diseases`, {
    params: { start_date: startDate, end_date: endDate }
  });
};

/**
 * 获取记录合规性统计
 */
export const getComplianceStatistics = async (): Promise<ApiResponse<GetComplianceStatsResponse>> => {
  return request.get(`${API_PATH}/statistics/compliance`);
};

/**
 * 批量验证记录合规性
 */
export const batchVerifyCompliance = async (
  recordIds: number[]
): Promise<ApiResponse<{ results: Record<number, boolean> }>> => {
  return request.post(`${API_PATH}/records/batch-verify`, { record_ids: recordIds });
}; 