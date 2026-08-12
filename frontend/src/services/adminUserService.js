import apiClient from './apiClient';

const COLLEGES_LIST = ['IIT Madras', 'BITS Pilani', 'PSG Tech', 'Anna University', 'VIT Vellore'];

const adminUserService = {
  async getTrainees() {
    const response = await apiClient.get('/admin/trainees');
    return response.data;
  },

  async getTraineeById(id) {
    const response = await apiClient.get(`/admin/trainees/${id}`);
    return response.data;
  },

  async createTrainee(traineeData) {
    // Maps frontend inputs to the backend UserCreate schema
    const payload = {
      employee_id: traineeData.employee_id || `EMP_${Date.now()}`,
      name: traineeData.name,
      email: traineeData.email,
      course_id: traineeData.course_id,
      role: 'trainee',
      password: traineeData.password || 'Trainee@123'
    };
    const response = await apiClient.post('/auth/users', payload);
    return response.data;
  },

  async updateTrainee(id, traineeData) {
    // Maps to AdminUserUpdate schema
    const payload = {
      name: traineeData.name,
      email: traineeData.email,
      course_id: traineeData.course_id
    };
    const response = await apiClient.put(`/admin/trainees/${id}`, payload);
    return response.data;
  },

  async deleteTrainee(id) {
    const response = await apiClient.delete(`/admin/trainees/${id}`);
    return response.data;
  },

  async searchTrainees(keyword) {
    const response = await apiClient.get('/admin/trainees/search', {
      params: { keyword }
    });
    return response.data;
  },

  async updateTraineeStatus(id, isActive) {
    const response = await apiClient.patch(`/admin/trainees/${id}/status`, {
      is_active: isActive
    });
    return response.data;
  },

  getColleges() {
    return [...COLLEGES_LIST];
  }
};

export default adminUserService;
