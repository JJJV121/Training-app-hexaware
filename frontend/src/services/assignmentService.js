// services/assignmentService.js
import axios from 'axios';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL)
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 👉 SET TO TRUE IF BACKEND IS NOT RUNNING YET
const USE_MOCK_DATA = true; 

const sleep = (ms = 600) => new Promise(resolve => setTimeout(resolve, ms));

export const assignmentService = {
  // Fetch assignments for the selected module/day
  getAvailableAssignments: async (courseDayId) => {
    if (USE_MOCK_DATA) {
      await sleep();
      return [
        {
          id: "asgn_101",
          title: "C# Core Syntax & Interactive Console I/O",
          description: "Develop a console application that captures user profile metrics, computes tax brackets based on local allowances, and generates a formatted text payload output. Code must follow strict encapsulation patterns.",
          file_path: "/storage/starters/csharp_basics_io.zip"
        }
      ];
    }

    const response = await apiClient.get(`/assignments/trainee/assignments`, {
      params: { course_day_id: courseDayId }
    });
    return response.data;
  },

  // Fetch student's submission states
  getMySubmissions: async () => {
    if (USE_MOCK_DATA) {
      await sleep();
      return []; // Return empty array to test a fresh, unsubmitted workflow
    }
    const response = await apiClient.get(`/assignments/trainee/my-submissions`);
    return response.data;
  },

  // STEP 1: Download assignment instruction package
  downloadAssignment: async (assignmentId) => {
    if (USE_MOCK_DATA) {
      await sleep(300);
      return new Blob(["Mock Starter Package Content"], { type: 'application/zip' });
    }
    const response = await apiClient.get(`/assignments/trainee/assignments/${assignmentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // STEP 2: Upload completed solution archive
  submitAssignment: async (assignmentId, file, userId) => {
    if (USE_MOCK_DATA) {
      await sleep(1200);
      return {
        success: true,
        submission: {
          id: `sub_${Math.floor(Math.random() * 1000)}`,
          assignment_id: assignmentId,
          user_id: userId,
          status: "SUBMITTED",
          marks: null,
          review_comments: null
        }
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', userId);

    const response = await apiClient.post(`/assignments/trainee/assignments/${assignmentId}/submit`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};
