import request from '@/utils/request';
import type {
  ApiResponse,
} from '@/types/auth';
import type {
  Notification,
  CreateNotificationRequest,
  UpdateNotificationRequest,
  NotificationCount
} from '@/types/notifications';

/**
 * 获取用户通知列表
 */
export const getNotifications = (page = 1, limit = 10): Promise<ApiResponse<{ notifications: Notification[], total: number }>> => {
  return request.get(`/notifications?page=${page}&limit=${limit}`);
};

/**
 * 获取未读通知数量
 */
export const getNotificationCount = (): Promise<ApiResponse<NotificationCount>> => {
  return request.get('/notifications/count');
};

/**
 * 标记通知为已读
 */
export const markNotificationAsRead = (notificationId: string): Promise<ApiResponse<Notification>> => {
  return request.put(`/notifications/${notificationId}`, { is_read: true });
};

/**
 * 标记所有通知为已读
 */
export const markAllNotificationsAsRead = (): Promise<ApiResponse> => {
  return request.put('/notifications/read-all');
};

/**
 * 删除通知
 */
export const deleteNotification = (notificationId: string): Promise<ApiResponse> => {
  return request.delete(`/notifications/${notificationId}`);
};

/**
 * 清空所有通知
 */
export const clearAllNotifications = (): Promise<ApiResponse> => {
  return request.delete('/notifications/clear-all');
}; 