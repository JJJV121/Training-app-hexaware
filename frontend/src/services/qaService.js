import apiClient from './apiClient';

export const qaService = {
  async getDayQAs(courseId, dayId) {
    const response = await apiClient.get(`/qa/course/${courseId}/day/${dayId}`);
    return response.data;
  },

  async createQA(payload) {
    const response = await apiClient.post('/qa/', payload);
    return response.data;
  },

  async updateQA(id, payload) {
    const response = await apiClient.put(`/qa/${id}`, payload);
    return response.data;
  },

  async deleteQA(id) {
    const response = await apiClient.delete(`/qa/${id}`);
    return response.data;
  }
};
