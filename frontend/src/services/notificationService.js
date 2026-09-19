import apiClient from './apiClient';

const notificationService = {
  async getUserNotifications(unreadOnly = false, limit = 50) {
    const response = await apiClient.get(`/api/notifications?unread_only=${unreadOnly}&limit=${limit}`);
    return response.data;
  },

  async markNotificationRead(notificationId) {
    const response = await apiClient.patch(`/api/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsRead() {
    const response = await apiClient.patch('/api/notifications/read-all');
    return response.data;
  },
};

export default notificationService;
