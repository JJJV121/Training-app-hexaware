import { useState, useEffect } from 'react';
import Icon from '../../components/Icon';
import adminCourseService from '../../services/adminCourseService';
import adminUserService from '../../services/adminUserService';
import batchService from '../../services/batchService';
import trainerMockService from '../../services/trainerMockService';
import { assignmentService } from '../../services/assignmentService';

export default function AdminDashboard() {
  const [toastMsg, setToastMsg] = useState(null);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [dashboardStats, setDashboardStats] = useState([
    { label: 'Total Students', value: '...', icon: 'users', color: 'blue' },
    { label: 'Total Trainers', value: '...', icon: 'user', color: 'green' },
    { label: 'Total Courses', value: '...', icon: 'book-open', color: 'blue' },
    { label: 'Active Courses', value: '...', icon: 'activity', color: 'green' },
    { label: 'Total Batches', value: '...', icon: 'layers', color: 'orange' },
    { label: 'Assignments & Assessments', value: '...', icon: 'file-text', color: 'red' },
    { label: 'Colleges Onboarded', value: '5', icon: 'check-circle', color: 'green' }
  ]);
  const [loading, setLoading] = useState(true);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [coursesData, trainees, batchesData, assignments] = await Promise.all([
          adminCourseService.getCourses(),
          adminUserService.getTrainees(),
          batchService.getBatches(),
          assignmentService.getAssignments()
        ]);
        const trainers = trainerMockService.getTrainers();
        const activeCoursesCount = coursesData.filter(c => c.is_active).length;
        const batchesList = batchesData.batches || [];
        
        setCourses(coursesData);
        setBatches(batchesList);

        setDashboardStats([
          { label: 'Total Students', value: trainees.length.toString(), icon: 'users', color: 'blue' },
          { label: 'Total Trainers', value: trainers.length.toString(), icon: 'user', color: 'green' },
          { label: 'Total Courses', value: coursesData.length.toString(), icon: 'book-open', color: 'blue' },
          { label: 'Active Courses', value: activeCoursesCount.toString(), icon: 'activity', color: 'green' },
          { label: 'Total Batches', value: batchesList.length.toString(), icon: 'layers', color: 'orange' },
          { label: 'Assignments & Assessments', value: assignments.length.toString(), icon: 'file-text', color: 'red' },
          { label: 'Colleges Onboarded', value: '5', icon: 'check-circle', color: 'green' }
        ]);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Quick Action items representing core modules
  const quickActions = [
    { label: 'Trainer Management', icon: 'user', page: 'admin-trainers', desc: 'Manage trainers & workload' },
    { label: 'Student Management', icon: 'users', page: 'admin-students', desc: 'Manage trainees & colleges' },
    { label: 'Course Management', icon: 'book-open', page: 'admin-courses', desc: 'Manage course catalog & syllabus' },
    { label: 'Course Assignment', icon: 'sliders', page: 'admin-course-assignment', desc: 'Assign courses to batches/trainees' },
    { label: 'Batch Management', icon: 'layers', page: 'admin-batches', desc: 'College-based batch & trainer formation' },
    { label: 'Assignments & Assessments', icon: 'file-text', page: 'admin-assignments', desc: 'Post assignments & assessments' },
    { label: 'Calendar & Schedule', icon: 'calendar', page: 'admin-calendar', desc: 'Schedule classes & timetable' }
  ];

  const activeBatches = batches.slice(0, 3);
  const trainersList = trainerMockService.getTrainers();

  return (
    <div className="page-view admin-container">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Blue Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">HEXAWARE ADMIN PLATFORM</span>
          <h2 className="admin-banner-title">Welcome Back, Administrator! 👋</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>Streamlined Management Portal with Core Operational Modules</p>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={() => triggerToast('System Health: All 7 Core Modules Operational')}>
            <Icon name="activity" style={{ width: '16px', height: '16px' }} />
            <span>System Status</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid-9">
        {dashboardStats.map((stat, i) => (
          <div key={i} className="admin-stat-card">
            <div className={`admin-stat-icon-bg ${stat.color}`}>
              <Icon name={stat.icon} style={{ width: '20px', height: '20px' }} />
            </div>
            <div className="admin-stat-info">
              <span className="admin-stat-val">{stat.value}</span>
              <span className="admin-stat-lbl">{stat.label}</span>
            </div>
          </div>
        ))}
      </div>


      {/* Core Modules Quick Hub */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <Icon name="sliders" className="admin-card-title-icon" />
            <span>Core Operational Modules</span>
          </h3>
        </div>

        <div className="quick-actions-grid" style={{ gridTemplateColumns: 'repeat( auto-fit, minmax(220px, 1fr) )' }}>
          {quickActions.map((qa, i) => (
            <a 
              href={`#${qa.page}`} 
              key={i} 
              className="quick-action-card"
              onClick={() => triggerToast(`Opening ${qa.label}`)}
              style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '16px', gap: '8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name={qa.icon} className="quick-action-icon" style={{ width: '20px', height: '20px', color: 'var(--primary-blue)' }} />
                <span className="quick-action-label" style={{ fontWeight: 700, fontSize: '13px' }}>{qa.label}</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-medium)' }}>{qa.desc}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Active College Batches */}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">
            <Icon name="layers" className="admin-card-title-icon" />
            <span>College Batch Formation Summary</span>
          </h3>
          <a href="#admin-batches" className="action-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Manage Batches</a>
        </div>

        <div className="widget-list">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-medium)' }}>
              Loading batches...
            </div>
          ) : activeBatches.length > 0 ? (
            activeBatches.map((b, idx) => {
              const courseTitle = courses.find(c => c.id === b.course_id)?.title || 'Unassigned Course';
              const trainerName = trainersList.find(t => t.id === b.trainer_id)?.name || 'Unassigned Trainer';
              return (
                <div key={idx} className="widget-item-row">
                  <div className="widget-item-left">
                    <div className="widget-item-icon-circle" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                      <Icon name="layers" style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="widget-item-info">
                      <span className="widget-item-title">{b.name}</span>
                      <span className="widget-item-desc">{courseTitle} • Trainer: {trainerName}</span>
                    </div>
                  </div>
                  <span className="admin-badge green" style={{ fontSize: '10px' }}>{b.max_strength} Capacity</span>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-medium)', fontSize: '13px' }}>
              No active batches registered.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
