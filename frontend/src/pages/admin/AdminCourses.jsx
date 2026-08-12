import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import adminCourseService from '../../services/adminCourseService';
import trainerMockService from '../../services/trainerMockService';

export default function AdminCourses() {
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  // API State management
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Backend Development');
  const [formTrainer, setFormTrainer] = useState('');
  const [formDuration, setFormDuration] = useState('10');
  const [formSyllabus, setFormSyllabus] = useState('');
  const [formResources, setFormResources] = useState(10);

  // Fetch all trainers for assigning dropdown (mock fallback)
  const trainersList = trainerMockService.getTrainers();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminCourseService.getCourses();
      // Enrich each course with actual enrollment and completion stats from backend
      const enriched = await Promise.all(
        data.map(async (course) => {
          try {
            const [students, completions] = await Promise.all([
              adminCourseService.getEnrolledStudents(course.id),
              adminCourseService.getCourseCompletion(course.id)
            ]);
            const avgProgress = completions.length > 0
              ? Math.round(completions.reduce((sum, item) => sum + item.completion_percentage, 0) / completions.length)
              : 0;
            return {
              ...course,
              enrolled: students.length,
              completionRate: avgProgress
            };
          } catch (e) {
            console.error(`Failed to enrich stats for course ${course.id}:`, e);
            return {
              ...course,
              enrolled: 0,
              completionRate: 0
            };
          }
        })
      );
      setCourses(enriched);
    } catch (err) {
      console.error('Failed to retrieve course catalog:', err);
      setError('Could not retrieve course catalog. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditCourse(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('Backend Development');
    setFormTrainer(trainersList[0]?.name || '');
    setFormDuration('10');
    setFormSyllabus('');
    setFormResources(10);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditCourse(course);
    setFormTitle(course.title);
    setFormDescription(course.description || '');
    setFormCategory(course.category || 'Backend Development');
    setFormTrainer(course.trainer || trainersList[0]?.name || '');
    setFormDuration(String(course.duration_days));
    setFormSyllabus(course.thumbnail_url || '');
    setFormResources(course.resourcesCount || 10);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this course from the catalog? This will remove all student linkages.')) {
      try {
        await adminCourseService.deleteCourse(id);
        triggerToast('Course deleted successfully.');
        loadCourses();
      } catch (err) {
        console.error('Failed to delete course:', err);
        alert(err.response?.data?.detail || 'Failed to delete course.');
      }
    }
  };

  const togglePublish = async (id, currentPublishedState) => {
    const nextState = !currentPublishedState;
    try {
      await adminCourseService.updateCourseStatus(id, nextState);
      triggerToast(`Course status updated to ${nextState ? 'Published' : 'Draft'}.`);
      loadCourses();
    } catch (err) {
      console.error('Failed to update course status:', err);
      alert(err.response?.data?.detail || 'Failed to update course status.');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formTitle || !formDescription) {
      alert('Please fill out all fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      title: formTitle,
      description: formDescription,
      duration_days: parseInt(formDuration) || 10,
      thumbnail_url: formSyllabus || 'default_syllabus.pdf'
    };

    try {
      if (editCourse) {
        await adminCourseService.updateCourse(editCourse.id, payload);
        triggerToast('Course updated successfully.');
      } else {
        await adminCourseService.createCourse(payload);
        triggerToast('Course created successfully.');
      }
      setIsModalOpen(false);
      loadCourses();
    } catch (err) {
      console.error('Failed to save course:', err);
      alert(err.response?.data?.detail || 'Failed to save course structure.');
    } finally {
      setSubmitting(false);
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
          <span className="admin-banner-subtitle">COURSE CATALOG</span>
          <h2 className="admin-banner-title">LMS Course Management</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleOpenAdd}>
            <Icon name="plus" style={{ width: '16px', height: '16px' }} />
            <span>Create Course</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="admin-card" style={{ padding: '20px', borderColor: 'var(--accent-red)', backgroundColor: '#fff5f5', color: '#c53030' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--text-medium)' }}>
          <div className="loading-spinner" style={{ border: '3px solid #f3f3f3', borderTop: '3px solid var(--primary-blue)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }}></div>
          <span>Loading course catalog from database...</span>
        </div>
      ) : (
        /* Grid List of Courses */
        <div className="admin-stats-grid-9" style={{ marginTop: '0', gridTemplateColumns: 'repeat(2, 1fr)' }}>
          {courses.length > 0 ? (
            courses.map(course => (
              <div key={course.id} className="admin-card" style={{ gap: '16px' }}>
                <div className="admin-card-header">
                  <span className="admin-badge blue" style={{ fontSize: '10px' }}>{course.category || 'Technology'}</span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`admin-badge ${course.is_active ? 'green' : 'orange'}`}>
                      {course.is_active ? 'Published' : 'Draft'}
                    </span>
                    <div className="toggle-switch-track" style={{ width: '36px', height: '18px' }} onClick={() => togglePublish(course.id, course.is_active)}>
                      <div className="toggle-switch-thumb" style={{ width: '12px', height: '12px', transform: course.is_active ? 'translateX(18px)' : 'translateX(0)' }}></div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <h3 style={{ fontFamily: 'var(--font-family-header)', fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>{course.title}</h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-medium)', margin: '4px 0 8px 0', lineHeight: '1.4' }}>{course.description}</p>
                  <span style={{ fontSize: '12px', color: 'var(--text-medium)', fontWeight: 600 }}>Duration: {course.duration_days} Days | Trainer: {course.trainer || 'Unassigned'}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                  <div>
                    <span style={{ color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>Syllabus:</span>
                    <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-blue)', cursor: 'pointer' }} onClick={() => triggerToast(`Downloading ${course.thumbnail_url || 'syllabus.pdf'}`)}>
                      <Icon name="download" style={{ width: '14px', height: '14px' }} />
                      {course.thumbnail_url || 'syllabus.pdf'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>Resources:</span>
                    <span style={{ fontWeight: 700 }}>📚 {course.resourcesCount || 10} Files Uploaded</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>Enrolled: <strong>{course.enrolled} Students</strong></span>
                    <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>Avg Progress: <strong>{course.completionRate}%</strong></span>
                  </div>
                  
                  <div className="table-row-actions">
                    <button className="row-action-btn" title="Modify Course" onClick={() => handleOpenEdit(course)}>
                      <Icon name="edit-3" style={{ width: '14px', height: '14px' }} />
                    </button>
                    <button className="row-action-btn delete" title="Delete Course" onClick={() => handleDelete(course.id)}>
                      <Icon name="trash-2" style={{ width: '14px', height: '14px' }} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '48px', color: 'var(--text-light)' }}>
              No courses found in database. Create one using the "Create Course" button.
            </div>
          )}
        </div>
      )}

      {/* Course Edit/Add Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 className="modal-title">{editCourse ? 'Modify Course Structure' : 'Develop New Course'}</h3>
              <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
                <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSave} className="modal-form">
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Next.js Masterclass"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Course Description</label>
                <textarea 
                  className="form-input" 
                  placeholder="e.g. Master modern backend/frontend technologies..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  required
                  style={{ minHeight: '80px', padding: '8px', fontFamily: 'inherit' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category Department</label>
                <select 
                  className="form-input"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="Backend Development">Backend Development</option>
                  <option value="Frontend Development">Frontend Development</option>
                  <option value="Database Systems">Database Systems</option>
                  <option value="Data Science">Data Science</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Lead Trainer (Mock)</label>
                <select 
                  className="form-input"
                  value={formTrainer}
                  onChange={(e) => setFormTrainer(e.target.value)}
                >
                  {trainersList.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Course Duration (Days)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 10"
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Syllabus PDF File Name</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. syllabus.pdf"
                    value={formSyllabus}
                    onChange={(e) => setFormSyllabus(e.target.value)}
                  />
                  <button type="button" className="action-btn-secondary" style={{ padding: '0 16px' }} onClick={() => triggerToast('Syllabus upload simulated!')}>
                    <Icon name="upload" style={{ width: '16px', height: '16px' }} />
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mock Learning Resources Count</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={formResources}
                  onChange={(e) => setFormResources(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="action-btn-secondary" style={{ padding: '8px 16px' }} onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Course'}
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
