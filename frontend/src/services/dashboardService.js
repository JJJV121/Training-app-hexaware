// dashboardService.js
import apiClient from './apiClient';

const dashboardService = {
  _cache: {}, // key -> { data, timestamp }
  _pendingRequests: {}, // key -> Promise

  // Reusable core fetch function
  async getDashboard(userId, courseId = null) {
    if (!userId) return null;

    const selectedCourseId = courseId !== null && courseId !== undefined
      ? Number(courseId)
      : (Number(localStorage.getItem('selected_course_id')) || null);

    const cacheKey = `${userId}_${selectedCourseId || 'default'}`;

    if (this._pendingRequests[cacheKey]) {
      return this._pendingRequests[cacheKey];
    }

    const cached = this._cache[cacheKey];
    const now = Date.now();
    if (cached && (now - cached.timestamp < 10000)) {
      return cached.data;
    }

    const promise = (async () => {
      try {
        console.log("Loading dashboard from backend for user:", userId, "course:", selectedCourseId || "default");
        const response = await apiClient.get(`/dashboard/${userId}`, {
          params: selectedCourseId ? { course_id: selectedCourseId } : {}
        });
        console.log("Dashboard Response:", response.data);

        const data = response.data;
        if (data && data.course) {
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

        if (data?.course?.id) {
          localStorage.setItem('selected_course_id', String(data.course.id));
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
      name: data?.name || "Student",
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
        name: data?.name || "Student",
        email: data?.email || ""
      };
    } catch (error) {
      console.error(error);
      return { name: "Student", email: "" };
    }
  }
};

export default dashboardService;