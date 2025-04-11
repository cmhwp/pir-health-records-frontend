import request from '@/utils/request';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  ChangePasswordRequest
} from '@/types/auth';

/**
 * 用户注册
 */
export const register = (data: RegisterRequest): Promise<ApiResponse<User>> => {
  return request.post('/api/auth/register', data);
};

/**
 * 用户登录
 */
export const login = (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
  return request.post('/api/auth/login', data);
};

/**
 * 用户登出
 */
export const logout = (): Promise<ApiResponse> => {
  return request.post('/api/auth/logout');
};

/**
 * 获取当前用户信息
 */
export const getCurrentUser = (): Promise<ApiResponse<User>> => {
  return request.get('/api/auth/me');
};

/**
 * 更新用户信息
 */
export const updateUser = (data: Partial<User>): Promise<ApiResponse<User>> => {
  return request.put('/api/auth/me', data);
};

/**
 * 修改密码
 */
export const changePassword = (data: ChangePasswordRequest): Promise<ApiResponse> => {
  return request.post('/api/auth/change-password', data);
}; 