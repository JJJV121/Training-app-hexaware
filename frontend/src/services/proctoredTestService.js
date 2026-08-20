import apiClient from './apiClient';

export const proctoredTestService = {
  /**
   * Fetch dynamic proctored assessment for a course day.
   * Returns test details formatted as course_day_topic without answer key leakage.
   */
  async getProctoredTestByDay(courseDayId) {
    const res = await apiClient.get(`/assessments/by-day/${courseDayId}/proctored`);
    return res.data;
  },

  /**
   * Fetch trainee-safe assessment by assessment ID.
   */
  async getProctoredTestById(assessmentId) {
    const res = await apiClient.get(`/assessments/${assessmentId}/proctored`);
    return res.data;
  },

  /**
   * Create or retrieve active test attempt.
   */
  async startAttempt(assessmentId) {
    const res = await apiClient.post(`/assessments/${assessmentId}/attempts`);
    return res.data;
  },

  /**
   * Restore attempt state on page refresh.
   */
  async getAttemptState(attemptId) {
    const res = await apiClient.get(`/assessment-attempts/${attemptId}`);
    return res.data;
  },

  /**
   * Auto-save answer dynamically during navigation or option selection.
   */
  async saveAnswer(attemptId, questionId, selectedOptionIds = null, answerText = null, currentQuestionIndex = null) {
    const res = await apiClient.put(`/assessment-attempts/${attemptId}/answers/${questionId}`, {
      selected_option_ids: selectedOptionIds,
      answer_text: answerText,
      current_question_index: currentQuestionIndex,
    });
    return res.data;
  },

  /**
   * Log proctoring events (TAB_SWITCH, VISIBILITY_CHANGE, FULLSCREEN_EXIT, etc.).
   */
  async logProctoringEvent(attemptId, eventType, metadata = {}) {
    try {
      const res = await apiClient.post(`/assessment-attempts/${attemptId}/proctoring-events`, {
        event_type: eventType,
        timestamp: new Date().toISOString(),
        metadata: metadata,
      });
      return res.data;
    } catch (e) {
      console.warn('Failed to record proctoring event:', e);
    }
  },

  /**
   * Submit attempt for server-side evaluation & score calculation.
   */
  async submitAttempt(attemptId) {
    const res = await apiClient.post(`/assessment-attempts/${attemptId}/submit`);
    return res.data;
  },
};
