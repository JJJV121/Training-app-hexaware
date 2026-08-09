import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminCourses() {
  const [toastMsg, setToastMsg] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCourse, setEditCourse] = useState(null);

  // Load state from mockDataService
  const [courses, setCourses] = useState(() => mockDataService.getCourses());

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Backend Development');
  const [formTrainer, setFormTrainer] = useState('Dr. Ava Thompson');
  const [formDuration, setFormDuration] = useState('10 Days');
  const [formSyllabus, setFormSyllabus] = useState('');
  const [formResources, setFormResources] = useState(10);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenAdd = () => {
    setEditCourse(null);
    setFormTitle('');
    setFormCategory('Backend Development');
    setFormTrainer('Dr. Ava Thompson');
    setFormDuration('10 Days');
    setFormSyllabus('');
    setFormResources(10);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditCourse(course);
    setFormTitle(course.title);
    setFormCategory(course.category);
    setFormTrainer(course.trainer);
    setFormDuration(course.duration);
    setFormSyllabus(course.syllabusName);
    setFormResources(course.resourcesCount);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this course from the catalog? This will remove all student linkages.')) {
      const updated = courses.filter(c => c.id !== id);
      setCourses(updated);
      mockDataService.saveCourses(updated);
      triggerToast('Course deleted successfully.');
    }
  };

  const togglePublish = (id) => {
    const updated = courses.map(c => {
      if (c.id === id) {
        const nextState = !c.published;
        triggerToast(`Course ${c.title} ${nextState ? 'published' : 'unpublished'}.`);
        return { ...c, published: nextState };
      }
      return c;
    });
    setCourses(updated);
    mockDataService.saveCourses(updated);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formTitle) {
      alert('Please enter a course title.');
      return;
    }

    if (editCourse) {
      const updated = courses.map(c => {
        if (c.id === editCourse.id) {
          return {
            ...c,
            title: formTitle,
            category: formCategory,
            trainer: formTrainer,
            duration: formDuration,
            syllabusName: formSyllabus || 'uploaded_syllabus.pdf',
            resourcesCount: parseInt(formResources)
          };
        }
        return c;
      });
      setCourses(updated);
      mockDataService.saveCourses(updated);
      triggerToast('Course updated.');
    } else {
      const newId = courses.length > 0 ? Math.max(...courses.map(c => c.id)) + 1 : 1;
      const newCourse = {
        id: newId,
        title: formTitle,
        category: formCategory,
        trainer: formTrainer,
        duration: formDuration,
        published: false,
        enrolled: 0,
        completionRate: 0,
        syllabusName: formSyllabus || 'default_syllabus.pdf',
        resourcesCount: parseInt(formResources)
      };
      const updated = [...courses, newCourse];
      setCourses(updated);
      mockDataService.saveCourses(updated);
      triggerToast('Course created in draft.');
    }
    setIsModalOpen(false);
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

      {/* Grid List of Courses */}
      <div className="admin-stats-grid-9" style={{ marginTop: '0', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        {courses.map(course => (
          <div key={course.id} className="admin-card" style={{ gap: '16px' }}>
            <div className="admin-card-header">
              <span className="admin-badge blue" style={{ fontSize: '10px' }}>{course.category}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className={`admin-badge ${course.published ? 'green' : 'orange'}`}>
                  {course.published ? 'Published' : 'Draft'}
                </span>
                <div className="toggle-switch-track" style={{ width: '36px', height: '18px' }} onClick={() => togglePublish(course.id)}>
                  <div className={`toggle-switch-thumb`} style={{ width: '12px', height: '12px', transform: course.published ? 'translateX(18px)' : 'translateX(0)' }}></div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <h3 style={{ fontFamily: 'var(--font-family-header)', fontSize: '18px', fontWeight: 800, color: 'var(--text-dark)' }}>{course.title}</h3>
              <span style={{ fontSize: '12px', color: 'var(--text-medium)', fontWeight: 600 }}>Duration: {course.duration} | Trainer: {course.trainer}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>Syllabus:</span>
                <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--primary-blue)', cursor: 'pointer' }} onClick={() => triggerToast(`Downloading ${course.syllabusName}`)}>
                  <Icon name="download" style={{ width: '14px', height: '14px' }} />
                  {course.syllabusName}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--text-medium)', display: 'block', marginBottom: '2px' }}>Resources:</span>
                <span style={{ fontWeight: 700 }}>ðŸ“š {course.resourcesCount} Files Uploaded</span>
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
        ))}
      </div>

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
                <label className="form-label">Assign Lead Trainer</label>
                <select 
                  className="form-input"
                  value={formTrainer}
                  onChange={(e) => setFormTrainer(e.target.value)}
                >
                  <option value="Dr. Ava Thompson">Dr. Ava Thompson</option>
                  <option value="Prof. Noah Parker">Prof. Noah Parker</option>
                  <option value="Dr. Mason Cooper">Dr. Mason Cooper</option>
                  <option value="Amelia Scott">Amelia Scott</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Course Duration</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. 10 Days"
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
                <button type="submit" className="action-btn-primary" style={{ padding: '8px 16px' }}>Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
