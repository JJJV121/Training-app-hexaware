// mockDataService.js
// Centralized mock data service for the Hexaware Admin Platform.
// Acts as an in-memory database simulation to represent REST API states.

// 1. Initial Data Store
let colleges = ['IIT Madras', 'BITS Pilani', 'PSG Tech', 'Anna University', 'VIT Vellore'];

let students = [
  { id: 1, name: 'Ethan Carter', email: 'ethan.carter@hexaware.com', college: 'IIT Madras', course: 'Core Java Foundations', progress: 48, attendance: '96%', active: true, joinDate: '10 May, 2026', certUnlocked: false, grade: 'B+' },
  { id: 2, name: 'Olivia Bennett', email: 'olivia.bennett@hexaware.com', college: 'BITS Pilani', course: 'Python for Data Analysis', progress: 75, attendance: '94%', active: true, joinDate: '15 Apr, 2026', certUnlocked: true, grade: 'A' },
  { id: 3, name: 'Liam Anderson', email: 'liam.anderson@hexaware.com', college: 'PSG Tech', course: 'SQL & DBMS Essentials', progress: 100, attendance: '99%', active: true, joinDate: '01 Apr, 2026', certUnlocked: true, grade: 'A+' },
  { id: 4, name: 'Sophia Mitchell', email: 'sophia.mitchell@hexaware.com', college: 'Anna University', course: 'React Frontend Advanced', progress: 20, attendance: '88%', active: false, joinDate: '01 Jun, 2026', certUnlocked: false, grade: 'C' }
];

let trainers = [
  { id: 1, name: 'Dr. Ava Thompson', email: 'ava.thompson@hexaware.com', expertise: 'Java Enterprise', workload: 85, rating: 4.9, batches: ['Batch B21', 'Batch B22'], courses: ['Core Java Foundations', 'Java Microservices'], attendance: '98%', students: 45, comments: 'Extremely professional and highly rated by students.' },
  { id: 2, name: 'Prof. Noah Parker', email: 'noah.parker@hexaware.com', expertise: 'Python & AI', workload: 92, rating: 4.8, batches: ['Batch B25', 'Batch B26'], courses: ['Python for Data Analysis', 'Machine Learning'], attendance: '95%', students: 60, comments: 'Thorough explanations, highly academic yet practical.' },
  { id: 3, name: 'Dr. Mason Cooper', email: 'mason.cooper@hexaware.com', expertise: 'Database Systems', workload: 70, rating: 4.7, batches: ['Batch B20'], courses: ['SQL & DBMS Essentials'], attendance: '97%', students: 30, comments: 'Very interactive sessions, reviews student code regularly.' },
  { id: 4, name: 'Amelia Scott', email: 'amelia.scott@hexaware.com', expertise: 'React Frontend', workload: 60, rating: 4.6, batches: ['Batch B24'], courses: ['React Frontend Advanced'], attendance: '92%', students: 28, comments: 'Good project guidance, nice hands-on exercises.' }
];

let courses = [
  { id: 1, title: 'Core Java Foundations', category: 'Backend Development', trainer: 'Dr. Ava Thompson', duration: '12 Days', published: true, enrolled: 340, completionRate: 82, syllabusName: 'java_syllabus.pdf', resourcesCount: 14 },
  { id: 2, title: 'Python for Data Analysis', category: 'Data Science', trainer: 'Prof. Noah Parker', duration: '10 Days', published: true, enrolled: 280, completionRate: 75, syllabusName: 'python_data_syllabus.pdf', resourcesCount: 18 },
  { id: 3, title: 'SQL & DBMS Essentials', category: 'Database Systems', trainer: 'Dr. Mason Cooper', duration: '8 Days', published: true, enrolled: 190, completionRate: 92, syllabusName: 'sql_dbms_syllabus.pdf', resourcesCount: 10 },
  { id: 4, title: 'React Frontend Advanced', category: 'Frontend Development', trainer: 'Amelia Scott', duration: '15 Days', published: false, enrolled: 125, completionRate: 0, syllabusName: 'react_adv_syllabus.pdf', resourcesCount: 12 }
];

let courseAssignments = [
  { id: 1, type: 'Batch', targetName: 'Batch B21', course: 'Core Java Foundations', trainer: 'Dr. Ava Thompson', capacity: 30, remaining: 5, startDate: '2026-05-10', endDate: '2026-05-22' },
  { id: 2, type: 'Batch', targetName: 'Batch B25', course: 'Python for Data Analysis', trainer: 'Prof. Noah Parker', capacity: 40, remaining: 12, startDate: '2026-04-15', endDate: '2026-04-25' },
  { id: 3, type: 'Trainee', targetName: 'Ethan Carter', course: 'Core Java Foundations', trainer: 'Dr. Ava Thompson', capacity: 1, remaining: 0, startDate: '2026-05-10', endDate: '2026-06-10' },
  { id: 4, type: 'Trainee', targetName: 'Olivia Bennett', course: 'Python for Data Analysis', trainer: 'Prof. Noah Parker', capacity: 1, remaining: 0, startDate: '2026-04-15', endDate: '2026-05-15' }
];

let batches = [
  { id: 1, code: 'Batch B21', college: 'IIT Madras', course: 'Core Java Foundations', trainer: 'Dr. Ava Thompson', trainees: ['Ethan Carter', 'Sophia Mitchell'], strength: 25, timing: '09:00 AM - 11:00 AM', progress: 85, schedule: 'Mon, Wed, Fri' },
  { id: 2, code: 'Batch B22', college: 'BITS Pilani', course: 'Core Java Foundations', trainer: 'Dr. Ava Thompson', trainees: ['Olivia Bennett'], strength: 20, timing: '02:00 PM - 04:00 PM', progress: 48, schedule: 'Mon, Wed, Fri' },
  { id: 3, code: 'Batch B25', college: 'BITS Pilani', course: 'Python for Data Analysis', trainer: 'Prof. Noah Parker', trainees: ['Olivia Bennett', 'Liam Anderson'], strength: 28, timing: '11:00 AM - 01:00 PM', progress: 75, schedule: 'Tue, Thu, Sat' },
  { id: 4, code: 'Batch B20', college: 'PSG Tech', course: 'SQL & DBMS Essentials', trainer: 'Dr. Mason Cooper', trainees: ['Liam Anderson'], strength: 25, timing: '10:00 AM - 12:00 PM', progress: 100, schedule: 'Mon, Wed, Fri' },
  { id: 5, code: 'Batch B24', college: 'Anna University', course: 'React Frontend Advanced', trainer: 'Amelia Scott', trainees: ['Sophia Mitchell'], strength: 28, timing: '03:00 PM - 05:00 PM', progress: 20, schedule: 'Tue, Thu' }
];

let assignments = [
  { id: 1, type: 'Assignment', title: 'Object-Oriented Design Principles', course: 'Core Java Foundations', batch: 'Batch B21', deadline: '2026-07-20', totalMarks: 100, status: 'Posted', submissions: '22/25', pending: 3 },
  { id: 2, type: 'Assessment', title: 'Midterm Java Coding Skills Assessment', course: 'Core Java Foundations', batch: 'Batch B21', deadline: '2026-07-25', totalMarks: 50, status: 'Posted', submissions: '18/25', pending: 7 },
  { id: 3, type: 'Assignment', title: 'Pandas Data Cleansing Exercise', course: 'Python for Data Analysis', batch: 'Batch B25', deadline: '2026-07-18', totalMarks: 100, status: 'Posted', submissions: '28/28', pending: 0 },
  { id: 4, type: 'Assessment', title: 'React Hooks & State Management Quiz', course: 'React Frontend Advanced', batch: 'Batch B24', deadline: '2026-07-30', totalMarks: 50, status: 'Draft', submissions: '0/28', pending: 28 }
];

let submissions = [
  { id: 101, student: 'Ethan Carter', assignment: 'Object-Oriented Design Principles', file: 'OODPrinciples_Ethan.zip', submittedAt: 'Yesterday, 06:12 PM', status: 'Pending Review', score: '', remarks: '' },
  { id: 102, student: 'Olivia Bennett', assignment: 'Object-Oriented Design Principles', file: 'OODPrinciples_Olivia.zip', submittedAt: '2 days ago', status: 'Graded', score: '92', remarks: 'Excellent encapsulation logic, well documented.' },
  { id: 103, student: 'Sophia Mitchell', assignment: 'Data Structures Implementation', file: 'DataStructures_Sophia.java', submittedAt: 'Yesterday, 11:45 AM', status: 'Pending Review', score: '', remarks: '' }
];

let calendarEvents = [
  { id: 1, day: 10, type: 'Session', title: 'Spring Boot Q&A', batch: 'Batch B21', time: '09:00 AM', trainer: 'Dr. Ava Thompson', color: 'blue' },
  { id: 2, day: 15, type: 'Exam', title: 'Java Basics Midterm', batch: 'Batch B21', time: '10:00 AM', trainer: 'Dr. Ava Thompson', color: 'red' },
  { id: 3, day: 18, type: 'Deadline', title: 'Data Structures Assignment #2', batch: 'Batch B22', time: '11:59 PM', trainer: 'Dr. Ava Thompson', color: 'orange' },
  { id: 4, day: 20, type: 'Holiday', title: 'Muharram Public Holiday', batch: 'All', time: 'All Day', trainer: 'System', color: 'green' },
  { id: 5, day: 25, type: 'Event', title: 'Placement Drive & Mock Interviews', batch: 'Batch B20', time: '10:00 AM', trainer: 'Liam Anderson', color: 'blue' },
  { id: 6, day: 15, type: 'Session', title: 'Python Pandas Workshop', batch: 'Batch B25', time: '02:00 PM', trainer: 'Prof. Noah Parker', color: 'blue' }
];

let announcements = [
  { id: 1, title: 'Placement Drive registrations Open', content: 'Registrations for the upcoming Hexaware Placement Drive are now open. Please upload your latest resume by Monday.', target: 'All Students', date: 'Today, 10:00 AM', pinned: true },
  { id: 2, title: 'Schedule Change: Java Batch B21', content: 'Please note that the Core Java lecture scheduled for Wednesday has been shifted to Thursday morning at 09:00 AM.', target: 'Batch B21', date: 'Yesterday, 04:30 PM', pinned: false },
  { id: 3, title: 'Trainer Portal Performance Evaluations', content: 'LMS evaluation portal is open. Trainers are requested to update progress ratings for all active modules.', target: 'Trainers', date: '3 days ago', pinned: true }
];

let feedbacks = [
  { id: 1, name: 'Ethan Carter', role: 'Student', category: 'Suggestion', rating: 4, message: 'The hands-on Java exercises were excellent, but would love to have more backend database integration projects.', status: 'New', date: 'Today' },
  { id: 2, name: 'Dr. Ava Thompson', role: 'Trainer', category: 'Complaint', rating: 3, message: 'Vite compiler crashes periodically during student screensharing in Zoom sessions. Need bandwidth updates.', status: 'Pending Review', date: 'Yesterday' },
  { id: 3, name: 'Olivia Bennett', role: 'Student', category: 'Suggestion', rating: 5, message: 'Spring boot security guides are top-notch. Prof. Noah Parker explains JWT authentications amazingly well!', status: 'Resolved', date: '3 days ago' },
  { id: 4, name: 'Amelia Scott', role: 'Trainer', category: 'Complaint', rating: 4, message: 'LMS gradebook editor is lacking quick copy-paste columns. Adding multiple remarks is slightly sluggish.', status: 'Reviewed', date: '1 week ago' }
];

let notifications = [
  { id: 1, title: 'New Registration', message: 'Sophia Loren completed registration for Advanced React Course.', time: '10 mins ago', type: 'user', read: false },
  { id: 2, title: 'Trainer Allocation Completed', message: 'Dr. Sarah Connor successfully assigned to Core Java Foundations (Batch B22).', time: '1 hour ago', type: 'activity', read: false },
  { id: 3, title: 'Assignment Submission', message: 'Gopika Mohan submitted assignment: OOD Design Principles.', time: '2 hours ago', type: 'file-text', read: false },
  { id: 4, title: 'Batch Creation', message: 'Batch B26 created for Python for Data Analysis.', time: 'Yesterday', type: 'layers', read: true },
  { id: 5, title: 'System Security Patch', message: 'LMS gradebook database backup completed successfully.', time: '2 days ago', type: 'lock', read: true }
];

let activityLogs = [
  { id: 1, title: 'Course Published', desc: 'Core Java Foundations catalog was published to production draft.', user: 'Admin User', time: '10 mins ago', date: '2026-07-09', type: 'publish', color: 'blue' },
  { id: 2, title: 'Trainer Assigned', desc: 'Prof. Alan Turing allocated to Python for Data Analysis (Batch B25).', user: 'Admin User', time: '42 mins ago', date: '2026-07-09', type: 'assign', color: 'green' },
  { id: 3, title: 'Student Enrolled', desc: 'Sophia Loren enrolled in React Frontend Advanced Course.', user: 'System Registration', time: '2 hours ago', date: '2026-07-09', type: 'enroll', color: 'blue' },
  { id: 4, title: 'Password Reset', desc: 'Student Gopika Mohan requested and completed password reset.', user: 'System Trigger', time: '1 day ago', date: '2026-07-08', type: 'settings', color: 'orange' },
  { id: 5, title: 'Grade Published', desc: 'Java Assignment #3 grades published for Batch B21.', user: 'Dr. Sarah Connor', time: '2 days ago', date: '2026-07-07', type: 'grade', color: 'green' },
  { id: 6, title: 'Course Completed', desc: 'Naveen Raj finished all requirements for SQL & DBMS Course.', user: 'System Audit', time: '3 days ago', date: '2026-07-06', type: 'enroll', color: 'green' }
];

let reports = [
  { title: 'Student Performance & Grades', desc: 'Compilation of scores, course progresses, and pass/fail statuses.', type: 'Student Performance', icon: 'users' },
  { title: 'Trainer Workload & Feedback', desc: 'Overview of trainer ratings, workload indices, and batch feedback.', type: 'Trainer Audit', icon: 'user' },
  { title: 'Course Enrolled Metrics', desc: 'Comprehensive catalog audits, resources totals, and syllabus download logs.', type: 'Course Audit', icon: 'book-open' },
  { title: 'Attendance logs Audit', desc: 'Timetable attendance tallies by batch and individual trainees.', type: 'Attendance Audit', icon: 'clock' },
  { title: 'Assignment Submission Rates', desc: 'Deadlines submissions completion rates and grading remarks audit logs.', type: 'Assignment Audit', icon: 'file-text' }
];

let settings = {
  adminName: 'System Admin',
  adminEmail: 'admin@hexaware.com',
  platformName: 'Hexaware Learning Platform',
  passwordMinLength: 8,
  requireDigits: true,
  themeMode: 'Light'
};

// 2. Service API Interface (Getters & Setters simulating REST endpoints)
const mockDataService = {
  // Students API
  getStudents() {
    return [...students];
  },
  saveStudents(newStudents) {
    students = [...newStudents];
    return students;
  },
  addStudent(student) {
    students.push(student);
    return student;
  },

  // Trainers API
  getTrainers() {
    return [...trainers];
  },
  saveTrainers(newTrainers) {
    trainers = [...newTrainers];
    return trainers;
  },

  // Courses API
  getCourses() {
    return [...courses];
  },
  saveCourses(newCourses) {
    courses = [...newCourses];
    return courses;
  },

  // Course Assignments API
  getCourseAssignments() {
    return [...courseAssignments];
  },
  saveCourseAssignments(newAssignments) {
    courseAssignments = [...newAssignments];
    return courseAssignments;
  },

  // Batches API
  getBatches() {
    return [...batches];
  },
  saveBatches(newBatches) {
    batches = [...newBatches];
    return batches;
  },

  // Assignments API
  getAssignments() {
    return [...assignments];
  },
  saveAssignments(newAssignments) {
    assignments = [...newAssignments];
    return assignments;
  },

  // Submissions API
  getSubmissions() {
    return [...submissions];
  },
  saveSubmissions(newSubmissions) {
    submissions = [...newSubmissions];
    return submissions;
  },

  // Calendar Events API
  getCalendarEvents() {
    return [...calendarEvents];
  },
  saveCalendarEvents(newEvents) {
    calendarEvents = [...newEvents];
    return calendarEvents;
  },

  // Announcements API
  getAnnouncements() {
    return [...announcements];
  },
  saveAnnouncements(newAnnouncements) {
    announcements = [...newAnnouncements];
    return announcements;
  },

  // Feedback API
  getFeedback() {
    return [...feedbacks];
  },
  saveFeedback(newFeedback) {
    feedbacks = [...newFeedback];
    return feedbacks;
  },

  // Notifications API
  getNotifications() {
    return [...notifications];
  },
  saveNotifications(newNotifications) {
    notifications = [...newNotifications];
    return notifications;
  },

  // Activity Logs API
  getActivityLogs() {
    return [...activityLogs];
  },
  saveActivityLogs(newLogs) {
    activityLogs = [...newLogs];
    return activityLogs;
  },

  // Reports API
  getReports() {
    return [...reports];
  },

  // Settings API
  getSettings() {
    return { ...settings };
  },
  saveSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    return settings;
  },

  // Colleges API
  getColleges() {
    return [...colleges];
  },

  // Computed Dashboard Stats API
  getDashboardOverviewStats() {
    return [
      { label: 'Total Students', value: students.length.toString(), icon: 'users', color: 'blue' },
      { label: 'Total Trainers', value: trainers.length.toString(), icon: 'user', color: 'green' },
      { label: 'Total Courses', value: courses.length.toString(), icon: 'book-open', color: 'blue' },
      { label: 'Active Courses', value: courses.filter(c => c.published).length.toString(), icon: 'activity', color: 'green' },
      { label: 'Total Batches', value: batches.length.toString(), icon: 'layers', color: 'orange' },
      { label: 'Assignments & Assessments', value: assignments.length.toString(), icon: 'file-text', color: 'red' },
      { label: 'Colleges Onboarded', value: colleges.length.toString(), icon: 'check-circle', color: 'green' }
    ];
  }
};

export default mockDataService;
