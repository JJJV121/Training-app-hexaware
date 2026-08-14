import apiClient from './apiClient';

const trainerService = {
  getOverview: async () => {
    const response = await apiClient.get('/api/trainer/overview');
    return response.data;
  },
  getBatches: async () => {
    const response = await apiClient.get('/api/trainer/batches');
    return response.data;
  },
  getBatchTrainees: async (batchId) => {
    const response = await apiClient.get(`/api/trainer/batches/${batchId}/trainees`);
    return response.data;
  },
  getUpcomingSessions: async () => {
    const response = await apiClient.get('/api/trainer/sessions/upcoming');
    return response.data;
  },
  getAllSessions: async () => {
    const response = await apiClient.get('/api/trainer/sessions');
    return response.data;
  },
  createSession: async (sessionData) => {
    const response = await apiClient.post('/api/trainer/sessions', sessionData);
    return response.data;
  },
  getGradingQueue: async () => {
    const response = await apiClient.get('/api/trainer/grading-queue');
    return response.data;
  },
  evaluateSubmission: async (submissionId, evalData) => {
    const response = await apiClient.put(`/assignment-submissions/${submissionId}/evaluate`, evalData);
    return response.data;
  },
  getModuleAnalytics: async (batchId) => {
    const response = await apiClient.get(`/api/trainer/analytics/modules?batch_id=${batchId}`);
    return response.data;
  },
  getAnalyticsAlerts: async (batchId) => {
    const response = await apiClient.get(`/api/trainer/analytics/alerts?batch_id=${batchId}`);
    return response.data;
  }
};

export default trainerService;
