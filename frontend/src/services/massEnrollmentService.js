import apiClient from './apiClient';

const massEnrollmentService = {
  // Download sample CSV template
  getTemplateUrl(enrollmentType) {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:8000';
    return `${baseURL}/admin/mass-enrollment/template/${enrollmentType}`;
  },

  async downloadTemplate(enrollmentType) {
    const response = await apiClient.get(
      `/admin/mass-enrollment/template/${enrollmentType}`,
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${enrollmentType.toLowerCase()}_import_template.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Validate uploaded CSV file
  async validateCsv(enrollmentType, file) {
    const formData = new FormData();
    formData.append('enrollment_type', enrollmentType);
    formData.append('file', file);

    const response = await apiClient.post('/admin/mass-enrollment/validate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Execute bulk import for validated records
  async importCsv(enrollmentType, rows) {
    const response = await apiClient.post('/admin/mass-enrollment/import', {
      enrollment_type: enrollmentType,
      rows: rows,
    });
    return response.data;
  },

  // Helper to generate failed rows CSV download
  downloadFailedRowsCsv(enrollmentType, results, originalRows) {
    const failedRows = results.filter((r) => r.status === 'Failed');
    if (failedRows.length === 0) return;

    const rowMap = new Map();
    originalRows.forEach((r) => {
      rowMap.set(r.row_index, r.data);
    });

    const headers = new Set(['row_index', 'error_reason']);
    failedRows.forEach((fr) => {
      const data = rowMap.get(fr.row_index) || {};
      Object.keys(data).forEach((k) => {
        if (!k.startsWith('resolved_')) {
          headers.add(k);
        }
      });
    });

    const headerArray = Array.from(headers);
    const csvLines = [headerArray.join(',')];

    failedRows.forEach((fr) => {
      const data = rowMap.get(fr.row_index) || {};
      const line = headerArray.map((h) => {
        let val = '';
        if (h === 'row_index') val = String(fr.row_index);
        else if (h === 'error_reason') val = fr.reason || '';
        else val = data[h] || '';

        // Escape double quotes and wrap in quotes if contains comma/quotes/newline
        val = String(val).replace(/"/g, '""');
        if (val.includes(',') || val.includes('\n') || val.includes('"')) {
          val = `"${val}"`;
        }
        return val;
      });
      csvLines.push(line.join(','));
    });

    const csvContent = csvLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${enrollmentType.toLowerCase()}_failed_rows.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default massEnrollmentService;
