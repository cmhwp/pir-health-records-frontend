import request from '@/utils/request';
import type { ApiResponse } from '../types/auth';
import type { User, GetUsersResponse } from '@/types/user';

const API_PATH = '/users';

/**
 * 获取用户列表
 */
export const getUsers = async (): Promise<ApiResponse<GetUsersResponse>> => {
  return request.get(`${API_PATH}`);
};

/**
 * 获取用户详情
 */
export const getUserById = async (userId: number): Promise<ApiResponse<{ user: User }>> => {
  return request.get(`${API_PATH}/${userId}`);
}; 