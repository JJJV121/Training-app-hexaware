import apiClient from './apiClient';

const assignmentSubmissionService = {
  async getSubmissions(assignmentId) {
    const response = await apiClient.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  async evaluateSubmission(submissionId, marks, feedback) {
    // payload matches AssignmentEvaluation schema: marks, feedback
    const response = await apiClient.put(`/assignment-submissions/${submissionId}/evaluate`, {
      marks: Number(marks),
      feedback: feedback
    });
    return response.data;
  },

  async getCodingSubmissions(problemId) {
    const response = await apiClient.get(`/submissions/problem/${problemId}`);
    return response.data;
  }
};

export default assignmentSubmissionService;
