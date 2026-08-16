// dashboardService.js
import axios from 'axios';

// Set to false to use mock data
const IS_BACKEND_RUNNING = false;

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
  _cache: {}, // key -> { data, timestamp }
  _pendingRequests: {}, // key -> Promise
 
  // Reusable core fetch function
  async getDashboard(userId, courseId = null) {
    if (!userId) return null;
    const activeCourseId = courseId ? Number(courseId) : 1;
    const cacheKey = `${userId}_${activeCourseId}`;
 
    // Deduplicate concurrent requests
    if (this._pendingRequests[cacheKey]) {
      return this._pendingRequests[cacheKey];
    }
 
    // Return cached data if fresh (less than 10 seconds old)
    const cached = this._cache[cacheKey];
    const now = Date.now();
    if (cached && (now - cached.timestamp < 10000)) {
      return cached.data;
    }
 
    const promise = (async () => {
      try {
        if (!IS_BACKEND_RUNNING) {
          await sleep();
          const mockData = {
            name: "John",
            employee_id: "EMP001",
            email: "emp001@example.com",
            courses_enrolled: 2,
            course: activeCourseId === 2 ? {
              id: 2,
              name: "C# Digital Foundation",
              current_day: 9,
              total_days: 16,
              remaining_modules: 15,
              completed_modules: 25,
              total_modules: 40,
              completed_percentage: 62.5,
              start_date: "2026-07-01",
              end_date: "2026-07-25",
              motivation_message: "Keep pushing!"
            } : {
              id: 1,
              name: "Java Training",
              current_day: 5,
              total_days: 16,
              remaining_modules: 40,
              completed_modules: 5,
              total_modules: 45,
              completed_percentage: 31.25,
              start_date: "2026-06-29",
              end_date: "2026-07-14",
              motivation_message: "Great Progress!"
            },
            progress: activeCourseId === 2 ? {
              completed_days: 9,
              remaining_days: 7
            } : {
              completed_days: 5,
              remaining_days: 11
            },
            time_spent: activeCourseId === 2 ? {
              learning_hours: 32.5,
              assessment_hours: 15,
              practice_hours: 12,
              revision_hours: 4
            } : {
              learning_hours: 19.75,
              assessment_hours: 10,
              practice_hours: 5,
              revision_hours: 2
            },
            continue_learning: activeCourseId === 2 ? {
              course_id: 2,
              day: 9,
              module_id: 15
            } : {
              course_id: 1,
              day: 5,
              module_id: 27
            },
            enrolled_courses: [
              {
                course_id: 1,
                course_name: "Java Training",
                progress: 31.25,
                start_date: "2026-06-29",
                end_date: "2026-07-14",
                completion_percentage: 31.25
              },
              {
                course_id: 2,
                course_name: "C# Digital Foundation",
                progress: 62.5,
                start_date: "2026-07-01",
                end_date: "2026-07-25",
                completion_percentage: 62.5
              }
            ]
          };
 
          // Backwards compatibility layer
          mockData.current_course = {
            current_day: mockData.course.current_day,
            course_id: mockData.course.id,
            course_name: mockData.course.name,
            duration_days: mockData.course.total_days,
            start_date: mockData.course.start_date,
            end_date: mockData.course.end_date,
            progress_percentage: mockData.course.completed_percentage
          };
 
          this._cache[cacheKey] = { data: mockData, timestamp: Date.now() };
          return mockData;
        }
 
        console.log("Loading dashboard for user:", userId, "course:", activeCourseId);
        const response = await apiClient.get(`/dashboard/${userId}?courseId=${activeCourseId}`);
        console.log("Dashboard Response:", response.data);
 
        const data = response.data;
        if (data && data.course) {
          // Backwards compatibility injector
          data.current_course = {
            current_day: data.course.current_day,
            course_id: data.course.id,
            course_name: data.course.name,
            duration_days: data.course.total_days,
            start_date: data.course.start_date,
            end_date: data.course.end_date,
            progress_percentage: data.course.completed_percentage
          };
        }
 
        this._cache[cacheKey] = { data, timestamp: Date.now() };
        return data;
      } finally {
        delete this._pendingRequests[cacheKey];
      }
    })();
 
    this._pendingRequests[cacheKey] = promise;
    return promise;
  },

  // Reusable function to get current course
  async getCurrentCourse(userId) {
    const data = await this.getDashboard(userId);
    return data?.course || null;
  },

  // Reusable function to get progress
  async getProgress(userId) {
    const data = await this.getDashboard(userId);
    if (!data || !data.course) return null;
    return {
      percent: Number(data.course.completed_percentage || 0),
      completed_days: Number(data.progress?.completed_days || 0),
      total_days: Number(data.course.total_days || 0)
    };
  },

  // Legacy wrappers for backward compatibility (calling our deduplicated cache)
  async getDashboardData(userId) {
    return this.getDashboard(userId);
  },

  async getUserProfile(userId) {
    const data = await this.getDashboard(userId);
    return {
      name: data?.name || data?.employee_id || "Student",
      email: data?.email || ""
    };
  },

  async getOverviewStats(userId) {
    const data = await this.getDashboard(userId);
    const course = data?.course;
    if (!course) return [];
    return [
      {
        id: "current-course",
        title: course.name,
        label: "Course Enrolled",
        icon: "book-open",
        color: "blue"
      },
      {
        id: "modules-completed",
        title: String(course.total_days - data.progress?.remaining_days || 0),
        label: "Modules Completed",
        icon: "check-circle",
        color: "green"
      },
      {
        id: "overall-completion",
        title: `${course.completed_percentage}%`,
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
    if (!data || !data.time_spent) return null;
    return data.time_spent;
  },

  async getKeepGoingData(userId) {
    const data = await this.getDashboard(userId);
    const course = data?.course;
    if (!course) return null;

    return {
      badge: "Keep Going!",
      title: `${course.remaining_modules} Modules Remaining`,
      description: `Currently on Day ${course.current_day} of ${course.name} (${course.completed_percentage}% Completed). ${course.motivation_message}`,
      buttonText: "Continue Learning"
    };
  },

  async getCourseProgressData(userId) {
    const data = await this.getDashboard(userId);
    const course = data?.course;
    if (!course) return null;

    return {
      title: course.name,
      subtitle: `Day ${course.current_day} of ${course.total_days}`,
      percent: Number(course.completed_percentage || 0),
      startDate: course.start_date,
      endDate: course.end_date
    };
  },

  async getProfileViewData(userId) {
    try {
      const data = await this.getDashboard(userId);
      return {
        name: data?.name || data?.employee_id || "Student",
        email: data?.email || ""
      };
    } catch (error) {
      console.error(error);
      return { name: "Student", email: "" };
    }
  }
};

export default dashboardService;