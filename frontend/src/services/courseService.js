// courseService.js
// Service providing real API calls using central apiClient with JWT authorization
import apiClient from './apiClient';

const courseService = {
  // 1. Fetch full course relational structure (Course -> Days -> Units)
  async getCourseContent(courseId) {
    if (!this._cache) this._cache = {};
    if (this._cache[courseId]) {
      console.log('Returning cached course content for', courseId);
      return this._cache[courseId];
    }

    const response = await apiClient.get(`/courses/${courseId}/content`);
    this._cache[courseId] = response.data;
    return response.data;
  },

  // 2. Fetch current user progress tracking metrics for a specific course
  async getCourseProgress(courseId, userId) {
    const response = await apiClient.get(`/progress/course/${courseId}/user/${userId}`);
    return response.data;
  },

  // 3. Mark a learning topic unit as complete for a user
  async markUnitComplete(userId, learningUnitId) {
    const response = await apiClient.post(`/progress/${userId}/${learningUnitId}/complete`);
    return response.data;
  },

  // 4. Revert a learning topic unit back to incomplete status
  async markUnitIncomplete(userId, learningUnitId) {
    const response = await apiClient.post(`/progress/${userId}/${learningUnitId}/incomplete`);
    return response.data;
  },

  // 5. Query lecture streaming media files tied to a unit node
  async getUnitVideos(learningUnitId) {
    const response = await apiClient.get(`/courses/units/${learningUnitId}/videos`);
    return response.data;
  },

  // 6. API call to mark an individual video as complete
  async markVideoComplete(userId, videoId) {
    const response = await apiClient.post(`/progress/${userId}/video/${videoId}/complete`);
    return response.data;
  },

  // 7. Pull theory notes or documentation summaries for a specific topic
  async getUnitNotes(learningUnitId) {
    try {
      const response = await apiClient.get(`/courses/units/${learningUnitId}/content`);
      return response.data;
    } catch (error) {
      // Fallback to notes endpoint if content endpoint 404s
      const fallbackResponse = await apiClient.get(`/courses/units/${learningUnitId}/notes`);
      return fallbackResponse.data;
    }
  },

  // 8. Extract discussion forum/board records assigned to a learning segment
  async getUnitQA(learningUnitId) {
    const response = await apiClient.get(`/courses/units/${learningUnitId}/qa`);
    return response.data;
  },

  // 9. Fetch available courses
  async getAvailableCourses(userId) {
    try {
      const response = await apiClient.get(`/courses/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching available courses:", error);
      return [];
    }
  }
};

export default courseService;

