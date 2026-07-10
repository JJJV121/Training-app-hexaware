import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminAssignments() {
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState(null);

  // Load states from mockDataService
  const [assignments, setAssignments] = useState(() => mockDataService.getAssignments());
  const [submissions, setSubmissions] = useState(() => mockDataService.getSubmissions());

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCourse, setFormCourse] = useState('Core Java Foundations');
  const [formDeadline, setFormDeadline] = useState('2026-07-20');

  // Grading Form Fields
  const [gradeScore, setGradeScore] = useState('');
  const [gradeRemarks, setGradeRemarks] = useState('');

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditAssignment(null);
    setFormTitle('');
    setFormCourse('Core Java Foundations');
    setFormDeadline('2026-07-20');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a, e) => {
    e.stopPropagation();
    setEditAssignment(a);
    setFormTitle(a.title);
    setFormCourse(a.course);
    setFormDeadline(a.deadline);
    setIsModalOpen(true);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this assignment and clear all student submissions?')) {
      const updated = assignments.filter(a => a.id !== id);
      setAssignments(updated);
      mockDataService.saveAssignments(updated);
      triggerToast('Assignment deleted.');
    }
  };

  const handleSaveAssignment = (e) => {
    e.preventDefault();
    if (!formTitle) return;

    if (editAssignment) {
      const updated = assignments.map(a => {
        if (a.id === editAssignment.id) {
          return { ...a, title: formTitle, course: formCourse, deadline: formDeadline };
        }
        return a;
      });
      setAssignments(updated);
      mockDataService.saveAssignments(updated);
      triggerToast('Assignment updated.');
    } else {
      const newAssignment = {
        id: Date.now(),
        title: formTitle,
        course: formCourse,
        deadline: formDeadline,
        submissions: '0/25',
        pending: 25
      };
      const updated = [...assignments, newAssignment];
      setAssignments(updated);
      mockDataService.saveAssignments(updated);
      triggerToast('New assignment published.');
    }
    setIsModalOpen(false);
  };

  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    const updated = submissions.map(sub => {
      if (sub.id === selectedSubmission.id) {
        const updatedSub = {
          ...sub,
          status: 'Graded',
          score: gradeScore,
          remarks: gradeRemarks
        };
        setSelectedSubmission(updatedSub);
        return updatedSub;
      }
      return sub;
    });
    setSubmissions(updated);
    mockDataService.saveSubmissions(updated);
    triggerToast(`Submission for ${selectedSubmission.student} graded: ${gradeScore}/100`);
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
          <span className="admin-banner-subtitle">ASSESSMENTS COORDINATOR</span>
          <h2 className="admin-banner-title">Assignment Management</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAdd}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create Assignment</span>
          </button>
        </div>
      </div>

      <div className="split-view-container">
        
        {/* Left column: List of assignments & Submissions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Assignments list table */}
          <div className="admin-table-container">
            <div className="admin-card-header" style={{ padding: '20px 20px 0 20px' }}>
              <h3 className="admin-card-title">
                <Icon name="file-text" className="admin-card-title-icon" />
                <span>Active Assignments</span>
              </h3>
            </div>

            <table className="admin-table" style={{ marginTop: '16px' }}>
              <thead>
                <tr>
                  <th>Assignment Title</th>
                  <th>Course</th>
                  <th>Deadline</th>
                  <th>Submissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>
                      <span style={{ fontWeight: 700 }}>{a.title}</span>
                    </td>
                    <td>
                      <span className="admin-badge blue">{a.course}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>ðŸ“… {a.deadline}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{a.submissions}</span>
                      <span style={{ fontSize: '11px', display: 'block', color: 'var(--text-medium)' }}>{a.pending} pending review</span>
                    </td>
                    <td>
                      <div className="table-row-actions">
                        <button className="row-action-btn" title="Modify Assignment" onClick={(e) => handleOpenEdit(a, e)}>
                          <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                        </button>
                        <button className="row-action-btn delete" title="Remove Assignment" onClick={(e) => handleDelete(a.id, e)}>
                          <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Student Submissions List */}
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
                  <th>Student Name</th>
                  <th>Assignment</th>
                  <th>File Name</th>
                  <th>Submitted At</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr 
                    key={sub.id} 
                    style={{ cursor: 'pointer', backgroundColor: selectedSubmission?.id === sub.id ? '#f8fafc' : '' }}
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setGradeScore(sub.score);
                      setGradeRemarks(sub.remarks);
                    }}
                  >
                    <td>
                      <span style={{ fontWeight: 700 }}>{sub.student}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px' }}>{sub.assignment}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--primary-blue)', textDecoration: 'underline' }}>{sub.file}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>{sub.submittedAt}</span>
                    </td>
                    <td>
                      <span className={`admin-badge ${sub.status === 'Graded' ? 'green' : 'orange'}`}>{sub.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right column: Grading Pane */}
        <div className="details-side-panel">
          {selectedSubmission ? (
            <div className="admin-card">
              <div className="details-card-header" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                <span className={`admin-badge ${selectedSubmission.status === 'Graded' ? 'green' : 'orange'}`} style={{ marginBottom: '8px' }}>
                  {selectedSubmission.status}
                </span>
                <h3 className="details-name">{selectedSubmission.student}</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-medium)' }}>Task: <strong>{selectedSubmission.assignment}</strong></span>
                
                <div style={{ border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '12px', width: '100%', marginTop: '16px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-medium)' }}>ATTACHMENT</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-blue)' }}>{selectedSubmission.file}</span>
                  </div>
                  <button className="row-action-btn" title="Download submission" onClick={() => triggerToast(`Downloading ${selectedSubmission.file}`)}>
                    <Icon name="download" style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>

              <div className="details-body-list" style={{ marginTop: '0' }}>
                <form onSubmit={handleGradeSubmit} className="modal-form">
                  <div className="form-group">
                    <label className="form-label">Grade Score (out of 100)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      className="form-input" 
                      placeholder="e.g. 95"
                      value={gradeScore}
                      onChange={(e) => setGradeScore(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Review Remarks / Feedback</label>
                    <textarea 
                      className="form-textarea" 
                      placeholder="Write constructive suggestions..."
                      value={gradeRemarks}
                      onChange={(e) => setGradeRemarks(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="action-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Publish Grade & Remarks
                  </button>
                </form>

                {selectedSubmission.status === 'Graded' && (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-medium)', fontWeight: 600 }}>Active Grade:</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-green)' }}>{selectedSubmission.score}/100</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-medium)', fontStyle: 'italic' }}>"{selectedSubmission.remarks}"</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
              <Icon name="file-text" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
              <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a student submission from the bottom list to download code archives, write remarks, and submit grades.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create / Edit Assignment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editAssignment ? 'Modify Assignment Settings' : 'Create Assignment Task'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="modal-form">
              <div className="form-group">
                <label className="form-label">Assignment Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Design Pattern Implementation"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Associated Course</label>
                <select className="form-input" value={formCourse} onChange={(e) => setFormCourse(e.target.value)}>
                  <option value="Core Java Foundations">Core Java Foundations</option>
                  <option value="Python for Data Analysis">Python for Data Analysis</option>
                  <option value="SQL & DBMS Essentials">SQL & DBMS Essentials</option>
                  <option value="React Frontend Advanced">React Frontend Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Submission Deadline Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Publish Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
