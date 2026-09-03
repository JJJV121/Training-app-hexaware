import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import adminUserService from '../../services/adminUserService';
import adminCourseService from '../../services/adminCourseService';
import batchService from '../../services/batchService';

export default function AdminTrainers() {
  const [toastMsg, setToastMsg] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expertFilter, setExpertFilter] = useState('All');
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTrainer, setEditTrainer] = useState(null); // null means adding a new trainer

  // API State
  const [trainers, setTrainers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCourseId, setFormCourseId] = useState('');
  const [formRating, setFormRating] = useState(4.5);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    loadTrainersAndCourses();
  }, []);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleExpertFilterChange = (courseId) => {
    setExpertFilter(courseId || 'All');
  };

  const loadTrainersAndCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const [trainersData, coursesData, batchesData] = await Promise.all([
        adminUserService.getTrainers(),
        adminCourseService.getCourses(),
        batchService.getBatches()
      ]);
      
      const batchesList = batchesData.batches || [];

      // Fetch trainees count for each batch
      const batchTraineesMap = {};
      await Promise.all(
        batchesList.map(async (b) => {
          try {
            const traineeIds = await batchService.getBatchTrainees(b.id);
            batchTraineesMap[b.id] = traineeIds.length;
          } catch (e) {
            console.error(e);
            batchTraineesMap[b.id] = 0;
          }
        })
      );

      // Enrich trainers
      const enrichedTrainers = trainersData.map(t => {
        const trainerBatches = batchesList.filter(b => b.trainer_id === t.id);
        const trainerBatchNames = trainerBatches.map(b => b.name);
        
        const trainerCourseIds = new Set((t.course_ids || []).map(Number));
        if (t.course_id) trainerCourseIds.add(Number(t.course_id));
        trainerBatches.forEach(b => {
          if (b.course_id) trainerCourseIds.add(b.course_id);
        });

        const trainerCourses = Array.from(trainerCourseIds).map(cid => {
          const c = coursesData.find(course => course.id === cid);
          return c ? c.title : null;
        }).filter(Boolean);

        const primaryCourse = coursesData.find(c => c.id === t.course_id);
        const expertise = primaryCourse ? primaryCourse.title : 'General Training';

        const totalStudents = trainerBatches.reduce((sum, b) => sum + (batchTraineesMap[b.id] || 0), 0);

        const rating = Number(localStorage.getItem(`trainer_rating_${t.id}`)) || 4.8;
        const attendance = localStorage.getItem(`trainer_attendance_${t.id}`) || '96%';
        const comments = localStorage.getItem(`trainer_comments_${t.id}`) || 'Thorough explanations, highly recommended by trainees.';

        return {
          ...t,
          assignedCourseIds: Array.from(trainerCourseIds),
          expertise,
          rating,
          batches: trainerBatchNames.length > 0 ? trainerBatchNames : ['No Active Batches'],
          courses: trainerCourses.length > 0 ? trainerCourses : ['Assigned Course'],
          attendance,
          students: totalStudents,
          comments
        };
      });

      setCourses(coursesData);
      setTrainers(enrichedTrainers);
    } catch (err) {
      console.error('Failed to load trainers:', err);
      setError('Could not retrieve trainers database registry.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditTrainer(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormCourseId(courses[0]?.id || '');
    setFormRating(4.5);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (trainer, e) => {
    e.stopPropagation();
    setEditTrainer(trainer);
    setFormName(trainer.name || '');
    setFormEmail(trainer.email || '');
    setFormPassword('');
    setFormCourseId(trainer.course_id || courses[0]?.id || '');
    setFormRating(trainer.rating || 4.5);
    setIsModalOpen(true);
  };

  const handleDeleteTrainer = async (id, e) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this trainer?')) {
      try {
        await adminUserService.deleteTrainer(id);
        if (selectedTrainer && selectedTrainer.id === id) {
          setSelectedTrainer(null);
        }
        triggerToast('Trainer deleted successfully.');
        loadTrainersAndCourses();
      } catch (err) {
        console.error('Failed to delete trainer:', err);
        alert(err.response?.data?.detail || 'Failed to delete trainer.');
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail || !formCourseId) {
      alert('Please fill out all required fields.');
      return;
    }
    if (!editTrainer && !formPassword) {
      alert('Please enter a password.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: formName,
      email: formEmail,
      course_id: Number(formCourseId),
      employee_id: editTrainer ? editTrainer.employee_id : `TR_${Date.now()}`,
      password: formPassword || 'Password123!'
    };

    try {
      if (editTrainer) {
        await adminUserService.updateTrainer(editTrainer.id, payload);
        localStorage.setItem(`trainer_rating_${editTrainer.id}`, formRating);
        triggerToast('Trainer details updated.');
      } else {
        const savedTrainer = await adminUserService.createTrainer(payload);
        if (savedTrainer && savedTrainer.id) {
          localStorage.setItem(`trainer_rating_${savedTrainer.id}`, formRating);
        }
        triggerToast('New trainer registered successfully.');
      }
      setIsModalOpen(false);
      loadTrainersAndCourses();
    } catch (err) {
      console.error('Failed to save trainer:', err);
      alert(err.response?.data?.detail || 'Failed to save trainer.');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter and Search logic
  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.expertise || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExpert = expertFilter === 'All' || (t.assignedCourseIds || [t.course_id]).map(Number).includes(Number(expertFilter));
    return matchesSearch && matchesExpert;
  });

  return (
    <div className="page-view admin-container">
      
      {/* Toast */}
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">USER MANAGEMENT</span>
          <h2 className="admin-banner-title">Trainer Management Portal</h2>
        </div>
        <div className="admin-banner-right" style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-banner-btn" onClick={() => window.location.hash = 'admin-mass-enrollment?type=trainers'} style={{ background: 'var(--card-bg, #ffffff)', color: 'var(--primary-color)' }}>
            <Icon name="upload-cloud" style={{ width: '16px', height: '16px' }} />
            <span>Bulk Import</span>
          </button>
          <button className="admin-banner-btn" onClick={handleOpenAddModal}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Add Trainer</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ padding: '20px', borderColor: 'var(--accent-red)', backgroundColor: '#fff5f5', color: '#c53030' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Actions and search bars */}
      <div className="admin-card" style={{ padding: '20px' }}>
        <div className="table-actions-bar">
          <div className="search-input-wrapper">
            <Icon name="search" className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Search trainers by name, email, or domain..." 
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>

          <div className="filter-group">
            <Icon name="filter" style={{ width: '16px', height: '16px', color: 'var(--text-medium)' }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-medium)' }}>Course Expertise:</span>
            <select 
              className="filter-select"
              value={expertFilter}
              onChange={(e) => handleExpertFilterChange(e.target.value)}
            >
              <option value="All">All Domains</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-medium)' }}>
          <div className="loading-spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <span>Loading trainers directory...</span>
        </div>
      ) : (
        <div className="split-view-container">
          
          {/* Table layout */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Trainer Name</th>
                  <th>Expertise Domain</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrainers.length > 0 ? (
                  filteredTrainers.map((t) => (
                    <tr 
                      key={t.id} 
                      style={{ cursor: 'pointer', backgroundColor: selectedTrainer?.id === t.id ? '#f8fafc' : '' }}
                      onClick={() => setSelectedTrainer(t)}
                    >
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-circle">
                            {t.name ? t.name.split(' ').map(n => n[0]).join('') : 'TR'}
                          </div>
                          <div className="user-details">
                            <span className="user-cell-name">{t.name || 'Unnamed Trainer'}</span>
                            <span className="user-cell-email">{t.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge blue">{t.expertise}</span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700 }}>⭐ {t.rating}</span>
                      </td>
                      <td>
                        <div className="table-row-actions">
                          <button className="row-action-btn" title="Edit Trainer" onClick={(e) => handleOpenEditModal(t, e)}>
                            <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                          </button>
                          <button className="row-action-btn delete" title="Remove Trainer" onClick={(e) => handleDeleteTrainer(t.id, e)}>
                            <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
                      No trainers match your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="pagination-container">
              <span>Showing {filteredTrainers.length} of {trainers.length} Trainers</span>
              <div className="pagination-btns">
                <button className="pagination-btn" disabled>Prev</button>
                <button className="pagination-btn" disabled>Next</button>
              </div>
            </div>
          </div>

          {/* Profile details drawer */}
          <div className="details-side-panel">
            {selectedTrainer ? (
              <div className="admin-card">
                <div className="details-card-header">
                  <div className="details-avatar-large">
                    {selectedTrainer.name ? selectedTrainer.name.split(' ').map(n => n[0]).join('') : 'TR'}
                  </div>
                  <h3 className="details-name">{selectedTrainer.name}</h3>
                  <span className="details-email">{selectedTrainer.email}</span>
                  <span className="admin-badge green">⭐ {selectedTrainer.rating} Feedback Rating</span>
                </div>

                <div className="details-body-list">
                  <div className="details-body-item">
                    <span className="details-item-label">Expertise Domain</span>
                    <span className="details-item-value">{selectedTrainer.expertise}</span>
                  </div>
                  <div className="details-body-item">
                    <span className="details-item-label">Total Assigned Students</span>
                    <span className="details-item-value">{selectedTrainer.students} Students</span>
                  </div>
                  <div className="details-body-item">
                    <span className="details-item-label">Trainer Attendance Rate</span>
                    <span className="details-item-value" style={{ color: 'var(--accent-green)' }}>{selectedTrainer.attendance}</span>
                  </div>
                  
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '8px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Assigned Courses</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedTrainer.courses.map((c, i) => (
                        <span key={i} className="admin-badge blue" style={{ fontSize: '10px' }}>{c}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '10px' }}>Assigned Batches</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedTrainer.batches.map((b, i) => (
                        <span key={i} className="admin-badge orange" style={{ fontSize: '10px' }}>{b}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-dark)', marginBottom: '6px' }}>Feedback Summary</h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-medium)', lineHeight: 1.4, fontStyle: 'italic' }}>
                      "{selectedTrainer.comments}"
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-card" style={{ justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', color: 'var(--text-light)', textAlign: 'center', border: '1px dashed #cbd5e1', background: 'none' }}>
                <Icon name="user" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', fontWeight: 600 }}>Select a trainer from the list to view profile details, assigned students, ratings, and course expertise.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Add / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editTrainer ? 'Modify Trainer Details' : 'Register New Trainer'}</h3>
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
                  placeholder="e.g. Dr. John Doe"
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
                  placeholder="e.g. j.doe@hexaware.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Course (Expertise Domain)</label>
                <select 
                  className="form-input"
                  value={formCourseId}
                  onChange={(e) => setFormCourseId(e.target.value)}
                  required
                >
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Account Password {!editTrainer && '*'}</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder={editTrainer ? "Leave blank to keep existing" : "Set login password"}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required={!editTrainer}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Default/Initial Rating ({formRating})</label>
                <input 
                  type="number" 
                  min="1.0" 
                  max="5.0" 
                  step="0.1"
                  className="form-input" 
                  value={formRating}
                  onChange={(e) => setFormRating(e.target.value)}
                  required
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Trainer'}
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
