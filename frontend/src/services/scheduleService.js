// scheduleService.js

import axios from "axios";

const API_BASE_URL = "http://localhost:8000";
const USE_MOCK_DATA = false;

const mockScheduleData = {
  course_name: "Frontend Development Bootcamp",
  summary: {
    total_modules: 16,
    total_sections: 32,
    total_days: 28,
    total_hours: 96
  },
  weeks: [
    {
      label: "Week 1",
      range: "Jul 28 - Aug 03",
      days: [
        {
          name: "Monday",
          shortName: "Mon",
          date: "28",
          status: "inprogress",
          sessions: [
            {
              start_time: "09:00",
              end_time: "10:30",
              title: "React Fundamentals",
              learning_unit_id: 101,
              completed: false,
              description: "Introduction to components and JSX"
            },
            {
              start_time: "10:45",
              end_time: "12:15",
              title: "State Management",
              learning_unit_id: 102,
              completed: true,
              description: "Hooks and shared state patterns"
            }
          ]
        },
        {
          name: "Tuesday",
          shortName: "Tue",
          date: "29",
          status: "upcoming",
          sessions: [
            {
              start_time: "09:00",
              end_time: "10:30",
              title: "Component Design",
              learning_unit_id: 103,
              completed: true,
              description: "Reusable UI patterns"
            },
            {
              start_time: "14:15",
              end_time: "15:45",
              title: "API Integration",
              learning_unit_id: 104,
              completed: true,
              description: "Connecting the UI to REST services"
            }
          ]
        },
        {
          name: "Wednesday",
          shortName: "Wed",
          date: "30",
          status: "upcoming",
          sessions: [
            {
              start_time: "11:00",
              end_time: "12:30",
              title: "Testing Basics",
              learning_unit_id: 105,
              completed: false,
              description: "Unit testing with Vitest"
            }
          ]
        },
        {
          name: "Thursday",
          shortName: "Thu",
          date: "31",
          status: "upcoming",
          sessions: [
            {
              start_time: "15:00",
              end_time: "16:30",
              title: "Routing",
              learning_unit_id: 106,
              completed: false,
              description: "Page navigation and layouts"
            }
          ]
        },
        {
          name: "Friday",
          shortName: "Fri",
          date: "01",
          status: "upcoming",
          sessions: [
            {
              start_time: "09:00",
              end_time: "10:30",
              title: "Accessibility",
              learning_unit_id: 107,
              completed: false,
              description: "Inclusive UI practices"
            }
          ]
        },
        {
          name: "Saturday",
          shortName: "Sat",
          date: "02",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Sunday",
          shortName: "Sun",
          date: "03",
          status: "upcoming",
          sessions: []
        }
      ]
    },
    {
      label: "Week 2",
      range: "Aug 04 - Aug 10",
      days: [
        {
          name: "Monday",
          shortName: "Mon",
          date: "04",
          status: "upcoming",
          sessions: [
            {
              start_time: "09:00",
              end_time: "10:30",
              title: "Forms and Validation",
              learning_unit_id: 201,
              completed: false,
              description: "Controlled inputs and validation"
            }
          ]
        },
        {
          name: "Tuesday",
          shortName: "Tue",
          date: "05",
          status: "upcoming",
          sessions: [
            {
              start_time: "10:45",
              end_time: "12:15",
              title: "Performance Tips",
              learning_unit_id: 202,
              completed: false,
              description: "Optimizing rendering and bundles"
            }
          ]
        },
        {
          name: "Wednesday",
          shortName: "Wed",
          date: "06",
          status: "upcoming",
          sessions: [
            {
              start_time: "13:00",
              end_time: "14:30",
              title: "Deployment",
              learning_unit_id: 203,
              completed: false,
              description: "Publishing your app"
            }
          ]
        },
        {
          name: "Thursday",
          shortName: "Thu",
          date: "07",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Friday",
          shortName: "Fri",
          date: "08",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Saturday",
          shortName: "Sat",
          date: "09",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Sunday",
          shortName: "Sun",
          date: "10",
          status: "upcoming",
          sessions: []
        }
      ]
    },
    {
      label: "Week 3",
      range: "Aug 11 - Aug 17",
      days: [
        {
          name: "Monday",
          shortName: "Mon",
          date: "11",
          status: "upcoming",
          sessions: [
            {
              start_time: "09:30",
              end_time: "11:00",
              title: "Stateful Forms",
              learning_unit_id: 301,
              completed: false,
              description: "Designing advanced forms"
            }
          ]
        },
        {
          name: "Tuesday",
          shortName: "Tue",
          date: "12",
          status: "upcoming",
          sessions: [
            {
              start_time: "10:00",
              end_time: "11:30",
              title: "Animations",
              learning_unit_id: 302,
              completed: false,
              description: "Motion and transitions"
            }
          ]
        },
        {
          name: "Wednesday",
          shortName: "Wed",
          date: "13",
          status: "upcoming",
          sessions: [
            {
              start_time: "13:30",
              end_time: "15:00",
              title: "Auth Workflows",
              learning_unit_id: 303,
              completed: false,
              description: "Login, logout, and protected routes"
            }
          ]
        },
        {
          name: "Thursday",
          shortName: "Thu",
          date: "14",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Friday",
          shortName: "Fri",
          date: "15",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Saturday",
          shortName: "Sat",
          date: "16",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Sunday",
          shortName: "Sun",
          date: "17",
          status: "upcoming",
          sessions: []
        }
      ]
    },
    {
      label: "Week 4",
      range: "Aug 18 - Aug 24",
      days: [
        {
          name: "Monday",
          shortName: "Mon",
          date: "18",
          status: "upcoming",
          sessions: [
            {
              start_time: "09:00",
              end_time: "10:30",
              title: "Project Setup",
              learning_unit_id: 401,
              completed: false,
              description: "Kickoff the capstone project"
            }
          ]
        },
        {
          name: "Tuesday",
          shortName: "Tue",
          date: "19",
          status: "upcoming",
          sessions: [
            {
              start_time: "10:30",
              end_time: "12:00",
              title: "Capstone Build",
              learning_unit_id: 402,
              completed: false,
              description: "Implementing project features"
            }
          ]
        },
        {
          name: "Wednesday",
          shortName: "Wed",
          date: "20",
          status: "upcoming",
          sessions: [
            {
              start_time: "14:00",
              end_time: "15:30",
              title: "Review and Feedback",
              learning_unit_id: 403,
              completed: false,
              description: "Peer review and refinements"
            }
          ]
        },
        {
          name: "Thursday",
          shortName: "Thu",
          date: "21",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Friday",
          shortName: "Fri",
          date: "22",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Saturday",
          shortName: "Sat",
          date: "23",
          status: "upcoming",
          sessions: []
        },
        {
          name: "Sunday",
          shortName: "Sun",
          date: "24",
          status: "upcoming",
          sessions: []
        }
      ]
    }
  ]
};

function transformScheduleResponse(api, weekNumber = 0) {
  let weeks = [];

  if (api.weeks) {
    weeks = api.weeks.map((week) => ({
      ...week,
      days: (week.days || []).map((day) => ({
        ...day,
        sessions: (day.sessions || []).map((session) => ({ ...session }))
      }))
    }));
  } else if (api.schedule) {
    // Map backend schedule to weeks format
    const days = api.schedule.map((day) => {
      const dateParts = day.date.split("-");
      const dayDate = dateParts[2] ? dateParts[2].replace(/^0+/, '') : "";
      
      const shortWeekday = day.weekday ? day.weekday.substring(0, 3) : "";
      const frontendStatus = day.status === "current" ? "inprogress" : day.status;

      return {
        name: day.weekday,
        shortName: shortWeekday,
        date: dayDate,
        status: frontendStatus,
        sessions: (day.sessions || []).map((session) => ({
          ...session
        }))
      };
    });

    const formatDate = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "";
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return `${months[d.getMonth()]} ${String(d.getDate()).padStart(2, '0')}`;
    };

    const startRange = api.schedule.length > 0 ? formatDate(api.schedule[0].date) : "";
    const endRange = api.schedule.length > 0 ? formatDate(api.schedule[api.schedule.length - 1].date) : "";
    const range = startRange && endRange ? `${startRange} - ${endRange}` : "";

    weeks = [
      {
        label: `Week ${weekNumber + 1}`,
        range: range,
        days: days
      }
    ];
  }

  return {
    title: api.course_name,
    stats: [
      {
        label: "Modules",
        value: api.summary?.total_modules || 0,
        color: "#3563e9"
      },
      {
        label: "Sections",
        value: api.summary?.total_sections || 0,
        color: "#0dcd94"
      },
      {
        label: "Days",
        value: api.summary?.total_days || 0,
        color: "#ff9f43"
      },
      {
        label: "Total Hours",
        value: `${api.summary?.total_hours || 0} hrs`,
        color: "#1a202c"
      }
    ],
    weeks
  };
}

const scheduleService = {
  async getScheduleData(userId = 1, weekNumber = 0) {
    if (USE_MOCK_DATA) {
      // Return only requested week from mock data
      const allWeeks = mockScheduleData.weeks;
      const week = allWeeks[weekNumber] || allWeeks[0];
      return transformScheduleResponse({
        ...mockScheduleData,
        weeks: [week]
      }, weekNumber);
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/schedule/${userId}`, {
        params: { week: weekNumber }
      });
      return transformScheduleResponse(response.data, weekNumber);
    } catch (error) {
      console.warn("Backend unavailable, using mock schedule data:", error);
      const allWeeks = mockScheduleData.weeks;
      const week = allWeeks[weekNumber] || allWeeks[0];
      return transformScheduleResponse({
        ...mockScheduleData,
        weeks: [week]
      }, weekNumber);
    }
  }
};

export default scheduleService;