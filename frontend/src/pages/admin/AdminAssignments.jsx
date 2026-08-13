import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import adminCourseService from '../../services/adminCourseService';
import { assignmentService } from '../../services/assignmentService';
import codingProblemService from '../../services/codingProblemService';
import assignmentSubmissionService from '../../services/assignmentSubmissionService';
import adminUserService from '../../services/adminUserService';
import { qaService } from '../../services/qaService';
import { caseStudyService } from '../../services/caseStudyService';

const LANGUAGES = [
  { id: 62, name: 'Java' },
  { id: 82, name: 'SQL' },
  { id: 71, name: 'Python' },
  { id: 54, name: 'C++' }
];

export default function AdminAssignments() {
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Core Data
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseDays, setCourseDays] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [courseDaysMap, setCourseDaysMap] = useState({});

  // Selection states
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Coding Problems management
  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [isProblemModalOpen, setIsProblemModalOpen] = useState(false);
  const [editProblem, setEditProblem] = useState(null);
  const [problemSubmissions, setProblemSubmissions] = useState([]);

  // Hidden Test Cases management
  const [testCases, setTestCases] = useState([]);
  const [isTestCaseModalOpen, setIsTestCaseModalOpen] = useState(false);
  const [tcInput, setTcInput] = useState('');
  const [tcExpected, setTcExpected] = useState('');
  const [tcIsHidden, setTcIsHidden] = useState(true);

  // Assignment Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);

  // Form Fields - Assignment
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('NON_CODING');
  const [formInstructions, setFormInstructions] = useState('');
  const [formTotalMarks, setFormTotalMarks] = useState(100);
  const [formPassingMarks, setFormPassingMarks] = useState(75);
  const [formDueDate, setFormDueDate] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [formFile, setFormFile] = useState(null);

  // Form Fields - Coding Problem
  const [probTitle, setProbTitle] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probLangId, setProbLangId] = useState(62);
  const [probMarks, setProbMarks] = useState(50);
  const [probSampleInput, setProbSampleInput] = useState('');
  const [probSampleOutput, setProbSampleOutput] = useState('');
  const [probDeadline, setProbDeadline] = useState('');

  // Grading Form Fields
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');

  // Course Plan Generator States
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [genSelectedCourse, setGenSelectedCourse] = useState('');
  const [genCourseDays, setGenCourseDays] = useState([]);
  const [genSelectedDayId, setGenSelectedDayId] = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genSuggestedContent, setGenSuggestedContent] = useState(null);

  // Editable generated fields
  const [genAsgTitle, setGenAsgTitle] = useState('');
  const [genAsgDesc, setGenAsgDesc] = useState('');
  const [genAsgInst, setGenAsgInst] = useState('');
  const [genAsgTotal, setGenAsgTotal] = useState(100);
  const [genAsgPass, setGenAsgPass] = useState(75);
  
  const [genQaQuest, setGenQaQuest] = useState('');
  const [genQaAns, setGenQaAns] = useState('');

  const [genCsTitle, setGenCsTitle] = useState('');
  const [genCsScen, setGenCsScen] = useState('');
  const [genCsReq, setGenCsReq] = useState('');
  const [genCsTotal, setGenCsTotal] = useState(100);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesData, traineesData, assignmentsData] = await Promise.all([
        adminCourseService.getCourses(),
        adminUserService.getTrainees(),
        assignmentService.getAssignments()
      ]);
      setCourses(coursesData);
      setTrainees(traineesData);
      setAssignments(assignmentsData);

      // Fetch days for all courses to resolve names of course day IDs
      const dayLookup = {};
      await Promise.all(
        coursesData.map(async (course) => {
          try {
            const days = await adminCourseService.getCourseDays(course.id);
            days.forEach(d => {
              dayLookup[d.id] = {
                courseId: course.id,
                courseTitle: course.title,
                dayNumber: d.day_number,
                title: d.title
              };
            });
          } catch (e) {
            console.error(`Failed to load days for course ${course.id}:`, e);
          }
        })
      );
      setCourseDaysMap(dayLookup);
    } catch (err) {
      console.error('Failed to load assignments data:', err);
      setError('Could not retrieve assignments from the backend.');
    } finally {
      setLoading(false);
    }
  };

  // When Course is selected in form, load course days
  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    if (!courseId) {
      setCourseDays([]);
      setSelectedDayId('');
      return;
    }
    try {
      const days = await adminCourseService.getCourseDays(courseId);
      setCourseDays(days);
      if (days.length > 0) {
        setSelectedDayId(days[0].id);
      } else {
        setSelectedDayId('');
      }
    } catch (e) {
      console.error('Failed to load course days:', e);
      setCourseDays([]);
      setSelectedDayId('');
    }
  };

  // When Gen Course changes
  const handleGenCourseChange = async (courseId) => {
    setGenSelectedCourse(courseId);
    if (!courseId) {
      setGenCourseDays([]);
      setGenSelectedDayId('');
      return;
    }
    try {
      const days = await adminCourseService.getCourseDays(courseId);
      setGenCourseDays(days);
      if (days.length > 0) {
        setGenSelectedDayId(days[0].id);
      } else {
        setGenSelectedDayId('');
      }
    } catch (e) {
      console.error('Failed to load course days for gen:', e);
      setGenCourseDays([]);
      setGenSelectedDayId('');
    }
  };

  // Trigger content generation
  const handleGenerateSuggestions = async () => {
    if (!genSelectedCourse || !genSelectedDayId) {
      alert('Please select both a course and a course day.');
      return;
    }
    setGenLoading(true);
    setGenSuggestedContent(null);
    try {
      const data = await assignmentService.generateSuggestedContent(genSelectedCourse, genSelectedDayId);
      setGenSuggestedContent(data);
      
      // Populate editable fields
      setGenAsgTitle(data.assignment.title || '');
      setGenAsgDesc(data.assignment.description || '');
      setGenAsgInst(data.assignment.instructions || '');
      setGenAsgTotal(data.assignment.total_marks || 100);
      setGenAsgPass(data.assignment.passing_marks || 75);

      setGenQaQuest(data.qa.question || '');
      setGenQaAns(data.qa.answer || '');

      setGenCsTitle(data.case_study.title || '');
      setGenCsScen(data.case_study.scenario || '');
      setGenCsReq(data.case_study.requirements || '');
      setGenCsTotal(data.case_study.total_marks || 100);
    } catch (e) {
      console.error(e);
      alert('Failed to generate suggestions. Please ensure backend is running.');
    } finally {
      setGenLoading(false);
    }
  };

  // Save published generated package
  const handlePublishGeneratedPackage = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Create Assignment
      const asgForm = new FormData();
      asgForm.append('course_day_id', genSelectedDayId);
      asgForm.append('title', genAsgTitle);
      asgForm.append('description', genAsgDesc);
      asgForm.append('assignment_type', 'NON_CODING');
      asgForm.append('instructions', genAsgInst);
      asgForm.append('total_marks', genAsgTotal);
      asgForm.append('passing_marks', genAsgPass);
      asgForm.append('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()); // Default 7 days from now

      // 2. Create Q&A
      const qaPayload = {
        course_day_id: Number(genSelectedDayId),
        question: genQaQuest,
        answer: genQaAns
      };

      // 3. Create Case Study
      const csPayload = {
        course_day_id: Number(genSelectedDayId),
        title: genCsTitle,
        scenario: genCsScen,
        requirements: genCsReq,
        total_marks: Number(genCsTotal),
        due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // Default 10 days from now
      };

      await Promise.all([
        assignmentService.createAssignment(asgForm),
        qaService.createQA(qaPayload),
        caseStudyService.createCaseStudy(csPayload)
      ]);

      triggerToast('Day Content Package published successfully.');
      setIsGenModalOpen(false);
      setGenSuggestedContent(null);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to publish complete package. Please verify connections.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return dateStr;
    }
  };

  // Format date for datetime-local input field
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().slice(0, 16);
    } catch (e) {
      return '';
    }
  };

  const getTraineeName = (userId) => {
    const t = trainees.find(tr => tr.id === userId);
    return t ? t.name : `Trainee #${userId}`;
  };

  const getTraineeEmail = (userId) => {
    const t = trainees.find(tr => tr.id === userId);
    return t ? t.email : '';
  };

  // Serve backend static files cleanly
  const getFileUrl = (path) => {
    if (!path) return '';
    const normalized = path.replace(/\\/g, '/');
    const baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8000';
    return `${baseURL.replace(/\/$/, '')}/${normalized}`;
  };

  const handleOpenAdd = () => {
    setEditAssignment(null);
    setFormTitle('');
    setFormDescription('');
    setFormType('NON_CODING');
    setFormInstructions('');
    setFormTotalMarks(100);
    setFormPassingMarks(75);
    setFormDueDate('');
    setFormFile(null);
    if (courses.length > 0) {
      handleCourseChange(courses[0].id);
    }
    setIsModalOpen(true);
  };

  const handleOpenGenerate = () => {
    setGenSelectedCourse('');
    setGenCourseDays([]);
    setGenSelectedDayId('');
    setGenSuggestedContent(null);
    if (courses.length > 0) {
      handleGenCourseChange(courses[0].id);
    }
    setIsGenModalOpen(true);
  };

  const handleOpenEdit = async (a, e) => {
    e.stopPropagation();
    setEditAssignment(a);
    setFormTitle(a.title);
    setFormDescription(a.description);
    setFormType(a.assignment_type);
    setFormInstructions(a.instructions);
    setFormTotalMarks(a.total_marks);
    setFormPassingMarks(a.passing_marks);
    setFormDueDate(formatDateForInput(a.due_date));
    setFormFile(null);

    const dayMeta = courseDaysMap[a.course_day_id];
    if (dayMeta) {
      setSelectedCourse(dayMeta.courseId);
      try {
        const days = await adminCourseService.getCourseDays(dayMeta.courseId);
        setCourseDays(days);
        setSelectedDayId(a.course_day_id);
      } catch (err) {
        console.error(err);
      }
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment? All test cases, problems, and student submissions will be cleared.')) {
      try {
        await assignmentService.deleteAssignment(id);
        if (selectedAssignment && selectedAssignment.id === id) {
          setSelectedAssignment(null);
          setSubmissions([]);
          setSelectedSubmission(null);
          setProblems([]);
        }
        triggerToast('Assignment deleted successfully.');
        loadData();
      } catch (err) {
        console.error('Failed to delete assignment:', err);
        alert(err.response?.data?.detail || 'Failed to delete assignment.');
      }
    }
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!formTitle || !selectedDayId) {
      alert('Please fill in the course, day, and title.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('course_day_id', selectedDayId);
    formData.append('title', formTitle);
    formData.append('description', formDescription);
    formData.append('assignment_type', formType);
    formData.append('instructions', formInstructions);
    formData.append('total_marks', formTotalMarks);
    formData.append('passing_marks', formPassingMarks);
    formData.append('due_date', new Date(formDueDate).toISOString());

    if (formFile && formType !== 'CODING') {
      formData.append('file', formFile);
    }

    try {
      if (editAssignment) {
        await assignmentService.updateAssignment(editAssignment.id, formData);
        triggerToast('Assignment updated successfully.');
      } else {
        await assignmentService.createAssignment(formData);
        triggerToast('Assignment created successfully.');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Select Assignment -> Load submissions / problems
  const handleSelectAssignment = async (a) => {
    setSelectedAssignment(a);
    setSelectedSubmission(null);
    setProblems([]);
    setTestCases([]);
    setSelectedProblem(null);
    setProblemSubmissions([]);

    try {
      if (a.assignment_type === 'CODING') {
        const allProblems = await codingProblemService.getProblems();
        const filtered = allProblems.filter(p => p.assignment_id === a.id);
        setProblems(filtered);
      } else {
        const subs = await assignmentSubmissionService.getSubmissions(a.id);
        setSubmissions(subs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Grade/evaluate submission
  const handleGradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    try {
      await assignmentSubmissionService.evaluateSubmission(selectedSubmission.id, gradeMarks, gradeFeedback);
      triggerToast('Grade and remarks updated successfully.');
      
      // Reload submissions list
      const subs = await assignmentSubmissionService.getSubmissions(selectedAssignment.id);
      setSubmissions(subs);

      // Update current selected submission details
      const updatedSub = subs.find(s => s.id === selectedSubmission.id);
      setSelectedSubmission(updatedSub);
    } catch (err) {
      console.error(err);
      alert('Failed to evaluate submission.');
    }
  };

  // Coding Problems Management
  const handleOpenAddProblem = () => {
    setEditProblem(null);
    setProbTitle('');
    setProbDesc('');
    setProbLangId(62);
    setProbMarks(50);
    setProbSampleInput('');
    setProbSampleOutput('');
    setProbDeadline('');
    setIsProblemModalOpen(true);
  };

  const handleOpenEditProblem = (p) => {
    setEditProblem(p);
    setProbTitle(p.title);
    setProbDesc(p.description);
    setProbLangId(p.language_id);
    setProbMarks(p.marks);
    setProbSampleInput(p.sample_input || '');
    setProbSampleOutput(p.sample_output || '');
    setProbDeadline(formatDateForInput(p.deadline));
    setIsProblemModalOpen(true);
  };

  const handleSaveProblem = async (e) => {
    e.preventDefault();
    if (!probTitle) return;

    const payload = {
      assignment_id: selectedAssignment.id,
      title: probTitle,
      description: probDesc,
      language_id: Number(probLangId),
      marks: Number(probMarks),
      sample_input: probSampleInput,
      sample_output: probSampleOutput,
      deadline: probDeadline ? new Date(probDeadline).toISOString() : null,
      created_by: Number(localStorage.getItem('logged_in_user_id')) || 1
    };

    setSubmitting(true);
    try {
      if (editProblem) {
        await codingProblemService.updateProblem(editProblem.id, payload);
        triggerToast('Problem updated successfully.');
      } else {
        await codingProblemService.createProblem(payload);
        triggerToast('Problem added successfully.');
      }
      setIsProblemModalOpen(false);
      
      // Reload problems
      const allProblems = await codingProblemService.getProblems();
      setProblems(allProblems.filter(p => p.assignment_id === selectedAssignment.id));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || 'Failed to save problem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProblem = async (problemId) => {
    if (confirm('Delete this coding problem? This will clear test cases and submissions.')) {
      try {
        await codingProblemService.deleteProblem(problemId);
        triggerToast('Problem deleted successfully.');
        setSelectedProblem(null);
        setTestCases([]);
        setProblemSubmissions([]);
        
        const allProblems = await codingProblemService.getProblems();
        setProblems(allProblems.filter(p => p.assignment_id === selectedAssignment.id));
      } catch (err) {
        console.error(err);
        alert('Failed to delete problem.');
      }
    }
  };

  // Load Test Cases and Submissions for a Problem
  const handleSelectProblem = async (p) => {
    setSelectedProblem(p);
    setTestCases([]);
    setProblemSubmissions([]);
    try {
      const [tcs, subs] = await Promise.all([
        codingProblemService.getTestCases(p.id),
        assignmentSubmissionService.getCodingSubmissions(p.id)
      ]);
      setTestCases(tcs);
      setProblemSubmissions(subs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddTestCase = async (e) => {
    e.preventDefault();
    if (!tcInput || !tcExpected) return;

    try {
      await codingProblemService.addTestCase(selectedProblem.id, {
        input_data: tcInput,
        expected_output: tcExpected,
        is_hidden: tcIsHidden
      });
      triggerToast('Testcase added successfully.');
      setTcInput('');
      setTcExpected('');
      setTcIsHidden(true);

      // Reload testcases
      const tcs = await codingProblemService.getTestCases(selectedProblem.id);
      setTestCases(tcs);
    } catch (err) {
      console.error(err);
      alert('Failed to add testcase.');
    }
  };

  return (
    <div className="page-view admin-container">
      
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">MANAGE ASSIGNMENTS, CODING PROBLEMS & EVALUATE SUBMISSIONS</span>
          <h2 className="admin-banner-title">Assignment Management Module</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn secondary" style={{ marginRight: '10px' }} onClick={handleOpenGenerate}>
            <Icon name="sliders" style={{ width: '16px', height: '16px' }} />
            <span>Generate From Plan</span>
          </button>
          <button className="admin-banner-btn" onClick={handleOpenAdd}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: '20px', borderColor: 'var(--accent-red)', backgroundColor: '#fff5f5', color: '#c53030' }}>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-medium)' }}>
          <div className="loading-spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <span>Loading assignments catalog...</span>
        </div>
      ) : (
        <div className="split-view-container">
          
          {/* Left Column: Assignments list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            <div className="admin-table-container">
              <div className="admin-card-header" style={{ padding: '20px 20px 0 20px' }}>
                <h3 className="admin-card-title">
                  <Icon name="file-text" className="admin-card-title-icon" />
                  <span>Posted Course Day Assignments</span>
                </h3>
              </div>

              <table className="admin-table" style={{ marginTop: '16px' }}>
                <thead>
                  <tr>
                    <th>Type & Title</th>
                    <th>Course Day</th>
                    <th>Deadline & Marks</th>
                    <th>Attachment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.length > 0 ? (
                    assignments.map(a => {
                      const dayMeta = courseDaysMap[a.course_day_id];
                      return (
                        <tr 
                          key={a.id} 
                          style={{ cursor: 'pointer', backgroundColor: selectedAssignment?.id === a.id ? '#f0f4f8' : '' }}
                          onClick={() => handleSelectAssignment(a)}
                        >
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className={`admin-badge ${a.assignment_type === 'CODING' ? 'red' : 'blue'}`} style={{ fontSize: '9px' }}>
                                  {a.assignment_type}
                                </span>
                                <span style={{ fontWeight: 700 }}>{a.title}</span>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>
                                {a.description.substring(0, 70)}{a.description.length > 70 ? '...' : ''}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              {dayMeta ? `${dayMeta.courseTitle} (Day ${dayMeta.dayNumber})` : `Day #${a.course_day_id}`}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600, display: 'block' }}>📅 {formatDate(a.due_date)}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>
                              Min: {a.passing_marks} / Max: {a.total_marks} pts
                            </span>
                          </td>
                          <td>
                            {a.attachment_path ? (
                              <a 
                                href={getFileUrl(a.attachment_path)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="admin-badge green" 
                                style={{ fontSize: '10px', textDecoration: 'underline' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                View PDF
                              </a>
                            ) : (
                              <span style={{ color: 'var(--text-light)', fontSize: '11px' }}>None</span>
                            )}
                          </td>
                          <td>
                            <div className="table-row-actions">
                              <button className="row-action-btn" title="Modify Setting" onClick={(e) => handleOpenEdit(a, e)}>
                                <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                              </button>
                              <button className="row-action-btn delete" title="Delete Assignment" onClick={(e) => handleDelete(a.id, e)}>
                                <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>
                        No assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Submissions Section for Non-Coding / Case-Study / Project */}
            {selectedAssignment && selectedAssignment.assignment_type !== 'CODING' && (
              <div className="admin-table-container">
                <div className="admin-card-header" style={{ padding: '20px 20px 0 20px' }}>
                  <h3 className="admin-card-title">
                    <Icon name="layers" className="admin-card-title-icon" />
                    <span>Student Submissions for Review</span>
                  </h3>
                </div>

                <table className="admin-table" style={{ marginTop: '16px' }}>
                  <thead>
                    <tr>
                      <th>Trainee</th>
                      <th>Submission Material</th>
                      <th>Submitted At</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length > 0 ? (
                      submissions.map(sub => (
                        <tr 
                          key={sub.id} 
                          style={{ cursor: 'pointer', backgroundColor: selectedSubmission?.id === sub.id ? '#f8fafc' : '' }}
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setGradeMarks(sub.marks || '');
                            setGradeFeedback(sub.feedback || '');
                          }}
                        >
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700 }}>{getTraineeName(sub.user_id)}</span>
                              <span style={{ fontSize: '10px', color: 'var(--text-medium)' }}>{getTraineeEmail(sub.user_id)}</span>
                            </div>
                          </td>
                          <td>
                            {sub.submission_path ? (
                              <a 
                                href={getFileUrl(sub.submission_path)} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ fontWeight: 600, color: 'var(--primary-blue)', textDecoration: 'underline' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                View PDF Solution
                              </a>
                            ) : sub.github_url ? (
                              <a 
                                href={sub.github_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ fontWeight: 600, color: 'var(--primary-blue)', textDecoration: 'underline' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {sub.github_url}
                              </a>
                            ) : (
                              <span style={{ fontStyle: 'italic', color: 'var(--text-medium)' }}>
                                {sub.submission_text || 'Text Solution'}
                              </span>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>
                              {formatDate(sub.submitted_at)}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-badge ${sub.status === 'EVALUATED' ? 'green' : 'orange'}`}>
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>
                          No submissions received for this assignment yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Coding Problems management panel */}
            {selectedAssignment && selectedAssignment.assignment_type === 'CODING' && (
              <div className="admin-table-container">
                <div className="admin-card-header" style={{ padding: '20px' }}>
                  <h3 className="admin-card-title">
                    <Icon name="activity" className="admin-card-title-icon" />
                    <span>Coding Problems under this Assignment</span>
                  </h3>
                  <button className="action-btn-primary" style={{ padding: '6px 12px', fontSize: '11px' }} onClick={handleOpenAddProblem}>
                    <Icon name="plus" style={{ width: '12px', height: '12px' }} />
                    <span>Create Problem</span>
                  </button>
                </div>

                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Title & Description</th>
                      <th>Language</th>
                      <th>Marks</th>
                      <th>Sample Input/Output</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {problems.length > 0 ? (
                      problems.map(p => {
                        const langName = LANGUAGES.find(l => l.id === p.language_id)?.name || `ID #${p.language_id}`;
                        return (
                          <tr 
                            key={p.id} 
                            style={{ cursor: 'pointer', backgroundColor: selectedProblem?.id === p.id ? '#f8fafc' : '' }}
                            onClick={() => handleSelectProblem(p)}
                          >
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 700 }}>{p.title}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>{p.description}</span>
                              </div>
                            </td>
                            <td>
                              <span className="admin-badge blue">{langName}</span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700 }}>{p.marks} pts</span>
                            </td>
                            <td>
                              <div style={{ fontSize: '10px', color: 'var(--text-medium)' }}>
                                <div><strong>In:</strong> {p.sample_input}</div>
                                <div><strong>Out:</strong> {p.sample_output}</div>
                              </div>
                            </td>
                            <td>
                              <div className="table-row-actions">
                                <button className="row-action-btn" title="Edit Problem" onClick={(e) => { e.stopPropagation(); handleOpenEditProblem(p); }}>
                                  <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                                </button>
                                <button className="row-action-btn delete" title="Delete Problem" onClick={(e) => { e.stopPropagation(); handleDeleteProblem(p.id); }}>
                                  <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-light)' }}>
                          No coding problems created. Click "Create Problem" to add.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Right Column: Grading / Evaluation / Coding problem details */}
          <div className="details-side-panel">
            {selectedAssignment ? (
              selectedAssignment.assignment_type !== 'CODING' ? (
                // Evaluation Pane for Non-Coding assignments
                selectedSubmission ? (
                  <div className="admin-card">
                    <div className="details-card-header" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                      <span className={`admin-badge ${selectedSubmission.status === 'EVALUATED' ? 'green' : 'orange'}`} style={{ marginBottom: '8px' }}>
                        {selectedSubmission.status}
                      </span>
                      <h3 className="details-name">{getTraineeName(selectedSubmission.user_id)}</h3>
                      <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>
                        Task: <strong>{selectedAssignment.title}</strong>
                      </span>
                      
                      {selectedSubmission.submission_path && (
                        <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '12px', width: '100%', marginTop: '16px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-medium)' }}>FILE SUBMISSION</span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)' }}>solution.pdf</span>
                          </div>
                          <a 
                            href={getFileUrl(selectedSubmission.submission_path)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="row-action-btn" 
                            title="Open submission file"
                          >
                            <Icon name="download" style={{ width: '16px', height: '16px' }} />
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="details-body-list" style={{ marginTop: '0' }}>
                      <form onSubmit={handleGradeSubmit} className="modal-form">
                        <div className="form-group">
                          <label className="form-label">Grade Score (out of {selectedAssignment.total_marks})</label>
                          <input 
                            type="number" 
                            min="0" 
                            max={selectedAssignment.total_marks} 
                            className="form-input" 
                            placeholder={`e.g. ${selectedAssignment.passing_marks}`}
                            value={gradeMarks}
                            onChange={(e) => setGradeMarks(e.target.value)}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label">Review Remarks / Feedback</label>
                          <textarea 
                            className="form-textarea" 
                            placeholder="Write constructive suggestions..."
                            value={gradeFeedback}
                            onChange={(e) => setGradeFeedback(e.target.value)}
                            required
                            style={{ minHeight: '80px' }}
                          />
                        </div>

                        <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                          Publish Grade & Remarks
                        </button>
                      </form>

                      {selectedSubmission.status === 'EVALUATED' && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-medium)', fontWeight: 600 }}>Active Grade:</span>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-green)' }}>
                            {selectedSubmission.marks} / {selectedAssignment.total_marks} pts
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-medium)', fontStyle: 'italic' }}>
                            "{selectedSubmission.feedback}"
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
                    <Icon name="file-text" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a student submission from the list below to review code archives, write remarks, and submit grades.</p>
                  </div>
                )
              ) : (
                // Coding Problems Sidebar Panel (Test Cases & Judge0 submissions)
                selectedProblem ? (
                  <div className="admin-card" style={{ gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-dark)' }}>{selectedProblem.title}</h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>Max marks: {selectedProblem.marks} pts</span>
                      </div>
                      <button className="action-btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => setIsTestCaseModalOpen(true)}>
                        Manage Testcases
                      </button>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Test Cases ({testCases.length})</span>
                      <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {testCases.length > 0 ? (
                          testCases.map(tc => (
                            <div key={tc.id} style={{ fontSize: '11px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                              <span className={`admin-badge ${tc.is_hidden ? 'red' : 'green'}`} style={{ fontSize: '8px', float: 'right' }}>
                                {tc.is_hidden ? 'HIDDEN' : 'PUBLIC'}
                              </span>
                              <div><strong>In:</strong> {tc.input_data}</div>
                              <div><strong>Expected Out:</strong> {tc.expected_output}</div>
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>No test cases defined yet.</div>
                        )}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Submissions via Judge0</span>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {problemSubmissions.length > 0 ? (
                          problemSubmissions.map(pSub => (
                            <div key={pSub.id} style={{ fontSize: '11px', padding: '8px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: '#fff' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <strong>{getTraineeName(pSub.user_id)}</strong>
                                <span className={`admin-badge ${pSub.status === 'ACCEPTED' ? 'green' : 'red'}`} style={{ fontSize: '8px' }}>
                                  {pSub.status}
                                </span>
                              </div>
                              <div style={{ color: 'var(--text-medium)' }}>Passed: {pSub.passed_testcases} / {pSub.total_testcases} cases</div>
                              <div style={{ fontWeight: 600, color: 'var(--accent-green)' }}>Score: {pSub.score} pts</div>
                              {pSub.error_message && (
                                <pre style={{ margin: '4px 0 0 0', padding: '4px', backgroundColor: '#fff5f5', color: '#c53030', fontSize: '9px', overflowX: 'auto', borderRadius: '4px' }}>
                                  {pSub.error_message}
                                </pre>
                              )}
                            </div>
                          ))
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', fontStyle: 'italic' }}>No submissions compiled yet.</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
                    <Icon name="activity" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
                    <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a coding problem from the list below to manage test cases, view score outputs, and evaluate passed testcases.</p>
                  </div>
                )
              )
            ) : (
              <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
                <Icon name="file-text" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>Select an assignment from the main table on the left to see statistics, submissions, and code problems.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Create / Edit Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editAssignment ? 'Modify Settings' : 'Develop New Assignment'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="modal-form">
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select 
                    className="form-input" 
                    value={selectedCourse} 
                    onChange={(e) => handleCourseChange(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Course Day</label>
                  <select 
                    className="form-input" 
                    value={selectedDayId} 
                    onChange={(e) => setSelectedDayId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Day --</option>
                    {courseDays.map(d => (
                      <option key={d.id} value={d.id}>Day {d.day_number} - {d.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Java Arrays & Encapsulation"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description Summary</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Summarize the assignment requirements..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assignment Type</label>
                <select className="form-input" value={formType} onChange={(e) => setFormType(e.target.value)}>
                  <option value="NON_CODING">Non-Coding (Requires PDF solution upload)</option>
                  <option value="CASE_STUDY">Case Study (Requires GitHub repo URL)</option>
                  <option value="PROJECT">Project (Requires GitHub repo URL)</option>
                  <option value="CODING">Coding Assignment (Integrated Judge0 problems)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Instructions</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Detail step-by-step instructions for the trainee..."
                  value={formInstructions}
                  onChange={(e) => setFormInstructions(e.target.value)}
                  required
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Total Marks</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formTotalMarks}
                    onChange={(e) => setFormTotalMarks(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Passing Marks</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={formPassingMarks}
                    onChange={(e) => setFormPassingMarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Submission Due Date</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  required
                />
              </div>

              {formType !== 'CODING' && (
                <div className="form-group">
                  <label className="form-label">Upload Starter Package / PDF Instruction</label>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="form-input" 
                    onChange={(e) => setFormFile(e.target.files[0])}
                  />
                  <small style={{ color: 'var(--text-medium)' }}>Only PDF documents are allowed as assignment materials.</small>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                  {submitting ? 'Posting...' : editAssignment ? 'Save Changes' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate From Course Plan Modal */}
      {isGenModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Generate Content Package From Course Plan</h3>
              <button className="modal-close-btn" onClick={() => setIsGenModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px', alignItems: 'end' }}>
                <div className="form-group">
                  <label className="form-label">Select Course</label>
                  <select 
                    className="form-input" 
                    value={genSelectedCourse} 
                    onChange={(e) => handleGenCourseChange(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Course Day / Module</label>
                  <select 
                    className="form-input" 
                    value={genSelectedDayId} 
                    onChange={(e) => setGenSelectedDayId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Day --</option>
                    {genCourseDays.map(d => (
                      <option key={d.id} value={d.id}>Day {d.day_number} - {d.title}</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="button" 
                  className="action-btn-primary" 
                  style={{ width: '100%', padding: '10px' }} 
                  onClick={handleGenerateSuggestions}
                  disabled={genLoading}
                >
                  {genLoading ? 'Reading...' : 'Suggest'}
                </button>
              </div>

              {genSuggestedContent && (
                <form onSubmit={handlePublishGeneratedPackage} className="modal-form" style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '8px' }}>
                  
                  {/* Generated Assignment Card */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc' }}>
                    <span className="admin-badge blue" style={{ marginBottom: '8px' }}>Suggested Assignment</span>
                    
                    <div className="form-group">
                      <label className="form-label">Assignment Title</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={genAsgTitle}
                        onChange={(e) => setGenAsgTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Description Summary</label>
                      <textarea 
                        className="form-textarea" 
                        value={genAsgDesc}
                        onChange={(e) => setGenAsgDesc(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Detailed Instructions</label>
                      <textarea 
                        className="form-textarea" 
                        value={genAsgInst}
                        onChange={(e) => setGenAsgInst(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group">
                        <label className="form-label">Total Marks</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={genAsgTotal}
                          onChange={(e) => setGenAsgTotal(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Passing Marks</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          value={genAsgPass}
                          onChange={(e) => setGenAsgPass(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Generated Q&A Card */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc', marginTop: '16px' }}>
                    <span className="admin-badge green" style={{ marginBottom: '8px' }}>Suggested Q&A</span>

                    <div className="form-group">
                      <label className="form-label">Question</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={genQaQuest}
                        onChange={(e) => setGenQaQuest(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Suggested Answer</label>
                      <textarea 
                        className="form-textarea" 
                        value={genQaAns}
                        onChange={(e) => setGenQaAns(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Generated Case Study Card */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', backgroundColor: '#f8fafc', marginTop: '16px' }}>
                    <span className="admin-badge orange" style={{ marginBottom: '8px' }}>Suggested Case Study</span>

                    <div className="form-group">
                      <label className="form-label">Case Study Title</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={genCsTitle}
                        onChange={(e) => setGenCsTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Business Scenario / Context</label>
                      <textarea 
                        className="form-textarea" 
                        value={genCsScen}
                        onChange={(e) => setGenCsScen(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Requirements / Tasks</label>
                      <textarea 
                        className="form-textarea" 
                        value={genCsReq}
                        onChange={(e) => setGenCsReq(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Marks</label>
                      <input 
                        type="number" 
                        className="form-input" 
                        value={genCsTotal}
                        onChange={(e) => setGenCsTotal(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="modal-footer" style={{ marginTop: '20px' }}>
                    <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsGenModalOpen(false)}>Cancel</button>
                    <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                      {submitting ? 'Publishing Package...' : 'Publish Day Content Package'}
                    </button>
                  </div>

                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Coding Problem Modal */}
      {isProblemModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editProblem ? 'Edit Coding Problem' : 'Create New Coding Problem'}</h3>
              <button className="modal-close-btn" onClick={() => setIsProblemModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveProblem} className="modal-form">
              <div className="form-group">
                <label className="form-label">Problem Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Reverse a LinkedList"
                  value={probTitle}
                  onChange={(e) => setProbTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Problem Description</label>
                <textarea 
                  className="form-textarea" 
                  placeholder="Write detailed specifications of the coding problem..."
                  value={probDesc}
                  onChange={(e) => setProbDesc(e.target.value)}
                  required
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Execution Language</label>
                  <select className="form-input" value={probLangId} onChange={(e) => setProbLangId(e.target.value)}>
                    {LANGUAGES.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Problem Marks</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={probMarks}
                    onChange={(e) => setProbMarks(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Sample Input</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 5"
                    value={probSampleInput}
                    onChange={(e) => setProbSampleInput(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Sample Output</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. 1 2 3 4 5"
                    value={probSampleOutput}
                    onChange={(e) => setProbSampleOutput(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Submission Deadline (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  value={probDeadline}
                  onChange={(e) => setProbDeadline(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsProblemModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Save Problem</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Test Case Modal */}
      {isTestCaseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Test Cases: {selectedProblem?.title}</h3>
              <button className="modal-close-btn" onClick={() => setIsTestCaseModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', padding: '16px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '12px' }}>Add New Test Case</span>
                <form onSubmit={handleAddTestCase} className="modal-form" style={{ gap: '10px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Input Data</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Input stream for program..."
                      value={tcInput}
                      onChange={(e) => setTcInput(e.target.value)}
                      required
                      style={{ minHeight: '60px', padding: '6px', fontSize: '12px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>Expected Output</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Exact stdout matching target..."
                      value={tcExpected}
                      onChange={(e) => setTcExpected(e.target.value)}
                      required
                      style={{ minHeight: '60px', padding: '6px', fontSize: '12px' }}
                    />
                  </div>

                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                    <input 
                      type="checkbox" 
                      id="tcIsHidden"
                      checked={tcIsHidden}
                      onChange={(e) => setTcIsHidden(e.target.checked)}
                    />
                    <label htmlFor="tcIsHidden" style={{ fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Hidden from trainees</label>
                  </div>

                  <button type="submit" className="action-btn-primary" style={{ width: '100%', padding: '8px', justifyContent: 'center' }}>
                    Add Test Case
                  </button>
                </form>
              </div>

              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, display: 'block', marginBottom: '12px' }}>Current Test Cases ({testCases.length})</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
                  {testCases.length > 0 ? (
                    testCases.map(tc => (
                      <div key={tc.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', fontSize: '11px', backgroundColor: '#f8fafc' }}>
                        <span className={`admin-badge ${tc.is_hidden ? 'red' : 'green'}`} style={{ fontSize: '7px', float: 'right' }}>
                          {tc.is_hidden ? 'HIDDEN' : 'PUBLIC'}
                        </span>
                        <div><strong>In:</strong> {tc.input_data}</div>
                        <div><strong>Out:</strong> {tc.expected_output}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontStyle: 'italic', color: 'var(--text-light)', fontSize: '12px' }}>No test cases mapped.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: '16px', borderTop: '1px solid var(--border-color)' }}>
              <button className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsTestCaseModalOpen(false)}>Close Manager</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
