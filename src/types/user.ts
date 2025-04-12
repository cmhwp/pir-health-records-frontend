export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: 'patient' | 'doctor' | 'researcher' | 'admin';
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface GetUsersResponse {
  users: User[];
  total: number;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  role: string;
  avatar?: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: string;
  medical_id?: string;
  specialization?: string;
  institution?: string;
  research_field?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
} 