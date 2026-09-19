import apiClient from './apiClient';
import batchService from './batchService';
import adminUserService from './adminUserService';
import adminCourseService from './adminCourseService';
import { assignmentService } from './assignmentService';

// Storage keys for persistent coordinator local state
const STORAGE_KEYS = {
  INTERVENTIONS: 'coord_interventions_data',
  ATTENDANCE_LOGS: 'coord_attendance_logs_data',
  ATTENDANCE_AUDIT: 'coord_attendance_audit_data',
  TRAINEE_FEEDBACK: 'coord_trainee_feedback_data',
  TRAINER_FEEDBACK: 'coord_trainer_feedback_data',
  SCHEDULE: 'coord_schedule_data',
  ISSUES: 'coord_issues_data',
  ANNOUNCEMENTS: 'coord_announcements_data',
  ABSENCE_REQUESTS: 'coord_absence_requests_data',
  BATCH_CLOSURES: 'coord_batch_closures_data'
};

// Initial Seed Data for Coordinator System
const initialInterventions = [
  {
    id: 'INT-101',
    traineeId: 1,
    traineeName: 'Aarav Sharma',
    batchId: 1,
    batchName: 'Batch 2026-Alpha (Java FullStack)',
    reason: 'Low Attendance & Consecutive Absences',
    conditionTag: 'Low Attendance (68%)',
    actionTaken: '1-on-1 Mentorship session conducted with SPOC and parent college faculty notified.',
    followUpDate: '2026-09-24',
    outcome: 'Candidate agreed to attend mandatory weekend makeup labs.',
    status: 'In Progress',
    createdBy: 'Batch Coordinator',
    createdAt: '2026-09-15',
    history: [
      { date: '2026-09-15', note: 'Flagged by automated at-risk monitor (3 consecutive absences).' },
      { date: '2026-09-16', note: 'Met with trainee and outlined attendance recovery plan.' }
    ]
  },
  {
    id: 'INT-102',
    traineeId: 2,
    traineeName: 'Priya Patel',
    batchId: 1,
    batchName: 'Batch 2026-Alpha (Java FullStack)',
    reason: 'Pending Assignments & Low Assessment Marks',
    conditionTag: 'Overdue Assignments (3)',
    actionTaken: 'Assigned senior peer buddy and extended lab practice schedule.',
    followUpDate: '2026-09-22',
    outcome: 'Pending submission of Day 12 Spring Boot project.',
    status: 'Pending',
    createdBy: 'Batch Coordinator',
    createdAt: '2026-09-17',
    history: [
      { date: '2026-09-17', note: 'Trainer flagged low score (42%) in Module 2 Quiz.' }
    ]
  },
  {
    id: 'INT-103',
    traineeId: 3,
    traineeName: 'Rohan Gupta',
    batchId: 2,
    batchName: 'Batch 2026-Beta (Cloud & DevOps)',
    reason: 'Trainer flagged disengagement in live sessions',
    conditionTag: 'Negative Trainer Feedback',
    actionTaken: 'Counseling session on camera & participation guidelines.',
    followUpDate: '2026-09-20',
    outcome: 'Active participation observed in subsequent 3 sessions.',
    status: 'Resolved',
    createdBy: 'Batch Coordinator',
    createdAt: '2026-09-10',
    history: [
      { date: '2026-09-10', note: 'Trainer raised flag on session participation.' },
      { date: '2026-09-14', note: 'Follow-up review with trainer confirmed significant improvement.' }
    ]
  }
];

const initialIssues = [
  {
    id: 'ISS-201',
    category: 'Assessment',
    batchId: 1,
    batchName: 'Batch 2026-Alpha (Java FullStack)',
    traineeName: 'Aarav Sharma',
    traineeEmail: 'aarav.sharma@hexaware.com',
    title: 'Network timeout during Mid-Term Assessment',
    description: 'Trainee experienced internet drop at 45m mark during Proctored Test. Requires re-attempt authorization.',
    severity: 'High',
    status: 'In Progress',
    remarks: 'Under verification with proctor log files.',
    escalatedToAdmin: false,
    createdAt: '2026-09-18 10:30'
  },
  {
    id: 'ISS-202',
    category: 'Training Session',
    batchId: 2,
    batchName: 'Batch 2026-Beta (Cloud & DevOps)',
    traineeName: 'Kavya Nair',
    traineeEmail: 'kavya.nair@hexaware.com',
    title: 'AWS Sandbox Lab Access Credentials Expired',
    description: 'IAM user credentials for batch cloud environment throwing 403 Forbidden.',
    severity: 'Critical',
    status: 'Escalated to Admin',
    remarks: 'Escalated to System Admin for AWS IAM role quota refresh.',
    escalatedToAdmin: true,
    escalatedAt: '2026-09-18 14:15',
    createdAt: '2026-09-18 11:00'
  },
  {
    id: 'ISS-203',
    category: 'Assignment',
    batchId: 1,
    batchName: 'Batch 2026-Alpha (Java FullStack)',
    traineeName: 'Vikram Mehta',
    traineeEmail: 'vikram.mehta@hexaware.com',
    title: 'Git Repository synchronization error on submission',
    description: 'Auto-grader webhook failed to clone branch for Day 10 homework.',
    severity: 'Medium',
    status: 'Resolved',
    remarks: 'Re-triggered webhook successfully.',
    escalatedToAdmin: false,
    createdAt: '2026-09-16 09:20'
  }
];

const initialTrainerFeedback = [
  {
    id: 'TFB-301',
    trainerName: 'Dr. Rajesh Kumar',
    batchId: 1,
    traineeId: 1,
    traineeName: 'Aarav Sharma',
    technicalUnderstanding: 3,
    participation: 2,
    communication: 3,
    assignmentPerformance: 2,
    attendanceDiscipline: 2,
    learningProgress: 3,
    areasForImprovement: 'Needs stronger grasp on Spring Data JPA and consistent attendance.',
    date: '2026-09-17',
    requiresSupport: true
  },
  {
    id: 'TFB-302',
    trainerName: 'Dr. Rajesh Kumar',
    batchId: 1,
    traineeId: 4,
    traineeName: 'Ananya Verma',
    technicalUnderstanding: 5,
    participation: 5,
    communication: 4,
    assignmentPerformance: 5,
    attendanceDiscipline: 5,
    learningProgress: 5,
    areasForImprovement: 'Excellent performance across all coding challenges.',
    date: '2026-09-17',
    requiresSupport: false
  },
  {
    id: 'TFB-303',
    trainerName: 'Sunita Rao',
    batchId: 2,
    traineeId: 3,
    traineeName: 'Rohan Gupta',
    technicalUnderstanding: 4,
    participation: 4,
    communication: 4,
    assignmentPerformance: 4,
    attendanceDiscipline: 4,
    learningProgress: 4,
    areasForImprovement: 'Great progress in Docker containerization modules.',
    date: '2026-09-16',
    requiresSupport: false
  }
];

const initialTraineeFeedback = [
  {
    id: 'SFB-401',
    batchId: 1,
    batchName: 'Batch 2026-Alpha (Java FullStack)',
    traineeName: 'Anonymous Trainee',
    trainerName: 'Dr. Rajesh Kumar',
    courseName: 'Java Enterprise Architecture',
    sessionTopic: 'Microservices & Kafka Streaming',
    rating: 4.8,
    paceRating: 'Just Right',
    contentClarity: 5,
    comments: 'Super practical hands-on examples. Really helped clarify distributed transactions.',
    recurringIssue: 'None',
    date: '2026-09-18'
  },
  {
    id: 'SFB-402',
    batchId: 1,
    batchName: 'Batch 2026-Alpha (Java FullStack)',
    traineeName: 'Anonymous Trainee',
    trainerName: 'Dr. Rajesh Kumar',
    courseName: 'Java Enterprise Architecture',
    sessionTopic: 'Docker & Kubernetes Deployments',
    rating: 3.2,
    paceRating: 'Too Fast',
    contentClarity: 3,
    comments: 'Pacing was quite fast during Kubernetes pod networking explanation.',
    recurringIssue: 'Pacing too fast in advanced architectural topics',
    date: '2026-09-16'
  },
  {
    id: 'SFB-403',
    batchId: 2,
    batchName: 'Batch 2026-Beta (Cloud & DevOps)',
    traineeName: 'Anonymous Trainee',
    trainerName: 'Sunita Rao',
    courseName: 'Cloud & Infrastructure Engineering',
    sessionTopic: 'Terraform State Management',
    rating: 4.9,
    paceRating: 'Just Right',
    contentClarity: 5,
    comments: 'Outstanding session with clear live demonstrations.',
    recurringIssue: 'None',
    date: '2026-09-17'
  }
];

const initialAnnouncements = [
  {
    id: 'ANN-501',
    title: 'Mid-Term Assessment Schedule & Guidelines',
    message: 'The Mid-Term Proctored Assessment for Batch 2026-Alpha will take place this Friday at 10:00 AM IST. Ensure webcams are active and environment is quiet.',
    targetAudience: 'Batch 2026-Alpha',
    type: 'Assessment Alert',
    priority: 'High',
    sentBy: 'Batch Coordinator (SPOC)',
    date: '2026-09-18 09:00',
    deliveryStats: '42 / 42 Delivered'
  },
  {
    id: 'ANN-502',
    title: 'Assignment Deadline Extension: Day 12 Project',
    message: 'Due to network maintenance at IIT campus labs, submission deadline is extended by 24 hours to Sept 20, 11:59 PM.',
    targetAudience: 'All Batches',
    type: 'Deadline Notice',
    priority: 'Normal',
    sentBy: 'Batch Coordinator (SPOC)',
    date: '2026-09-17 16:30',
    deliveryStats: '85 / 85 Delivered'
  }
];

const initialAbsenceRequests = [
  {
    id: 'ABS-601',
    traineeName: 'Priya Patel',
    traineeEmail: 'priya.patel@hexaware.com',
    batchId: 1,
    assessmentName: 'Mid-Term Core Java Proctored Test',
    scheduledDate: '2026-09-20 10:00 AM',
    reason: 'Medical emergency with hospital admission record.',
    doctorNoteProvided: true,
    status: 'Pending Coordinator Review',
    submittedAt: '2026-09-18 08:30'
  },
  {
    id: 'ABS-602',
    traineeName: 'Kunal Joshi',
    traineeEmail: 'kunal.joshi@hexaware.com',
    batchId: 2,
    assessmentName: 'DevOps CI/CD Pipeline Exam',
    scheduledDate: '2026-09-19 02:00 PM',
    reason: 'College final semester viva conflicting with test time.',
    doctorNoteProvided: false,
    status: 'Approved - Makeup Test Scheduled',
    coordinatorRemarks: 'Verified with College Dean. Makeup scheduled for Sept 22.',
    submittedAt: '2026-09-16 11:15'
  }
];

const initialAttendanceAudit = [
  {
    id: 'AUD-701',
    date: '2026-09-17',
    traineeName: 'Aarav Sharma',
    batchName: 'Batch 2026-Alpha',
    oldStatus: 'Absent',
    newStatus: 'Present (Late Marked)',
    reason: 'College connectivity failure in lab block B confirmed by campus SPOC.',
    authorizedBy: 'Batch Coordinator',
    timestamp: '2026-09-17 14:30:22'
  },
  {
    id: 'AUD-702',
    date: '2026-09-15',
    traineeName: 'Kavya Nair',
    batchName: 'Batch 2026-Beta',
    oldStatus: 'Absent',
    newStatus: 'Excused Leave',
    reason: 'Pre-approved medical leave request with documentation.',
    authorizedBy: 'Batch Coordinator',
    timestamp: '2026-09-15 16:45:10'
  }
];

function getStored(key, initial) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : initial;
  } catch (e) {
    return initial;
  }
}

function setStored(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

export const coordinatorService = {
  // 1. Dashboard & KPIs
  async getDashboardOverview() {
    try {
      const [batchesRes, trainees, trainers, assignments, courses] = await Promise.all([
        batchService.getBatches().catch(() => ({ batches: [] })),
        adminUserService.getTrainees().catch(() => []),
        adminUserService.getTrainers().catch(() => []),
        assignmentService.getAssignments().catch(() => []),
        adminCourseService.getCourses().catch(() => [])
      ]);

      const batches = batchesRes.batches || [
        { id: 1, name: 'Batch 2026-Alpha (Java FullStack)', course_id: 1, max_strength: 35, status: 'IN_PROGRESS' },
        { id: 2, name: 'Batch 2026-Beta (Cloud & DevOps)', course_id: 2, max_strength: 30, status: 'IN_PROGRESS' },
        { id: 3, name: 'Batch 2026-Gamma (Data Engineering)', course_id: 3, max_strength: 25, status: 'UPCOMING' }
      ];

      const interventions = getStored(STORAGE_KEYS.INTERVENTIONS, initialInterventions);
      const issues = getStored(STORAGE_KEYS.ISSUES, initialIssues);
      const openIssues = issues.filter(i => i.status !== 'Resolved');
      const activeAtRisk = interventions.filter(i => i.status !== 'Resolved');

      return {
        activeBatchesCount: batches.length || 3,
        totalTraineesCount: trainees.length || 85,
        totalTrainersCount: trainers.length || 8,
        totalCoursesCount: courses.length || 6,
        avgAttendancePercent: 88.4,
        avgProgressPercent: 74.2,
        pendingAssignmentsCount: 14,
        pendingAssessmentsCount: 2,
        atRiskTraineesCount: activeAtRisk.length || 2,
        openIssuesCount: openIssues.length || 2,
        batches,
        courses,
        trainers
      };
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
      return {
        activeBatchesCount: 3,
        totalTraineesCount: 85,
        totalTrainersCount: 8,
        totalCoursesCount: 6,
        avgAttendancePercent: 88.4,
        avgProgressPercent: 74.2,
        pendingAssignmentsCount: 14,
        pendingAssessmentsCount: 2,
        atRiskTraineesCount: 2,
        openIssuesCount: 2,
        batches: [],
        courses: [],
        trainers: []
      };
    }
  },

  // 2. Trainees 360 & Directory
  async getTraineesDirectory() {
    try {
      const rawTrainees = await adminUserService.getTrainees();
      const mockNames = [
        'Aarav Sharma', 'Priya Patel', 'Rohan Gupta', 'Ananya Verma',
        'Vikram Mehta', 'Kavya Nair', 'Siddharth Rao', 'Neha Joshi',
        'Aditya Singh', 'Sneha Kulkarni', 'Rahul Desai', 'Pooja Iyer'
      ];
      const colleges = ['IIT Madras', 'NIT Trichy', 'Anna University', 'PSG Tech', 'BITS Pilani'];

      const list = (rawTrainees && rawTrainees.length > 0 ? rawTrainees : mockNames.map((name, i) => ({
        id: i + 1,
        name,
        email: `${name.toLowerCase().replace(/\s+/g, '.')}@hexaware.com`,
        college_name: colleges[i % colleges.length],
        role: 'trainee'
      }))).map((t, idx) => {
        const attendance = idx === 0 ? 68 : idx === 1 ? 72 : 85 + ((idx * 3) % 15);
        const progress = idx === 0 ? 45 : idx === 1 ? 52 : 70 + ((idx * 5) % 30);
        const assignmentsSubmitted = idx === 1 ? 7 : 10 + (idx % 3);
        const totalAssignments = 12;
        const avgAssessmentScore = idx === 0 ? 58 : idx === 1 ? 55 : 82 + ((idx * 2) % 16);
        const consecutiveAbsences = idx === 0 ? 3 : idx === 1 ? 2 : 0;
        
        let status = 'On Track';
        let atRiskReasons = [];
        if (attendance < 75) {
          status = 'At-Risk';
          atRiskReasons.push(`Low Attendance (${attendance}%)`);
        }
        if (consecutiveAbsences >= 2) {
          status = 'At-Risk';
          atRiskReasons.push(`${consecutiveAbsences} Consecutive Absences`);
        }
        if (progress < 55) {
          status = 'At-Risk';
          atRiskReasons.push(`Low Syllabus Progress (${progress}%)`);
        }
        if (totalAssignments - assignmentsSubmitted > 2) {
          status = 'At-Risk';
          atRiskReasons.push(`${totalAssignments - assignmentsSubmitted} Pending Assignments`);
        }
        if (avgAssessmentScore < 60) {
          status = 'At-Risk';
          atRiskReasons.push(`Low Assessment Score (${avgAssessmentScore}%)`);
        }

        return {
          id: t.id,
          name: t.name || `Trainee ${t.id}`,
          email: t.email,
          employeeId: `HEX-${1000 + t.id}`,
          college: t.college_name || colleges[idx % colleges.length],
          batchId: (idx % 2) + 1,
          batchName: (idx % 2) === 0 ? 'Batch 2026-Alpha (Java FullStack)' : 'Batch 2026-Beta (Cloud & DevOps)',
          trainerName: (idx % 2) === 0 ? 'Dr. Rajesh Kumar' : 'Sunita Rao',
          courseName: (idx % 2) === 0 ? 'Java Enterprise Architecture' : 'Cloud & Infrastructure Engineering',
          attendance,
          consecutiveAbsences,
          progress,
          assignmentsSubmitted,
          totalAssignments,
          avgAssessmentScore,
          status,
          atRiskReasons,
          phone: `+91 9840${(idx * 137).toString().padStart(6, '0').slice(0, 6)}`,
          enrollmentDate: '2026-08-01',
          lastActive: 'Today, 09:42 AM',
          assessments: [
            { name: 'Core Foundations Diagnostic', score: 85, maxScore: 100, date: '2026-08-15', status: 'Completed' },
            { name: 'Module 1 Coding Challenge', score: idx === 0 ? 58 : 88, maxScore: 100, date: '2026-09-01', status: 'Completed' },
            { name: 'Mid-Term Proctored Assessment', score: idx === 1 ? null : 82, maxScore: 100, date: '2026-09-18', status: idx === 1 ? 'Emergency Absence' : 'Completed' }
          ],
          assignments: [
            { title: 'Day 04 OOP Architecture Lab', status: 'Submitted', score: 90, submittedDate: '2026-08-10' },
            { title: 'Day 08 REST API Development', status: 'Submitted', score: 85, submittedDate: '2026-08-25' },
            { title: 'Day 12 Microservices Project', status: idx === 1 ? 'Pending' : 'Submitted', score: idx === 1 ? null : 88, submittedDate: idx === 1 ? null : '2026-09-14' }
          ],
          remarks: idx === 0 ? 'Requires regular check-in for attendance compliance.' : 'Consistent learner with good participation.'
        };
      });

      return list;
    } catch (err) {
      console.error('Error getting trainees directory:', err);
      return [];
    }
  },

  // 3. Interventions Tracking
  getInterventions() {
    return getStored(STORAGE_KEYS.INTERVENTIONS, initialInterventions);
  },

  saveIntervention(intervention) {
    const list = getStored(STORAGE_KEYS.INTERVENTIONS, initialInterventions);
    if (intervention.id) {
      const idx = list.findIndex(i => i.id === intervention.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...intervention, updatedAt: new Date().toISOString().slice(0, 10) };
      } else {
        list.unshift(intervention);
      }
    } else {
      const newIntervention = {
        ...intervention,
        id: `INT-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString().slice(0, 10),
        history: [{ date: new Date().toISOString().slice(0, 10), note: 'Intervention plan initiated.' }]
      };
      list.unshift(newIntervention);
    }
    setStored(STORAGE_KEYS.INTERVENTIONS, list);
    return list;
  },

  addInterventionFollowup(interventionId, note) {
    const list = getStored(STORAGE_KEYS.INTERVENTIONS, initialInterventions);
    const item = list.find(i => i.id === interventionId);
    if (item) {
      if (!item.history) item.history = [];
      item.history.push({
        date: new Date().toISOString().slice(0, 10),
        note
      });
      setStored(STORAGE_KEYS.INTERVENTIONS, list);
    }
    return list;
  },

  // 4. Attendance Management & Authorized Corrections
  getAttendanceAuditLogs() {
    return getStored(STORAGE_KEYS.ATTENDANCE_AUDIT, initialAttendanceAudit);
  },

  recordAttendanceCorrection({ date, traineeId, traineeName, batchName, oldStatus, newStatus, reason, authorizedBy }) {
    const logs = getStored(STORAGE_KEYS.ATTENDANCE_AUDIT, initialAttendanceAudit);
    const newEntry = {
      id: `AUD-${Math.floor(100 + Math.random() * 900)}`,
      date,
      traineeId,
      traineeName,
      batchName,
      oldStatus,
      newStatus,
      reason,
      authorizedBy: authorizedBy || 'Batch Coordinator (SPOC)',
      timestamp: new Date().toLocaleString()
    };
    logs.unshift(newEntry);
    setStored(STORAGE_KEYS.ATTENDANCE_AUDIT, logs);
    return newEntry;
  },

  // 5. 2-Way Feedback
  getTrainerToTraineeFeedback() {
    return getStored(STORAGE_KEYS.TRAINER_FEEDBACK, initialTrainerFeedback);
  },

  saveTrainerFeedback(feedback) {
    const list = getStored(STORAGE_KEYS.TRAINER_FEEDBACK, initialTrainerFeedback);
    const newFb = {
      ...feedback,
      id: `TFB-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 10)
    };
    list.unshift(newFb);
    setStored(STORAGE_KEYS.TRAINER_FEEDBACK, list);
    return list;
  },

  getTraineeFeedback() {
    return getStored(STORAGE_KEYS.TRAINEE_FEEDBACK, initialTraineeFeedback);
  },

  escalateFeedbackToAdmin(feedbackId, remarks) {
    const list = getStored(STORAGE_KEYS.TRAINEE_FEEDBACK, initialTraineeFeedback);
    const item = list.find(f => f.id === feedbackId);
    if (item) {
      item.escalatedToAdmin = true;
      item.escalationRemarks = remarks;
      item.escalatedAt = new Date().toLocaleString();
      setStored(STORAGE_KEYS.TRAINEE_FEEDBACK, list);
    }
    return list;
  },

  // 6. Issues & Escalation Management
  getIssues() {
    return getStored(STORAGE_KEYS.ISSUES, initialIssues);
  },

  saveIssue(issue) {
    const list = getStored(STORAGE_KEYS.ISSUES, initialIssues);
    if (issue.id) {
      const idx = list.findIndex(i => i.id === issue.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...issue };
      }
    } else {
      const newIssue = {
        ...issue,
        id: `ISS-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      list.unshift(newIssue);
    }
    setStored(STORAGE_KEYS.ISSUES, list);
    return list;
  },

  escalateIssueToAdmin(issueId, reason) {
    const list = getStored(STORAGE_KEYS.ISSUES, initialIssues);
    const item = list.find(i => i.id === issueId);
    if (item) {
      item.status = 'Escalated to Admin';
      item.escalatedToAdmin = true;
      item.escalationReason = reason;
      item.escalatedAt = new Date().toLocaleString();
      setStored(STORAGE_KEYS.ISSUES, list);
    }
    return list;
  },

  // 7. Announcements & Communication
  getAnnouncements() {
    return getStored(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
  },

  createAnnouncement(announcement) {
    const list = getStored(STORAGE_KEYS.ANNOUNCEMENTS, initialAnnouncements);
    const item = {
      ...announcement,
      id: `ANN-${Math.floor(100 + Math.random() * 900)}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      sentBy: 'Batch Coordinator (SPOC)',
      deliveryStats: `${announcement.targetAudience === 'All Batches' ? 85 : 42} / ${announcement.targetAudience === 'All Batches' ? 85 : 42} Delivered`
    };
    list.unshift(item);
    setStored(STORAGE_KEYS.ANNOUNCEMENTS, list);
    return list;
  },

  // 8. Assessment Absence Requests (Connected to Live Backend)
  async getAbsenceRequests() {
    try {
      const response = await apiClient.get('/api/attendance-followup/spoc/requests');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map(req => ({
          id: `ABS-${req.id}`,
          rawId: req.id,
          traineeName: req.candidate_name || 'Candidate',
          traineeEmail: req.candidate_email || 'candidate@hexaware.com',
          batchId: req.batch_id,
          assessmentName: req.absence_date ? `Absence Evaluation (${req.absence_date})` : 'Assessment Absence',
          scheduledDate: req.absence_date || '2026-09-20',
          reason: req.reason || 'Medical / Emergency Absence',
          doctorNoteProvided: Boolean(req.doc_filename),
          status: req.stage === 'REASON_SUBMITTED' ? 'Pending Coordinator Review' : req.stage === 'SPOC_APPROVED' ? 'Approved - Makeup Test Scheduled' : 'Rejected',
          submittedAt: req.created_at || '2026-09-18 08:30'
        }));
      }
    } catch (e) {
      console.warn('Backend attendance followup requests endpoint offline, fallback to local state:', e);
    }
    return getStored(STORAGE_KEYS.ABSENCE_REQUESTS, initialAbsenceRequests);
  },

  async updateAbsenceRequest(requestId, status, remarks) {
    const list = getStored(STORAGE_KEYS.ABSENCE_REQUESTS, initialAbsenceRequests);
    const item = list.find(r => r.id === requestId);
    if (item) {
      item.status = status;
      item.coordinatorRemarks = remarks;
      item.resolvedAt = new Date().toLocaleString();
      setStored(STORAGE_KEYS.ABSENCE_REQUESTS, list);
    }

    // Try posting live review to backend if rawId exists
    if (item && item.rawId) {
      try {
        await apiClient.post('/api/attendance-followup/spoc/requests/review', {
          record_id: item.rawId,
          approved: status.toLowerCase().includes('approved'),
          spoc_remarks: remarks
        });
      } catch (e) {
        console.warn('Backend SPOC review endpoint offline:', e);
      }
    }
    return list;
  },

  // 9. Batch Closure Workflow
  getBatchClosureStatus(batchId) {
    const closures = getStored(STORAGE_KEYS.BATCH_CLOSURES, {});
    return closures[batchId] || {
      verifiedAttendance: false,
      verifiedCourseCompletion: false,
      verifiedAssignments: false,
      verifiedAssessments: false,
      verifiedFeedback: false,
      verifiedIssuesResolved: false,
      isClosed: false,
      closedAt: null,
      finalReportGenerated: false
    };
  },

  saveBatchClosureStatus(batchId, statusObj) {
    const closures = getStored(STORAGE_KEYS.BATCH_CLOSURES, {});
    closures[batchId] = {
      ...closures[batchId],
      ...statusObj,
      updatedAt: new Date().toISOString()
    };
    setStored(STORAGE_KEYS.BATCH_CLOSURES, closures);
    return closures[batchId];
  }
};

export default coordinatorService;
