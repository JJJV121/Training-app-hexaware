import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminStudents() {
  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);

  // Load state from mockDataService
  const [students, setStudents] = useState(() => mockDataService.getStudents());

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCourse, setFormCourse] = useState('Core Java Foundations');
  const [formProgress, setFormProgress] = useState(0);
  const [formAttendance, setFormAttendance] = useState('95%');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAddModal = () => {
    setEditStudent(null);
    setFormName('');
    setFormEmail('');
    setFormCourse('Core Java Foundations');
    setFormProgress(0);
    setFormAttendance('95%');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (student, e) => {
    e.stopPropagation();
    setEditStudent(student);
    setFormName(student.name);
    setFormEmail(student.email);
    setFormCourse(student.course);
    setFormProgress(student.progress);
    setFormAttendance(student.attendance);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this student record?')) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      mockDataService.saveStudents(updated);
      if (selectedStudent && selectedStudent.id === id) {
        setSelectedStudent(null);
      }
      triggerToast('Student profile deleted.');
    }
  };

  const handleResetPassword = (student, e) => {
    e.stopPropagation();
    if (confirm(`Reset password for ${student.name}? Temporary password will be sent via email.`)) {
      triggerToast(`Password reset link sent to ${student.email}`);
    }
  };

  const toggleStudentStatus = (id, e) => {
    e.stopPropagation();
    const updated = students.map(s => {
      if (s.id === id) {
        const nextState = !s.active;
        triggerToast(`Account for ${s.name} ${nextState ? 'activated' : 'deactivated'}.`);
        
        // Update sidebar state if selected
        if (selectedStudent && selectedStudent.id === id) {
          setSelectedStudent({ ...selectedStudent, active: nextState });
        }
        return { ...s, active: nextState };
      }
      return s;
    });
    setStudents(updated);
    mockDataService.saveStudents(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('Please fill out all fields.');
      return;
    }

    if (editStudent) {
      const updated = students.map(s => {
        if (s.id === editStudent.id) {
          return {
            ...s,
            name: formName,
            email: formEmail,
            course: formCourse,
            progress: parseInt(formProgress),
            attendance: formAttendance
          };
        }
        return s;
      });
      setStudents(updated);
      mockDataService.saveStudents(updated);
      if (selectedStudent && selectedStudent.id === editStudent.id) {
        setSelectedStudent({
          ...selectedStudent,
          name: formName,
          email: formEmail,
          course: formCourse,
          progress: parseInt(formProgress),
          attendance: formAttendance
        });
      }
      triggerToast('Student details saved.');
    } else {
      const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
      const newStudent = {
        id: newId,
        name: formName,
        email: formEmail,
        course: formCourse,
        progress: parseInt(formProgress),
        attendance: formAttendance,
        active: true,
        joinDate: 'Today',
        certUnlocked: false,
        grade: 'N/A'
      };
      const updated = [...students, newStudent];
      setStudents(updated);
      mockDataService.saveStudents(updated);
      triggerToast('New student added successfully.');
    }
    setIsModalOpen(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === 'All' || s.course === courseFilter;
    return matchesSearch && matchesCourse;
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
          <span className="admin-banner-subtitle">USER MANAGEMENT</span>
          <h2 className="admin-banner-title">Student Registry & Progress</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAddModal}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Add Student</span>
          </button>
        </div>
      </div>

      {/* Filter and search */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="table-actions-bar">
          <div className="search-input-wrapper">
            <Icon name="search" className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Search students by name, email, or course..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <Icon name="filter" style={{ width: '16px', height: '16px', color: 'var(--text-medium)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>Course:</span>
            <select 
              className="filter-select"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              <option value="All">All Courses</option>
              <option value="Core Java Foundations">Core Java Foundations</option>
              <option value="Python for Data Analysis">Python for Data Analysis</option>
              <option value="SQL & DBMS Essentials">SQL & DBMS Essentials</option>
              <option value="React Frontend Advanced">React Frontend Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="split-view-container">
        
        {/* Student Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Enrolled Course</th>
                <th>Attendance</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s) => (
                  <tr 
                    key={s.id}
                    style={{ cursor: 'pointer', backgroundColor: selectedStudent?.id === s.id ? '#f8fafc' : '' }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-circle" style={{ backgroundColor: 'var(--primary-blue-light)' }}>
                          {s.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="user-details">
                          <span className="user-cell-name">{s.name}</span>
                          <span className="user-cell-email">{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge blue">{s.course}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{s.attendance}</span>
                    </td>
                    <td>
                      <div className="toggle-switch-wrapper" onClick={(e) => toggleStudentStatus(s.id, e)}>
                        <div className={`toggle-switch-track ${s.active ? 'active' : ''}`}>
                          <div className="toggle-switch-thumb"></div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: s.active ? 'var(--accent-green)' : 'var(--text-light)' }}>
                          {s.active ? 'Active' : 'Inactive'}
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
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
                  {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 className="details-name">{selectedStudent.name}</h3>
                <span className="details-email">{selectedStudent.email}</span>
                <span className={`admin-badge ${selectedStudent.active ? 'green' : 'red'}`}>
                  {selectedStudent.active ? 'Account Active' : 'Account Suspended'}
                </span>
              </div>

              <div className="details-body-list">
                <div className="details-body-item">
                  <span className="details-item-label">Enrolled Course</span>
                  <span className="details-item-value">{selectedStudent.course}</span>
                </div>
                <div className="details-body-item">
                  <span className="details-item-label">Attendance Rate</span>
                  <span className="details-item-value">{selectedStudent.attendance}</span>
                </div>
                <div className="details-body-item">
                  <span className="details-item-label">Current Grade</span>
                  <span className="details-item-value" style={{ color: 'var(--primary-blue)' }}>{selectedStudent.grade}</span>
                </div>
                <div className="details-body-item">
                  <span className="details-item-label">Registration Date</span>
                  <span className="details-item-value">{selectedStudent.joinDate}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="details-item-label" style={{ fontWeight: 700 }}>Learning Progress</span>
                    <span className="details-item-value">{selectedStudent.progress}%</span>
                  </div>
                  <div className="admin-hbar-track" style={{ height: '8px' }}>
                    <div className="admin-hbar-fill" style={{ width: `${selectedStudent.progress}%`, backgroundColor: 'var(--primary-blue)' }}></div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)' }}>Course Certificate</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>
                      {selectedStudent.progress === 100 ? 'Eligible for unlock' : 'Locked (course incomplete)'}
                    </span>
                  </div>
                  <button 
                    className="row-action-btn"
                    title={selectedStudent.certUnlocked ? 'Lock Certificate' : 'Unlock Certificate'}
                    onClick={() => {
                      const nextState = !selectedStudent.certUnlocked;
                      setStudents(students.map(s => s.id === selectedStudent.id ? { ...s, certUnlocked: nextState } : s));
                      setSelectedStudent({ ...selectedStudent, certUnlocked: nextState });
                      triggerToast(`Certificate for ${selectedStudent.name} ${nextState ? 'Unlocked' : 'Locked'}`);
                    }}
                    style={{
                      backgroundColor: selectedStudent.certUnlocked ? 'var(--accent-green-light)' : '#f1f5f9',
                      color: selectedStudent.certUnlocked ? 'var(--accent-green)' : 'var(--text-medium)',
                      borderColor: selectedStudent.certUnlocked ? 'var(--accent-green)' : 'var(--border-color)'
                    }}
                  >
                    <Icon name={selectedStudent.certUnlocked ? 'award' : 'lock'} style={{ width: '16px', height: '16px' }} />
                  </button>
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

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g. g.mohan@hexaware.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Enrolled Course</label>
                <select 
                  className="form-input"
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                >
                  <option value="Core Java Foundations">Core Java Foundations</option>
                  <option value="Python for Data Analysis">Python for Data Analysis</option>
                  <option value="SQL & DBMS Essentials">SQL & DBMS Essentials</option>
                  <option value="React Frontend Advanced">React Frontend Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Course Progress ({formProgress}%)</label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  className="form-input"
                  value={formProgress}
                  onChange={(e) => setFormProgress(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Attendance Record</label>
                <input 
                  type="text" 
                  className="form-input"
                  placeholder="e.g. 96%"
                  value={formAttendance}
                  onChange={(e) => setFormAttendance(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Save Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
