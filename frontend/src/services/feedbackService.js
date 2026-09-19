import apiClient from './apiClient';

const feedbackService = {
  // Trainee Feedback
  async submitTraineeFeedback(feedbackData) {
    const response = await apiClient.post('/feedback/trainee', feedbackData);
    return response.data;
  },

  async getMyTraineeFeedback() {
    const response = await apiClient.get('/feedback/trainee/my');
    return response.data;
  },

  // Trainer Evaluations
  async submitTrainerEvaluation(evalData) {
    const response = await apiClient.post('/feedback/trainer', evalData);
    return response.data;
  },

  async getTrainerEvaluations(batchId = null) {
    const params = batchId ? `?batch_id=${batchId}` : '';
    const response = await apiClient.get(`/feedback/trainer/trainees${params}`);
    return response.data;
  },

  async getTraineeEvaluationsHistory(traineeId) {
    const response = await apiClient.get(`/feedback/trainer/${traineeId}`);
    return response.data;
  },

  // Admin Feedback Analytics
  async getFeedbackAnalytics() {
    const response = await apiClient.get('/feedback/analytics');
    return response.data;
  }
};

export default feedbackService;
