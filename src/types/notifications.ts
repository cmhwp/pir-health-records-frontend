import type { ApiResponse } from './auth';

export enum NotificationType {
  SYSTEM = 'system',
  RECORD_SHARED = 'record_shared',
  RECORD_UPDATED = 'record_updated',
  APPOINTMENT = 'appointment',
  MESSAGE = 'message'
}

export interface Notification {
  id: string;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
}

export interface UpdateNotificationRequest {
  is_read?: boolean;
}

export interface NotificationCount {
  total: number;
  unread: number;
} 