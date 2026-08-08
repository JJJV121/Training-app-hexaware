// scheduleService.js
// Service providing mock data for the Weekly Schedule.

const scheduleService = {
  getScheduleData() {
    return {
      title: "Weekly Schedule",
      stats: [
        { label: "Modules", value: 64, color: "#3563e9" }, // Blue
        { label: "Sections", value: 12, color: "#0dcd94" }, // Green/Teal
        { label: "Days", value: 12, color: "#ff9f43" }, // Orange/Yellow
        { label: "Total Hours/Week", value: "26 hrs", color: "#1a202c" } // Text Dark
      ],
      timeSlots: [
        "09:00\nto\n10:30",
        "10:45\nto\n12:15",
        "12:30\nto\n14:00",
        "14:15\nto\n15:45",
        "16:00\nto\n17:30"
      ],
      days: ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"],
      events: [
        {
          day: "MONDAY",
          timeSlot: "09:00\nto\n10:30",
          type: "LECTURE",
          title: "Data Structures &",
          code: "CS201",
          instructor: "Dr. Smith",
          colorClass: "lecture-blue"
        },
        {
          day: "TUESDAY",
          timeSlot: "09:00\nto\n10:30",
          type: "SECTION",
          title: "Web Developm",
          code: "CS310",
          instructor: "Prof. Johnson",
          colorClass: "section-green"
        },
        {
          day: "TUESDAY",
          timeSlot: "10:45\nto\n12:15",
          type: "LECTURE",
          title: "Software Engineering",
          code: "CS315",
          instructor: "Dr. Williams",
          colorClass: "lecture-blue"
        },
        {
          day: "THURSDAY",
          timeSlot: "10:45\nto\n12:15",
          type: "LECTURE",
          title: "Software Engineering",
          code: "CS315",
          instructor: "Dr. Williams",
          colorClass: "lecture-blue"
        },
        {
          day: "WEDNESDAY",
          timeSlot: "12:30\nto\n14:00",
          type: "LAB",
          title: "Database",
          code: "CS320",
          instructor: "Prof. Davis",
          colorClass: "lab-blue"
        },
        {
          day: "MONDAY",
          timeSlot: "14:15\nto\n15:45",
          type: "LECTURE",
          title: "Machine Learning",
          code: "CS401",
          instructor: "Dr. Martinez",
          colorClass: "lecture-blue"
        },
        {
          day: "WEDNESDAY",
          timeSlot: "14:15\nto\n15:45",
          type: "SECTION",
          title: "Cloud Computing",
          code: "CS405",
          instructor: "Prof. Anderson",
          colorClass: "section-green"
        }
      ]
    };
  }
};

export default scheduleService;
