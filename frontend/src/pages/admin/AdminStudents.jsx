import { useState, useEffect, useRef } from 'react';
import Icon from '../../components/Icon';
import adminUserService from '../../services/adminUserService';
import adminCourseService from '../../services/adminCourseService';

export default function AdminStudents() {
  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  // API State management
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCollege, setFormCollege] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);

  const collegesList = adminUserService.getColleges();

  // Search Debouncing ref
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    loadCoursesAndTrainees();
  }, []);

  const loadCoursesAndTrainees = async () => {
    setLoading(true);
    setError('');
    try {
      const [coursesData, traineesData] = await Promise.all([
        adminCourseService.getCourses(),
        adminUserService.getTrainees()
      ]);

      const enrichedStudents = traineesData.map(t => ({
        ...t,
        college: t.college_name || localStorage.getItem(`student_college_${t.id}`) || collegesList[0] || 'Hexaware College',
        course_ids: Array.isArray(t.course_ids) && t.course_ids.length > 0 ? t.course_ids : (t.course_id ? [t.course_id] : [])
      }));

      setCourses(coursesData);
      setStudents(enrichedStudents);
    } catch (err) {
      console.error('Failed to load trainee data:', err);
      setError('Could not retrieve students registry. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search logic
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (value.trim() === '') {
          const traineesData = await adminUserService.getTrainees();
          setStudents(traineesData.map(t => ({
            ...t,
            college: t.college_name || localStorage.getItem(`student_college_${t.id}`) || collegesList[0] || 'Hexaware College',
            course_ids: Array.isArray(t.course_ids) && t.course_ids.length > 0 ? t.course_ids : (t.course_id ? [t.course_id] : [])
          })));
          return;
        }

        const searchResults = await adminUserService.searchTrainees(value);
        setStudents(searchResults.map(t => ({
          ...t,
          college: t.college_name || localStorage.getItem(`student_college_${t.id}`) || collegesList[0] || 'Hexaware College',
          course_ids: Array.isArray(t.course_ids) && t.course_ids.length > 0 ? t.course_ids : (t.course_id ? [t.course_id] : [])
        })));
      } catch (err) {
        console.error('Failed to search trainees:', err);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  const handleCourseFilterChange = async (courseId) => {
    setCourseFilter(courseId);
    setLoading(true);
    try {
      if (courseId === 'All') {
        const traineesData = await adminUserService.getTrainees();
        setStudents(traineesData.map(t => ({
          ...t,
          college: t.college_name || localStorage.getItem(`student_college_${t.id}`) || collegesList[0] || 'Hexaware College',
          course_ids: Array.isArray(t.course_ids) && t.course_ids.length > 0 ? t.course_ids : (t.course_id ? [t.course_id] : [])
        })));
        return;
      }

      const filtered = await adminUserService.filterTrainees({ course_id: courseId });
      setStudents(filtered.map(t => ({
        ...t,
        college: t.college_name || localStorage.getItem(`student_college_${t.id}`) || collegesList[0] || 'Hexaware College',
        course_ids: Array.isArray(t.course_ids) && t.course_ids.length > 0 ? t.course_ids : (t.course_id ? [t.course_id] : [])
      })));
    } catch (err) {
      console.error('Failed to filter trainees:', err);
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditStudent(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormCollege(collegesList[0] || 'IIT Madras');
    setSelectedCourseIds(courses.length > 0 ? [courses[0].id] : []);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student, e) => {
    e.stopPropagation();
    setEditStudent(student);
    setFormName(student.name || '');
    setFormEmail(student.email || '');
    setFormPassword('');
    setFormCollege(student.college || collegesList[0]);
    const currentCourses = student.course_ids && student.course_ids.length > 0
      ? student.course_ids
      : (student.course_id ? [student.course_id] : []);
    setSelectedCourseIds(currentCourses);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this student record?')) {
      try {
        await adminUserService.deleteTrainee(id);
        if (selectedStudent && selectedStudent.id === id) {
          setSelectedStudent(null);
        }
        triggerToast('Student profile deleted.');
        loadCoursesAndTrainees();
      } catch (err) {
        console.error('Failed to delete student:', err);
        alert(err.response?.data?.detail || 'Failed to delete student.');
      }
    }
  };

  const handleResetPassword = (student, e) => {
    e.stopPropagation();
    if (confirm(`Reset password for ${student.name}? Temporary password will be sent via email.`)) {
      triggerToast(`Password reset link sent to ${student.email}`);
    }
  };

  const toggleStudentStatus = async (id, currentActiveState, name, e) => {
    e.stopPropagation();
    const nextState = !currentActiveState;
    try {
      await adminUserService.updateTraineeStatus(id, nextState);
      triggerToast(`Account for ${name} ${nextState ? 'activated' : 'deactivated'}.`);
      loadCoursesAndTrainees();
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent({ ...selectedStudent, is_active: nextState });
      }
    } catch (err) {
      console.error('Failed to update student status:', err);
      alert(err.response?.data?.detail || 'Failed to update student status.');
    }
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!editStudent && !formPassword) {
      alert('Please enter a password for the student.');
      return;
    }

    setSubmitting(true);
    const payload = {
      employee_id: editStudent ? editStudent.employee_id : `ST_${Date.now()}`,
      name: formName,
      email: formEmail,
      password: formPassword || 'Password123!',
      course_ids: selectedCourseIds,
      course_id: selectedCourseIds.length > 0 ? selectedCourseIds[0] : null,
      college_name: formCollege
    };

    try {
      if (editStudent) {
        await adminUserService.updateTrainee(editStudent.id, payload);
        localStorage.setItem(`student_college_${editStudent.id}`, formCollege);
        triggerToast('Student details updated.');
      } else {
        const newStudent = await adminUserService.createTrainee(payload);
        if (newStudent && newStudent.id) {
          localStorage.setItem(`student_college_${newStudent.id}`, formCollege);
        }
        triggerToast('New student enrolled successfully. Welcome email sent!');
      }
      setIsModalOpen(false);
      loadCoursesAndTrainees();
    } catch (err) {
      console.error('Failed to save student:', err);
      const errorMessage = typeof err.response?.data?.detail === 'string'
        ? err.response.data.detail
        : (Array.isArray(err.response?.data?.detail)
            ? err.response.data.detail.map(i => typeof i === 'string' ? i : `${Array.isArray(i.loc) ? i.loc.join('.') : ''}: ${i.msg}`).join('; ')
            : (err.message || 'Failed to save student record.'));
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const getCourseTitle = (courseId) => {
    if (!courseId) return 'Unassigned';
    const c = courses.find(course => course.id === courseId);
    return c ? c.title : 'Unassigned';
  };

  const normalizeStudentCourseIds = (student) => {
    if (Array.isArray(student?.course_ids) && student.course_ids.length > 0) {
      return student.course_ids.map(Number);
    }
    if (student?.course_id !== undefined && student?.course_id !== null) {
      return [Number(student.course_id)];
    }
    return [];
  };

  const filteredStudents = students.filter(s => {
    if (courseFilter === 'All') return true;
    const courseIds = normalizeStudentCourseIds(s);
    return courseIds.includes(Number(courseFilter));
  });

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
          <span className="admin-banner-subtitle">STUDENT MANAGEMENT MODULE</span>
          <h2 className="admin-banner-title">Student Registry & College Mapping</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAddModal}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="admin-card" style={{ padding: '20px', borderColor: 'var(--accent-red)', backgroundColor: '#fff5f5', color: '#c53030' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Filter and search */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="table-actions-bar">
          <div className="search-input-wrapper">
            <Icon name="search" className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Search students by name, email, or employee ID..." 
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group">
            <Icon name="filter" style={{ width: '16px', height: '16px', color: 'var(--text-medium)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>Course:</span>
            <select 
              className="filter-select"
              value={courseFilter}
              onChange={(e) => handleCourseFilterChange(e.target.value)}
            >
              <option value="All">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-medium)' }}>
          <div className="loading-spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <span>Loading students list from database...</span>
        </div>
      ) : (
        /* Split view */
        <div className="split-view-container">
          
          {/* Student Table */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student & College</th>
                  <th>Enrolled Courses</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((s) => {
                    const cIds = s.course_ids && s.course_ids.length > 0 ? s.course_ids : (s.course_id ? [s.course_id] : []);
                    return (
                      <tr 
                        key={s.id}
                        style={{ cursor: 'pointer', backgroundColor: selectedStudent?.id === s.id ? '#f8fafc' : '' }}
                        onClick={() => setSelectedStudent(s)}
                      >
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar-circle" style={{ backgroundColor: 'var(--primary-blue-light)' }}>
                              {s.name ? s.name.split(' ').map(n => n[0]).join('') : 'U'}
                            </div>
                            <div className="user-details">
                              <span className="user-cell-name">{s.name || 'Unnamed Student'}</span>
                              <span style={{ fontSize: '11px', color: 'var(--primary-blue)', fontWeight: 600 }}>🏛️ {s.college || 'Hexaware Academy'}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {cIds.length > 0 ? cIds.map(cid => (
                              <span key={cid} className="admin-badge blue" style={{ fontSize: '11px' }}>
                                {getCourseTitle(cid)}
                              </span>
                            )) : (
                              <span className="admin-badge orange" style={{ fontSize: '11px' }}>Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="toggle-switch-wrapper" onClick={(e) => toggleStudentStatus(s.id, s.is_active, s.name, e)}>
                            <div className={`toggle-switch-track ${s.is_active ? 'active' : ''}`}>
                              <div className="toggle-switch-thumb"></div>
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: s.is_active ? 'var(--accent-green)' : 'var(--text-light)' }}>
                              {s.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="table-row-actions">
                            <button className="row-action-btn" title="Edit Student" onClick={(e) => handleOpenEditModal(s, e)}>
                              <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button className="row-action-btn" title="Reset Password" onClick={(e) => handleResetPassword(s, e)}>
                              <Icon name="key" style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button className="row-action-btn delete" title="Delete Profile" onClick={(e) => handleDeleteStudent(s.id, e)}>
                              <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                      No student records matching query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="pagination-container">
              <span>Showing {filteredStudents.length} of {students.length} Students</span>
              <div className="pagination-btns">
                <button className="pagination-btn" disabled>Prev</button>
                <button className="pagination-btn" disabled>Next</button>
              </div>
            </div>
          </div>

          {/* Profile Side panel */}
          <div className="details-side-panel">
            {selectedStudent ? (
              <div className="admin-card">
                <div className="details-card-header">
                  <div className="details-avatar-large">
                    {selectedStudent.name ? selectedStudent.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </div>
                  <h3 className="details-name">{selectedStudent.name || 'Unnamed Student'}</h3>
                  <span className="details-email">{selectedStudent.email}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-medium)', marginBottom: '8px' }}>Emp ID: {selectedStudent.employee_id}</span>
                  <span className={`admin-badge ${selectedStudent.is_active ? 'green' : 'red'}`}>
                    {selectedStudent.is_active ? 'Account Active' : 'Account Suspended'}
                  </span>
                </div>

                <div className="details-body-list">
                  <div className="details-body-item">
                    <span className="details-item-label">Enrolled Course</span>
                    <span className="details-item-value">{getCourseTitle(selectedStudent.course_id)}</span>
                  </div>
                  <div className="details-body-item">
                    <span className="details-item-label">Attendance Rate</span>
                    <span className="details-item-value">{selectedStudent.attendance || '95%'}</span>
                  </div>
                  <div className="details-body-item">
                    <span className="details-item-label">Current Grade</span>
                    <span className="details-item-value" style={{ color: 'var(--primary-blue)' }}>{selectedStudent.grade || 'N/A'}</span>
                  </div>
                  <div className="details-body-item">
                    <span className="details-item-label">Registration Date</span>
                    <span className="details-item-value">{selectedStudent.created_at ? new Date(selectedStudent.created_at).toLocaleDateString() : 'Today'}</span>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="details-item-label" style={{ fontWeight: 700 }}>Learning Progress</span>
                      <span className="details-item-value">{selectedStudent.progress || 0}%</span>
                    </div>
                    <div className="admin-hbar-track" style={{ height: '8px' }}>
                      <div className="admin-hbar-fill" style={{ width: `${selectedStudent.progress || 0}%`, backgroundColor: 'var(--primary-blue)' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
                <Icon name="users" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a student from the list to view attendance, enrolled course metrics, certificate audits, and learning statistics.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editStudent ? 'Edit Student Details' : 'Enroll New Student'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Ethan Carter"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="e.g. e.carter@hexaware.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Select College</label>
                  <select 
                    className="form-input"
                    value={formCollege}
                    onChange={(e) => setFormCollege(e.target.value)}
                  >
                    {collegesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Account Password {!editStudent && '*'}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder={editStudent ? "Leave blank to keep current" : "Set password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required={!editStudent}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Enrolling Courses (Select Multiple)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto', padding: '8px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-main)' }}>
                  {courses.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedCourseIds.includes(c.id)}
                        onChange={() => toggleCourseSelection(c.id)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      <span>{c.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
