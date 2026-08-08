import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminDashboard() {
  const [toastMsg, setToastMsg] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Mock Overview stats dynamically computed from central service
  const stats = mockDataService.getDashboardOverviewStats();

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

  const upcomingSessions = mockDataService.getCalendarEvents()
    .filter(e => e.type === 'Session' || e.type === 'Exam')
    .slice(0, 3);

  const activeBatches = mockDataService.getBatches().slice(0, 3);

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
        {stats.map((stat, i) => (
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

      {/* Row: Active College Batches & Upcoming Timetable */}
      <div className="admin-dashboard-row-equal">
        
        {/* Active Batches by College */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="layers" className="admin-card-title-icon" />
              <span>College Batch Formation Summary</span>
            </h3>
            <a href="#admin-batches" className="action-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>Manage Batches</a>
          </div>

          <div className="widget-list">
            {activeBatches.map((b, idx) => (
              <div key={idx} className="widget-item-row">
                <div className="widget-item-left">
                  <div className="widget-item-icon-circle" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                    <Icon name="layers" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div className="widget-item-info">
                    <span className="widget-item-title">{b.code} ({b.college})</span>
                    <span className="widget-item-desc">{b.course} • Trainer: {b.trainer}</span>
                  </div>
                </div>
                <span className="admin-badge green" style={{ fontSize: '10px' }}>{b.trainees ? b.trainees.length : 0} Trainees</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions widget */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="calendar" className="admin-card-title-icon" />
              <span>Upcoming Scheduled Sessions</span>
            </h3>
            <a href="#admin-calendar" className="action-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>View Calendar</a>
          </div>

          <div className="widget-list">
            {upcomingSessions.map((sess, idx) => (
              <div key={idx} className="widget-item-row">
                <div className="widget-item-left">
                  <div className="widget-item-icon-circle" style={{ backgroundColor: 'var(--accent-orange-light)', color: 'var(--accent-orange)' }}>
                    <Icon name="clock" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div className="widget-item-info">
                    <span className="widget-item-title">{sess.title}</span>
                    <span className="widget-item-desc">{sess.batch} • {sess.trainer}</span>
                  </div>
                </div>
                <span className="widget-time" style={{ color: 'var(--accent-orange)' }}>{sess.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
