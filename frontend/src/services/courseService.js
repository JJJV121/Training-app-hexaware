// courseService.js
// Service providing mock data for the Course page.

const courseService = {
  getCourseData() {
    return {
      title: "Core Java",
      category: "COURSE CONTENT",
      progress: 58,
      currentDay: 7,
      totalDays: 12,
      tabs: ["Content", "Overview"],
      modules: [
        {
          id: 1,
          title: "Problem Solving Techniques and Data Structures",
          dayLabel: "DAY 1",
          lessons: [
            {
              id: "m1-l1",
              title: "Algorithm Basics",
              duration: "2H",
              videos: 4,
              hasNotes: true,
              completed: true
            },
            {
              id: "m1-l2",
              title: "Data Structures Basics",
              duration: "1.5H",
              videos: 4,
              hasNotes: true,
              completed: true
            },
            {
              id: "m1-l3",
              title: "Sorting Techniques",
              duration: "1.5H",
              videos: 3,
              hasNotes: true,
              completed: true
            }
          ]
        },
        {
          id: 2,
          title: "Advanced Java Concepts",
          dayLabel: "DAY 2",
          lessons: [
            {
              id: "m2-l1",
              title: "Object-Oriented Programming",
              duration: "2H",
              videos: 5,
              hasNotes: true,
              completed: true
            },
            {
              id: "m2-l2",
              title: "Inheritance and Polymorphism",
              duration: "1.5H",
              videos: 3,
              hasNotes: true,
              completed: false // empty checkbox
            }
          ]
        }
      ]
    };
  }
};

export default courseService;
