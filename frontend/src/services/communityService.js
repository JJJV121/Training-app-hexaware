import apiClient from './apiClient';

const communityService = {
  // Fetch all communities
  getCommunities: async () => {
    const response = await apiClient.get('/api/communities');
    return response.data;
  },

  // Create a new community
  createCommunity: async (name, description) => {
    const response = await apiClient.post('/api/communities', { name, description });
    return response.data;
  },

  // Get single community details
  getCommunityById: async (communityId) => {
    const response = await apiClient.get(`/api/communities/${communityId}`);
    return response.data;
  },

  // Join a community
  joinCommunity: async (communityId) => {
    const response = await apiClient.post(`/api/communities/${communityId}/join`);
    return response.data;
  },

  // Leave a community
  leaveCommunity: async (communityId) => {
    const response = await apiClient.delete(`/api/communities/${communityId}/leave`);
    return response.data;
  },

  // Get community members
  getCommunityMembers: async (communityId) => {
    const response = await apiClient.get(`/api/communities/${communityId}/members`);
    return response.data;
  },

  // Get community messages
  getCommunityMessages: async (communityId, limit = 100, offset = 0) => {
    const response = await apiClient.get(`/api/communities/${communityId}/messages`, {
      params: { limit, offset },
    });
    return response.data;
  },

  // Post community message
  postCommunityMessage: async (communityId, content) => {
    const response = await apiClient.post(`/api/communities/${communityId}/messages`, {
      content,
    });
    return response.data;
  },
};

export default communityService;
