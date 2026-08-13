import apiClient from './apiClient';

export const caseStudyService = {
  async getDayCaseStudies(courseId, dayId) {
    const response = await apiClient.get(`/case-studies/course/${courseId}/day/${dayId}`);
    return response.data;
  },

  async createCaseStudy(payload) {
    const response = await apiClient.post('/case-studies/', payload);
    return response.data;
  },

  async updateCaseStudy(id, payload) {
    const response = await apiClient.put(`/case-studies/${id}`, payload);
    return response.data;
  },

  async deleteCaseStudy(id) {
    const response = await apiClient.delete(`/case-studies/${id}`);
    return response.data;
  }
};
