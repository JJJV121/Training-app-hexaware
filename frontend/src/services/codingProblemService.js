import apiClient from './apiClient';

const codingProblemService = {
  async getProblems() {
    const response = await apiClient.get('/coding-problems/');
    return response.data;
  },

  async getProblemById(problemId) {
    const response = await apiClient.get(`/coding-problems/${problemId}`);
    return response.data;
  },

  async createProblem(problemData) {
    // payload matches CodingProblemCreate schema, requires:
    // assignment_id, title, description, language_id, marks, sample_input, sample_output, deadline, created_by
    const response = await apiClient.post('/coding-problems/', problemData);
    return response.data;
  },

  async updateProblem(problemId, problemData) {
    // payload matches CodingProblemUpdate schema
    const response = await apiClient.put(`/coding-problems/${problemId}`, problemData);
    return response.data;
  },

  async deleteProblem(problemId) {
    const response = await apiClient.delete(`/coding-problems/${problemId}`);
    return response.data;
  },

  async getTestCases(problemId) {
    const response = await apiClient.get(`/coding-problems/${problemId}/testcases`);
    return response.data;
  },

  async addTestCase(problemId, testCaseData) {
    // payload matches TestCaseCreate schema: input_data, expected_output, is_hidden
    const response = await apiClient.post(`/coding-problems/${problemId}/testcases`, testCaseData);
    return response.data;
  }
};

export default codingProblemService;
