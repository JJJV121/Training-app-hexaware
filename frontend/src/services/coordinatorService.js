import apiClient from './apiClient';

const coordinatorService = {
  async getDashboardMetrics() {
    const response = await apiClient.get('/api/coordinator/dashboard');
    return response.data;
  },

  async getAssignedBatches() {
    const response = await apiClient.get('/api/coordinator/batches');
    return response.data;
  },

  async getBatchDetail(batchId) {
    const response = await apiClient.get(`/api/coordinator/batches/${batchId}`);
    return response.data;
  },

  async getCoordinatorIssues(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.issue_type && filters.issue_type !== 'ALL') params.append('issue_type', filters.issue_type);

    const response = await apiClient.get(`/api/coordinator/issues?${params.toString()}`);
    return response.data;
  },

  async updateCoordinatorIssue(issueId, status, responseNotes = null, escalateToAdmin = false) {
    const response = await apiClient.patch(`/api/coordinator/issues/${issueId}`, {
      status,
      response_notes: responseNotes,
      escalate_to_admin: escalateToAdmin,
    });
    return response.data;
  },
};

export default coordinatorService;
