import type { ApiResponse } from './auth';

export enum NotificationType {
  SYSTEM = 'system',
  RECORD_SHARED = 'record_shared',
  RECORD_UPDATED = 'record_updated',
  PRESCRIPTION_REQUEST = 'prescription_request',
  PRESCRIPTION_STATUS = 'prescription_status',
  MESSAGE = 'message',
  RECORD = 'record',
  SHARE = 'share',
  APPOINTMENT = 'appointment',
  PRESCRIPTION = 'prescription',
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
  related_id?: string;
}

export interface CreateNotificationRequest {
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  related_id?: string;
}

export interface UpdateNotificationRequest {
  is_read?: boolean;
}

export interface NotificationCount {
  total: number;
  unread: number;
} 