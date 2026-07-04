// courseService.js
// Service providing real API calls using Axios, with a built-in fallback to Mock Data.
import axios from 'axios';

// Vite-safe environment variable lookup with standard local fallback
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';

// Create a pre-configured Axios client instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 👉 TOGGLE THIS TO FALSE WHEN YOUR BACKEND IS READY
const USE_MOCK_DATA = true; 

// Helper to simulate network latency for mock data
const sleep = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

const courseService = {
  // 1. Fetch full course relational structure (Course -> Days -> Units)
  async getCourseContent(courseId) {
    if (USE_MOCK_DATA) {
      await sleep();
      return {
        course_id: String(courseId), // Normalized to string
        course_name: "C# Digital Foundation",
        duration_days: 16,
        days: [
          {
            day_id: "1",
            day_number: 1,
            title: "Introduction & Setup",
            learning_units: [
              { id: "101", title: "What is C#?", type: "theory" },
              { id: "102", title: "Setting up Visual Studio", type: "video" },
              { id: "103", title: "Writing Your First Program", type: "video" }
            ]
          },
          {
            day_id: "2",
            day_number: 2,
            title: "Variables & Data Types",
            learning_units: [
              { id: "104", title: "Primitive Types", type: "theory" },
              { id: "105", title: "Working with Strings", type: "video" }
            ]
          }
        ]
      };
    }
    const response = await apiClient.get(`/courses/${courseId}/content`);
    return response.data;
  },

  // 2. Fetch current user progress tracking metrics for a specific course
  async getCourseProgress(courseId, userId) {
    if (USE_MOCK_DATA) {
      await sleep();
      return {
        course_id: String(courseId),
        user_id: String(userId),
        progress_percentage: 100.0,
        // Mark every lesson in the mock course as complete so assignments unlock in demo mode.
        completed_learning_units: ["101", "102", "103", "104", "105"],
        completed_videos: [
          "10101", "10102", "10103", "10104",
          "10201", "10202", "10203", "10204",
          "10301", "10302", "10303", "10304",
          "10401", "10402", "10403", "10404",
          "10501", "10502", "10503", "10504"
        ]
      };
    }
    const response = await apiClient.get(`/progress/course/${courseId}/user/${userId}`);
    return response.data;
  },

  // 3. Mark a learning topic unit as complete for a user
  async markUnitComplete(userId, learningUnitId) {
    if (USE_MOCK_DATA) {
      await sleep(300);
      return { success: true, message: `Unit ${learningUnitId} marked complete.` };
    }
    const response = await apiClient.post(`/progress/${userId}/${learningUnitId}/complete`);
    return response.data;
  },

  // 4. Revert a learning topic unit back to incomplete status
  async markUnitIncomplete(userId, learningUnitId) {
    if (USE_MOCK_DATA) {
      await sleep(300);
      return { success: true, message: `Unit ${learningUnitId} marked incomplete.` };
    }
    const response = await apiClient.post(`/progress/${userId}/${learningUnitId}/incomplete`);
    return response.data;
  },

  // 5. Query lecture streaming media files tied to a unit node
  async getUnitVideos(learningUnitId) {
    if (USE_MOCK_DATA) {
      await sleep();
      // 🛠️ ALIGNED FIX: Removed parseInt() so video IDs are strictly generated as Strings
      return [
        {
          id: `${learningUnitId}01`, 
          title: "Part 1: The Basics",
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "02:15"
        },
        {
          id: `${learningUnitId}02`,
          title: "Part 2: Core Implementation",
          url: "https://res.cloudinary.com/dqtotv05r/video/upload/q_auto/f_auto/v1781008049/Day_1_Algorithm_Basics_zcfxd7.mp4",
          duration: "04:30"
        },
        {
          id: `${learningUnitId}03`,
          title: "Part 3: Advanced Concepts",
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "06:10"
        },
        {
          id: `${learningUnitId}04`,
          title: "Part 4: Summary & Review",
          url: "https://www.w3schools.com/html/mov_bbb.mp4",
          duration: "01:45"
        }
      ];
    }
    const response = await apiClient.get(`/courses/units/${learningUnitId}/videos`);
    return response.data;
  },

  // 6. API call to mark an individual video as complete (needed to trigger the next unlock)
  async markVideoComplete(userId, videoId) {
    if (USE_MOCK_DATA) {
      await sleep(300);
      console.log(`[MOCK API] Video ${videoId} marked complete for user ${userId}. Next video unlocked!`);
      return { success: true, message: `Video ${videoId} marked complete.` };
    }
    const response = await apiClient.post(`/progress/${userId}/video/${videoId}/complete`);
    return response.data;
  },

  // 7. Pull theory notes or documentation summaries for a specific topic
  async getUnitNotes(learningUnitId) {
    if (USE_MOCK_DATA) {
      await sleep();
      return {
        id: String(learningUnitId),
        content: `<h3>Key Concepts for Unit ${learningUnitId}</h3><p>This is mock theory data. In a real scenario, this would be rich HTML or Markdown text stored in your database explaining the concept in detail.</p>`
      };
    }
    const response = await apiClient.get(`/courses/units/${learningUnitId}/content`);
    return response.data;
  },

  // 8. Extract discussion forum/board records assigned to a learning segment
  async getUnitQA(learningUnitId) {
    if (USE_MOCK_DATA) {
      await sleep();
      return [
        {
          id: "1",
          question: "Why do we use var instead of explicit types?",
          answer: "Using var relies on the compiler to infer the type, making the code cleaner when the type is obvious from the right side of the assignment.",
          asked_by: "Alice",
          answered_by: "Instructor Bob"
        },
        {
          id: "2",
          question: "Does this work on Mac?",
          answer: "Yes, you can use Visual Studio for Mac or VS Code with the C# Dev Kit extension.",
          asked_by: "Charlie",
          answered_by: "Instructor Bob"
        }
      ];
    }
    const response = await apiClient.get(`/courses/units/${learningUnitId}/qa`);
    return response.data;
  },

  // 9. Fetch courses the user is NOT enrolled in
  async getAvailableCourses(userId) {
    if (USE_MOCK_DATA) {
      await sleep();
      return [
        { id: "1", title: "C# Digital Foundation", duration: "16 Days", level: "Beginner" },
        { id: "2", title: "Java Core Architecture", duration: "12 Days", level: "Intermediate" },
        { id: "3", title: "React Frontend Mastery", duration: "20 Days", level: "Advanced" }
      ];
    }
    try {
      const response = await apiClient.get(`/courses/available/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching available courses:", error);
      return []; 
    }
  }
};

export default courseService;
