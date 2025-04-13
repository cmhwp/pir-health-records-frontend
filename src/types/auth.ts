export enum Role {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  RESEARCHER = 'researcher',
  ADMIN = 'admin'
}

export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  full_name?: string;
  phone?: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface PatientInfo {
  id?: number;
  user_id: number;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_history?: string;
  allergies?: string;
}

export interface DoctorInfo {
  id?: number;
  user_id: number;
  specialty?: string;
  license_number?: string;
  years_of_experience?: number;
  education?: string;
  hospital?: string;
  department?: string;
  bio?: string;
}

export interface ResearcherInfo {
  id?: number;
  user_id: number;
  institution?: string;
  department?: string;
  research_area?: string;
  education?: string;
  publications?: string;
  projects?: string;
  bio?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  role?: Role;
}

export interface LoginResponse {
  user: User;
  token: string;
  token_expires: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
} 