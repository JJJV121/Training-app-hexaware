import apiClient from './apiClient';

const adminCourseService = {
  async getCourses() {
    const response = await apiClient.get('/admin/courses/');
    return response.data;
  },

  async getCourseById(courseId) {
    const response = await apiClient.get(`/admin/courses/${courseId}`);
    return response.data;
  },

  async createCourse(courseData) {
    const response = await apiClient.post('/admin/courses/', courseData);
    return response.data;
  },

  async updateCourse(courseId, courseData) {
    const response = await apiClient.put(`/admin/courses/${courseId}`, courseData);
    return response.data;
  },

  async deleteCourse(courseId) {
    const response = await apiClient.delete(`/admin/courses/${courseId}`);
    return response.data;
  },

  async updateCourseStatus(courseId, isActive) {
    const response = await apiClient.patch(`/admin/courses/${courseId}/status`, {
      is_active: isActive
    });
    return response.data;
  },

  async getEnrolledStudents(courseId) {
    const response = await apiClient.get(`/admin/courses/${courseId}/students`);
    return response.data;
  },

  async getCourseCompletion(courseId) {
    const response = await apiClient.get(`/admin/courses/${courseId}/completion`);
    return response.data;
  },

  async getCourseDays(courseId) {
    const response = await apiClient.get(`/courses/${courseId}/days`);
    return response.data;
  }
};

export default adminCourseService;
