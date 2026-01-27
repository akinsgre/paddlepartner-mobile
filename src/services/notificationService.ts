import api from './api';

export interface Notification {
  _id: string;
  recipientGoogleId: string;
  type: 'follow' | 'activity_like' | 'activity_comment' | 'mention';
  message: string;
  read: boolean;
  actionUrl?: string;
  actorGoogleId?: string;
  actorName?: string;
  actorImage?: string;
  relatedActivityId?: string;
  relatedCommentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  follows: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
}

class NotificationService {
  /**
   * Get all notifications for the current user
   */
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
  }): Promise<{
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
    page: number;
    pages: number;
  }> {
    try {
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      throw error;
    }
  }

  /**
   * Get count of unread notifications
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data.count;
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await api.put('/notifications/read-all');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await api.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Failed to delete notification:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await api.get('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await api.patch('/notifications/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  }

  /**
   * Register push notification token
   */
  async registerPushToken(token: string, platform: 'ios' | 'android'): Promise<void> {
    try {
      await api.post('/notifications/push-token', { token, platform });
    } catch (error) {
      console.error('Failed to register push token:', error);
      throw error;
    }
  }

  /**
   * Unregister push notification token
   */
  async unregisterPushToken(token: string): Promise<void> {
    try {
      await api.delete('/notifications/push-token', { data: { token } });
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      throw error;
    }
  }
}

export default new NotificationService();
