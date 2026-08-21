// services/assignmentService.js
import apiClient from './apiClient';

export const assignmentService = {
  // --- Trainee Endpoints ---
  async getAvailableAssignments(courseDayId) {
    const response = await apiClient.get('/assignments/trainee/assignments', {
      params: { course_day_id: courseDayId }
    });
    return response.data;
  },

  async getAssignmentQuestions(assignmentId) {
    const response = await apiClient.get(`/assignments/${assignmentId}/questions`);
    return response.data;
  },

  async runAssignmentCode(assignmentId, questionId, code, language) {
    const response = await apiClient.post(`/assignments/${assignmentId}/run-code`, {
      question_id: questionId,
      code,
      language
    });
    return response.data;
  },

  async submitAssignmentAnswers(assignmentId, answers, userId) {
    const response = await apiClient.post(`/assignments/${assignmentId}/submit-answers`, {
      user_id: userId,
      answers: answers
    });
    return response.data;
  },

  async getMySubmissions() {
    const response = await apiClient.get('/assignments/trainee/my-submissions');
    return response.data;
  },

  async downloadAssignment(assignmentId) {
    const response = await apiClient.get(`/assignments/trainee/assignments/${assignmentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  async submitAssignment(assignmentId, file, userId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    const response = await apiClient.post(`/assignments/trainee/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async submitAssignmentSubmission(assignmentId, file, githubUrl = '') {
    const formData = new FormData();
    formData.append('assignment_id', assignmentId);
    if (file) formData.append('file', file);
    if (githubUrl) formData.append('github_url', githubUrl);

    const response = await apiClient.post('/assignment-submissions/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // --- Admin/Trainer Endpoints ---
  async getAssignments() {
    const response = await apiClient.get('/assignments/');
    return response.data;
  },

  async getAssignmentById(assignmentId) {
    const response = await apiClient.get(`/assignments/${assignmentId}`);
    return response.data;
  },

  async createAssignment(formData) {
    const response = await apiClient.post('/assignments/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async updateAssignment(assignmentId, formData) {
    const response = await apiClient.put(`/assignments/${assignmentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async deleteAssignment(assignmentId) {
    const response = await apiClient.delete(`/assignments/${assignmentId}`);
    return response.data;
  },

  async getAssignmentSubmissions(assignmentId) {
    const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  async getAssignmentsByCourseDay(courseId, dayId) {
    const response = await apiClient.get(`/assignments/course/${courseId}/day/${dayId}`);
    return response.data;
  },

  async generateSuggestedContent(courseId, dayId) {
    const response = await apiClient.post(`/courses/${courseId}/days/${dayId}/generate-content`);
    return response.data;
  }
};
