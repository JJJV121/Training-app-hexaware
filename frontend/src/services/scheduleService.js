// scheduleService.js

import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

const scheduleService = {
  async getScheduleData(userId = 1) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/schedule/${userId}`
      );

      const api = response.data;

      const timeSlots = [
        "09:00\nto\n10:30",
        "10:45\nto\n12:15",
        "12:30\nto\n14:00",
        "14:15\nto\n15:45",
        "16:00\nto\n17:30",
        "17:45\nto\n19:15",
        "19:30\nto\n21:00"
      ];

      const events = [];

      api.schedule.forEach(day => {
        day.sessions.forEach(session => {
          events.push({
            day: day.weekday.toUpperCase(),

            timeSlot: `${session.start_time}\nto\n${session.end_time}`,

            type: session.completed ? "COMPLETED" : "LECTURE",

            title: session.title,

            code: `LU-${session.learning_unit_id}`,

            instructor: "",

            colorClass: session.completed
              ? "section-green"
              : "lecture-blue"
          });
        });
      });

      return {
        title: api.course_name,

        stats: [
          {
            label: "Modules",
            value: api.summary.total_modules,
            color: "#3563e9"
          },
          {
            label: "Sections",
            value: api.summary.total_sections,
            color: "#0dcd94"
          },
          {
            label: "Days",
            value: api.summary.total_days,
            color: "#ff9f43"
          },
          {
            label: "Total Hours",
            value: `${api.summary.total_hours} hrs`,
            color: "#1a202c"
          }
        ],

        timeSlots,

        days: [...new Set(api.schedule.map(day => day.weekday.toUpperCase()))],

        events
      };
    } catch (error) {
      console.error("Error fetching schedule:", error);
      throw error;
    }
  }
};

export default scheduleService;