import apiClient from './apiClient';

const issueService = {
  // Candidate APIs
  async raiseCandidateIssue(formData) {
    const response = await apiClient.post('/api/candidate/issues', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getCandidateIssues() {
    const response = await apiClient.get('/api/candidate/issues');
    return response.data;
  },

  async getCandidateIssueDetail(issueId) {
    const response = await apiClient.get(`/api/candidate/issues/${issueId}`);
    return response.data;
  },

  // Admin APIs
  async getAdminIssues(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.issue_type && filters.issue_type !== 'ALL') params.append('issue_type', filters.issue_type);
    if (filters.candidate_id) params.append('candidate_id', filters.candidate_id);
    if (filters.batch_id) params.append('batch_id', filters.batch_id);
    if (filters.search) params.append('search', filters.search);

    const response = await apiClient.get(`/api/admin/issues?${params.toString()}`);
    return response.data;
  },

  async getAdminIssueDetail(issueId) {
    const response = await apiClient.get(`/api/admin/issues/${issueId}`);
    return response.data;
  },

  async updateAdminIssue(issueId, status, adminResponse = null) {
    const response = await apiClient.patch(`/api/admin/issues/${issueId}`, {
      status,
      admin_response: adminResponse,
    });
    return response.data;
  },

  async executeCandidateAction(candidateId, batchId, actionType, comments = null) {
    const response = await apiClient.post('/api/admin/issues/candidate-action', {
      candidate_id: candidateId,
      batch_id: batchId,
      action_type: actionType,
      comments: comments,
    });
    return response.data;
  },
};

export default issueService;
