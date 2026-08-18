import apiClient from './apiClient';

const messagingService = {
  // Get authorized contacts (assigned trainers/mentors for trainees, assigned trainees for trainers)
  getContacts: async () => {
    const response = await apiClient.get('/api/messaging/contacts');
    return response.data;
  },

  // Get user's conversation list with unread counts and last message
  getConversations: async () => {
    const response = await apiClient.get('/api/messaging/conversations');
    return response.data;
  },

  // Get conversation details by ID
  getConversationById: async (conversationId) => {
    const response = await apiClient.get(`/api/messaging/conversations/${conversationId}`);
    return response.data;
  },

  // Start or open a 1-to-1 direct conversation with target user ID
  createOrGetDirectConversation: async (targetUserId) => {
    const response = await apiClient.post('/api/messaging/conversations', {
      target_user_id: targetUserId,
    });
    return response.data;
  },

  // Get message history for a conversation
  getMessages: async (conversationId, limit = 100, offset = 0) => {
    const response = await apiClient.get(`/api/messaging/conversations/${conversationId}/messages`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Send message via REST fallback
  sendMessage: async (conversationId, content) => {
    const response = await apiClient.post(`/api/messaging/conversations/${conversationId}/messages`, {
      content,
    });
    return response.data;
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    const response = await apiClient.patch(`/api/messaging/conversations/${conversationId}/read`);
    return response.data;
  },
};

export default messagingService;
