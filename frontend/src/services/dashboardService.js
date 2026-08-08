// dashboardService.js
// Service providing mock data for the Home page dashboard.

const dashboardService = {
  getUserProfile() {
    return {
      name: "Name",
      email: "h.tech@email.com"
    };
  },

  getOverviewStats() {
    return [
      {
        id: "current-course",
        title: "Core Java",
        label: "Course Enrolled",
        icon: "book-open", // represented by a book-like SVG/icon
        color: "blue"
      },
      {
        id: "modules-completed",
        title: "5",
        label: "Modules Completed",
        icon: "check-circle",
        color: "green"
      },
      {
        id: "overall-completion",
        title: "10.3%",
        label: "Over All Completion",
        icon: "trending-up",
        color: "blue"
      },
      {
        id: "courses-enrolled",
        title: "0",
        label: "Course Enrolled",
        icon: "alert-circle",
        color: "red"
      }
    ];
  },

  getKeepGoingData() {
    return {
      badge: "Keep Going!",
      title: "61 Modules Almost Done",
      description: "You're making amazing progress! Finish your courses and unlock new achievements.",
      buttonText: "Continue Learning"
    };
  },

  getTimeSpentData() {
    return {
      badge: "Time spent",
      categories: [
        {
          id: "learning-contents",
          title: "5 Day",
          hours: "05:00 hrs",
          label: "Learning Contents",
          color: "#3563e9" // Primary Blue
        },
        {
          id: "assessment",
          title: "",
          hours: "02:03:30 hrs",
          label: "Assessment",
          color: "#5c6f84" // Charcoal Gray
        },
        {
          id: "practice",
          title: "",
          hours: "00:00:40 hrs",
          label: "Practice",
          color: "#0dcd94" // Accent Green
        }
      ]
    };
  },

  getCourseProgressData() {
    return {
      title: "Core Java",
      subtitle: "Day 7 of 12",
      percent: 48,
      startDate: "13 May, 26",
      endDate: "13 May, 26",
      chartPoints: [
        { day: 0, percentage: 0 },
        { day: 4, percentage: 35 },
        { day: 8, percentage: 40 },
        { day: 12, percentage: 48 }
      ]
    };
  },

  getProgressOverview() {
    return {
      percentage: 58,
      completedModules: 48,
      totalModules: 48,
      completedAssessments: 2,
      totalAssessments: 3,
      insights: [
        {
          title: "You learn best at 9:00 AM",
          description: "Based on your completion patterns"
        },
        {
          title: "20% ahead of average pace",
          description: "You're making excellent progress!"
        },
        {
          title: "Estimated completion: May 22, 2026",
          description: "2 days earlier than scheduled"
        }
      ],
      assessments: [
        {
          id: "java-basics",
          title: "Java Basics Quiz",
          status: "Passed",
          score: 85,
          total: 100,
          details: "Score: 85/100"
        },
        {
          id: "oop-mid",
          title: "OOP Mid-Assessment",
          status: "Passed",
          score: 78,
          total: 100,
          details: "Score: 78/100"
        },
        {
          id: "data-structures",
          title: "Data Structures Quiz",
          status: "Upcoming",
          score: null,
          total: null,
          details: "Not yet taken"
        }
      ]
    };
  },

  getProfileData() {
    return {
      name: "Name",
      email: "hexaware.tech@email.com",
      sidebarEmail: "h.tech@email.com"
    };
  }
};

export default dashboardService;
