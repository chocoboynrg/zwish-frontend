export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL' | 'SMS';

export type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'READ';

export interface NotificationEventRef {
  id: number;
  title: string;
  eventDate?: string;
  description?: string | null;
}

export interface AppNotification {
  id: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  event: NotificationEventRef | null;
  type: string;
  title: string;
  body: string;
  dataPayload: Record<string, any> | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}