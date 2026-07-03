// dashboardService.js
import axios from 'axios';

// Set to false to use mock data
const IS_BACKEND_RUNNING = true;

const API_BASE_URL = "http://localhost:8000";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const sleep = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const dashboardService = {

  async getDashboardData(userId) {

    if (!IS_BACKEND_RUNNING) {
      await sleep();

      return {
        employee_id: "EMP001",
        email: "emp001@example.com",
        courses_enrolled: 1,
        current_course: {
          course_id: 1,
          course_name: "Java Training",
          current_day: 1,
          day_progress_percentage: 20,
          duration_days: 16,
          start_date: "2026-06-14",
          end_date: "2026-06-29",
          total_modules: 56,
          completed_modules: 1,
          remaining_modules: 55,
          progress_percentage: 2,
          learning_hours_completed: 1,
          assessment_time_hours: 10,
          assignment_time_hours: 5,
          day_wise_progress: [
            { day: 1, progress_percentage: 20 }
          ]
        }
      };
    }

    try {

      console.log("Loading dashboard for user:", userId);

      const response = await apiClient.get(`/dashboard/${userId}`);

      console.log("Dashboard Response:", response.data);

      return response.data;

    } catch (error) {

      console.error("Dashboard API Error");

      console.error(error);

      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Response:", error.response.data);
      }

      throw error;
    }
  },

  async getUserProfile(userId) {

    const data = await this.getDashboardData(userId);

    return {
      name: data.name || data.employee_id || "Student",
      email: data.email || ""
    };
  },

  async getOverviewStats(userId) {

    const data = await this.getDashboardData(userId);

    const course = data.current_course;

    if (!course) {
      throw new Error("Current course not found.");
    }

    return [

      {
        id: "current-course",
        title: course.course_name,
        label: "Course Enrolled",
        icon: "book-open",
        color: "blue"
      },

      {
        id: "modules-completed",
        title: String(course.completed_modules),
        label: "Modules Completed",
        icon: "check-circle",
        color: "green"
      },

      {
        id: "overall-completion",
        title: `${course.progress_percentage}%`,
        label: "Overall Completion",
        icon: "trending-up",
        color: "blue"
      },

      {
        id: "courses-enrolled",
        title: String(data.courses_enrolled),
        label: "Courses Enrolled",
        icon: "alert-circle",
        color: "red"
      }

    ];
  },

  async getTimeSpentData(userId) {

    const data = await this.getDashboardData(userId);

    const course = data.current_course;

    if (!course) {
      throw new Error("Current course not found.");
    }

    // Backend sends HOURS
    const totalHours = Number(course.learning_hours_completed || 0);

    const hrs = Math.floor(totalHours);

    const mins = Math.round((totalHours - hrs) * 60);

    return {

      badge: "Time Spent",

      categories: [

        {
          id: "learning",
          title: `Day ${course.current_day}`,
          hours: `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} hrs`,
          label: "Learning Contents",
          color: "#3563e9"
        },

        {
          id: "assessment",
          title: "",
          hours: `${String(course.assessment_time_hours).padStart(2, "0")}:00 hrs`,
          label: "Assessment",
          color: "#5c6f84"
        },

        {
          id: "practice",
          title: "",
          hours: `${String(course.assignment_time_hours).padStart(2, "0")}:00 hrs`,
          label: "Practice",
          color: "#0dcd94"
        }

      ]

    };
  },

  async getKeepGoingData(userId) {

    const data = await this.getDashboardData(userId);

    const course = data.current_course;

    if (!course) {
      throw new Error("Current course not found.");
    }

    return {

      badge: "Keep Going!",

      title: `${course.remaining_modules} Modules Almost Done`,

      description:
        "You're making amazing progress! Finish your courses and unlock new achievements.",

      buttonText: "Continue Learning"

    };
  },

  async getCourseProgressData(userId) {

    const data = await this.getDashboardData(userId);

    const course = data.current_course;

    if (!course) {
      throw new Error("Current course not found.");
    }

    return {

      title: course.course_name,

      subtitle: `Day ${course.current_day} of ${course.duration_days}`,

      percent: Number(course.progress_percentage || 0),

      startDate: course.start_date,

      endDate: course.end_date,

      chartPoints: Array.isArray(course.day_wise_progress)
        ? course.day_wise_progress
        : []

    };
  },

  async getProfileViewData(userId) {

    try {

      const data = await this.getDashboardData(userId);

      return {

        name: data.name || data.employee_id || "Student",

        email: data.email || ""

      };

    } catch (error) {

      console.error(error);

      return {

        name: "Student",

        email: ""

      };

    }
  }

};

export default dashboardService;