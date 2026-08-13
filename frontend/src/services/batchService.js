import apiClient from './apiClient';

const batchService = {
  async getBatches() {
    const response = await apiClient.get('/admin/batches');
    // Returns { total, page, limit, batches }
    return response.data;
  },

  async getBatchById(id) {
    const response = await apiClient.get(`/admin/batches/${id}`);
    // Returns { batch, batch_strength }
    return response.data;
  },

  async createBatch(batchData) {
    const adminId = Number(localStorage.getItem('logged_in_user_id')) || 23;
    const response = await apiClient.post(`/admin/batches?created_by=${adminId}`, batchData);
    return response.data;
  },

  async updateBatch(id, batchData) {
    const response = await apiClient.put(`/admin/batches/${id}`, batchData);
    return response.data;
  },

  async deleteBatch(id) {
    const response = await apiClient.delete(`/admin/batches/${id}`);
    return response.data;
  },

  async addTraineesToBatch(batchId, traineeIds) {
    const response = await apiClient.post(`/admin/batches/${batchId}/trainees`, {
      trainee_ids: traineeIds.map(Number)
    });
    return response.data;
  },

  async removeTraineeFromBatch(batchId, traineeId) {
    const response = await apiClient.delete(`/admin/batches/${batchId}/trainees/${traineeId}`);
    return response.data;
  },

  async assignTrainerToBatch(batchId, trainerId) {
    const response = await apiClient.post(`/admin/batches/${batchId}/trainer`, {
      trainer_id: Number(trainerId)
    });
    return response.data;
  },

  async getBatchTrainees(batchId) {
    const response = await apiClient.get(`/admin/batches/${batchId}/trainees`);
    return response.data;
  }
};

export default batchService;
