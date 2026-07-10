// dashboardService.js
import axios from 'axios';

// Set to false to use mock data
const IS_BACKEND_RUNNING = true;

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const sleep = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const dashboardService = {
  _cache: {}, // userId -> { data, timestamp }
  _pendingRequests: {}, // userId -> Promise

  // Reusable core fetch function
  async getDashboard(userId) {
    if (!userId) return null;

    // Deduplicate concurrent requests
    if (this._pendingRequests[userId]) {
      return this._pendingRequests[userId];
    }

    // Return cached data if fresh (less than 10 seconds old)
    const cached = this._cache[userId];
    const now = Date.now();
    if (cached && (now - cached.timestamp < 10000)) {
      return cached.data;
    }

    const promise = (async () => {
      try {
        if (!IS_BACKEND_RUNNING) {
          await sleep();
          const mockData = {
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
              learning_hours_completed: 1.0,
              assessment_time_hours: 10,
              assignment_time_hours: 5,
              day_wise_progress: [
                { day: 1, progress_percentage: 20 }
              ]
            }
          };
          this._cache[userId] = { data: mockData, timestamp: Date.now() };
          return mockData;
        }

        console.log("Loading dashboard for user:", userId);
        const response = await apiClient.get(`/dashboard/${userId}`);
        console.log("Dashboard Response:", response.data);

        const data = response.data;
        this._cache[userId] = { data, timestamp: Date.now() };
        return data;
      } finally {
        delete this._pendingRequests[userId];
      }
    })();

    this._pendingRequests[userId] = promise;
    return promise;
  },

  // Reusable function to get current course
  async getCurrentCourse(userId) {
    const data = await this.getDashboard(userId);
    return data?.current_course || null;
  },

  // Reusable function to get progress
  async getProgress(userId) {
    const course = await this.getCurrentCourse(userId);
    if (!course) return null;
    return {
      percent: Number(course.progress_percentage || 0),
      day_wise_progress: Array.isArray(course.day_wise_progress) ? course.day_wise_progress : []
    };
  },

  // Legacy wrappers for backward compatibility (calling our deduplicated cache)
  async getDashboardData(userId) {
    return this.getDashboard(userId);
  },

  async getUserProfile(userId) {
    const data = await this.getDashboard(userId);
    return {
      name: data.name || data.employee_id || "Student",
      email: data.email || ""
    };
  },

  async getOverviewStats(userId) {
    const data = await this.getDashboard(userId);
    const course = data.current_course;
    if (!course) return [];
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
    const data = await this.getDashboard(userId);
    const course = data.current_course;
    if (!course) return null;

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
    const data = await this.getDashboard(userId);
    const course = data.current_course;
    if (!course) return null;

    return {
      badge: "Keep Going!",
      title: `${course.remaining_modules} Modules Almost Done`,
      description: "You're making amazing progress! Finish your courses and unlock new achievements.",
      buttonText: "Continue Learning"
    };
  },

  async getCourseProgressData(userId) {
    const data = await this.getDashboard(userId);
    const course = data.current_course;
    if (!course) return null;

    return {
      title: course.course_name,
      subtitle: `Day ${course.current_day} of ${course.duration_days}`,
      percent: Number(course.progress_percentage || 0),
      startDate: course.start_date,
      endDate: course.end_date,
      chartPoints: Array.isArray(course.day_wise_progress) ? course.day_wise_progress : []
    };
  },

  async getProfileViewData(userId) {
    try {
      const data = await this.getDashboard(userId);
      return {
        name: data.name || data.employee_id || "Student",
        email: data.email || ""
      };
    } catch (error) {
      console.error(error);
      return { name: "Student", email: "" };
    }
  }
};

export default dashboardService;