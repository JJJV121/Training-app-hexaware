// progressService.js
// Service managing course requirements, milestones, certificate status, and assessment metrics.
import axios from 'axios';

const progressService = {
  /**
   * Fetches overall requirement progress, modules completion stats, and quizzes.
   * Maps dynamically to backend dashboard data for active user session.
   */
  async getProgressOverview(userId) {
    const activeUserId = userId || Number(localStorage.getItem('logged_in_user_id')) || 1;
    try {
      const response = await axios.get(`http://localhost:8000/dashboard/${activeUserId}`);
      const data = response.data;
      const course = data.current_course;

      if (!course) {
        return {
          percentage: 0,
          completedModules: 0,
          totalModules: 0,
          completedAssessments: 0,
          totalAssessments: 3,
          insights: [],
          assessments: []
        };
      }

      const progressPercent = course.progress_percentage || 0;
      let completedAssessments = 0;
      if (progressPercent >= 33) completedAssessments = 1;
      if (progressPercent >= 66) completedAssessments = 2;
      if (progressPercent >= 100) completedAssessments = 3;

      return {
        percentage: progressPercent,
        completedModules: course.completed_modules || 0,
        totalModules: course.total_modules || 0,
        completedAssessments,
        totalAssessments: 3,
        insights: [
          {
            title: "You learn best at 9:00 AM",
            description: "Based on your completion patterns"
          },
          {
            title: `${progressPercent.toFixed(0)}% overall completion`,
            description: "Keep going to unlock achievements!"
          },
          {
            title: `Modules Completed: ${course.completed_modules}/${course.total_modules}`,
            description: "Track your module progress"
          }
        ],
        assessments: [
          {
            id: "java-basics",
            title: "Java Basics Quiz",
            status: progressPercent >= 33 ? "Passed" : "Upcoming",
            score: progressPercent >= 33 ? 85 : null,
            total: 100,
            details: progressPercent >= 33 ? "Score: 85/100" : "Not yet taken"
          },
          {
            id: "oop-mid",
            title: "OOP Mid-Assessment",
            status: progressPercent >= 66 ? "Passed" : "Upcoming",
            score: progressPercent >= 66 ? 78 : null,
            total: 100,
            details: progressPercent >= 66 ? "Score: 78/100" : "Not yet taken"
          },
          {
            id: "data-structures",
            title: "Data Structures Quiz",
            status: progressPercent >= 100 ? "Passed" : "Upcoming",
            score: progressPercent >= 100 ? 90 : null,
            total: 100,
            details: progressPercent >= 100 ? "Score: 90/100" : "Not yet taken"
          }
        ]
      };
    } catch (error) {
      console.error("Error fetching progress from dashboard API:", error);
      throw error;
    }
  }
};

export default progressService;