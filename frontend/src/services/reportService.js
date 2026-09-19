import apiClient from './apiClient';

const reportService = {
  async getTraineesReportList(batchId = null) {
    const params = batchId ? `?batch_id=${batchId}` : '';
    const response = await apiClient.get(`/reports/trainees${params}`);
    return response.data;
  },

  async getTraineePerformanceCard(traineeId, batchId = null) {
    const params = batchId ? `?batch_id=${batchId}` : '';
    const response = await apiClient.get(`/reports/trainees/${traineeId}/performance-card${params}`);
    return response.data;
  },

  async getBatchPerformanceCards(batchId) {
    const response = await apiClient.get(`/reports/batches/${batchId}/performance-cards`);
    return response.data;
  },

  async updateReportComment(traineeId, batchId, commentReason, finalStatusOverride = null) {
    const response = await apiClient.patch(`/reports/trainees/${trainee_id}/comment`, {
      batch_id: batchId,
      comment_reason: commentReason,
      final_status_override: finalStatusOverride,
    });
    return response.data;
  },

  // File Download Triggers
  async downloadTraineeExcel(traineeId, batchId = null, supersetId = 'HX001') {
    const params = batchId ? `?batch_id=${batchId}` : '';
    const response = await apiClient.get(`/reports/trainees/${traineeId}/export/excel${params}`, {
      responseType: 'blob',
    });
    _triggerBlobDownload(response.data, `Trainee_Performance_Report_${supersetId}.xlsx`);
  },

  async downloadTraineePDF(traineeId, batchId = null, supersetId = 'HX001') {
    const params = batchId ? `?batch_id=${batchId}` : '';
    const response = await apiClient.get(`/reports/trainees/${traineeId}/export/pdf${params}`, {
      responseType: 'blob',
    });
    _triggerBlobDownload(response.data, `Trainee_Performance_Report_${supersetId}.html`);
  },

  async downloadBatchExcel(batchId, batchName = 'Batch') {
    const response = await apiClient.get(`/reports/batches/${batchId}/export/excel`, {
      responseType: 'blob',
    });
    _triggerBlobDownload(response.data, `${batchName}_Performance_Reports.xlsx`);
  },

  async downloadBatchBulkZip(batchId, batchName = 'Batch') {
    const response = await apiClient.get(`/reports/batches/${batchId}/export/bulk-zip`, {
      responseType: 'blob',
    });
    _triggerBlobDownload(response.data, `${batchName}_Performance_Reports.zip`);
  }
};

function _triggerBlobDownload(blobData, filename) {
  const url = window.URL.createObjectURL(new Blob([blobData]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default reportService;
