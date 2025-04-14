import request from '@/utils/request';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ChangePasswordRequest,
  PublicSettings
} from '@/types/auth';

/**
 * 用户注册
 */
export const register = (data: RegisterRequest): Promise<ApiResponse<User>> => {
  return request.post('/auth/register', data);
};

/**
 * 用户登录
 */
export const login = (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return request.post('/auth/login', data);
};

/**
 * 用户登出
 */
export const logout = (): Promise<ApiResponse> => {
  return request.post('/auth/logout');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  return request.get('/auth/me');
};

/**
 * 更新用户信息
 */
export const updateUser = (data: Partial<User>): Promise<ApiResponse<User>> => {
  return request.put('/auth/me', data);
};

/**
 * 修改密码
 */
export const changePassword = (data: ChangePasswordRequest): Promise<ApiResponse> => {
  return request.post('/auth/change-password', data);
};

/**
 * 上传头像
 */
export const uploadAvatar = (formData: FormData): Promise<ApiResponse<{avatar: string}>> => {
  return request.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

/**
 * 获取头像URL
 */
export const getAvatarUrl = (filename: string): string => {
  return `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/avatar/${filename}`;
};

/**
 * 获取公开系统设置
 */
export const getPublicSettings = (): Promise<ApiResponse<PublicSettings>> => {
  return request.get('/auth/public-settings');
}; 