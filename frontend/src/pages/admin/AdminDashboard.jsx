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

  // Quick Action items
  const quickActions = [
    { label: 'Add Trainer', icon: 'plus', page: 'trainers' },
    { label: 'Add Student', icon: 'plus', page: 'students' },
    { label: 'Create Course', icon: 'plus', page: 'courses' },
    { label: 'New Batch', icon: 'plus', page: 'batches' }
  ];

  const recentActivities = mockDataService.getActivityLogs().slice(0, 3);

  const upcomingSessions = mockDataService.getCalendarEvents()
    .filter(e => e.type === 'Session')
    .slice(0, 2);

  const pendingTasks = [
    { task: 'Approve Syllabus for Python Course', deadline: 'Today', status: 'High' },
    { task: 'Grade Java Assignment #3 Submissions', deadline: 'Tomorrow', status: 'Medium' }
  ];

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
          <h2 className="admin-banner-title">Welcome Back, Administrator! ðŸ‘‹</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={() => triggerToast('System Health Report Generated!')}>
            <Icon name="activity" style={{ width: '16px', height: '16px' }} />
            <span>Health Check</span>
          </button>
          <button className="admin-banner-btn" onClick={() => triggerToast('All data exported to admin_export.csv')}>
            <Icon name="download" style={{ width: '16px', height: '16px' }} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 9 Stats Grid */}
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

      {/* Row 1: Quick Actions & Pending Tasks side-by-side */}
      <div className="admin-dashboard-row-equal">
        
        {/* Quick Actions widget */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="sliders" className="admin-card-title-icon" />
              <span>Quick Actions</span>
            </h3>
          </div>

          <div className="quick-actions-grid">
            {quickActions.map((qa, i) => (
              <a 
                href={`#${qa.page}`} 
                key={i} 
                className="quick-action-card"
                onClick={() => triggerToast(`Navigating to ${qa.label}`)}
              >
                <Icon name={qa.icon} className="quick-action-icon" style={{ width: '20px', height: '20px' }} />
                <span className="quick-action-label">{qa.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Pending Tasks widget */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="clock" className="admin-card-title-icon" />
              <span>Pending Tasks</span>
            </h3>
          </div>

          <div className="widget-list">
            {pendingTasks.map((t, idx) => (
              <div key={idx} className="widget-item-row" style={{ cursor: 'pointer' }} onClick={() => triggerToast(`Task Action triggered: ${t.task}`)}>
                <div className="widget-item-left">
                  <div className="widget-item-info">
                    <span className="widget-item-title">{t.task}</span>
                    <span className="widget-item-desc">Due: {t.deadline}</span>
                  </div>
                </div>
                <span className={`admin-badge ${t.status === 'High' ? 'red' : 'orange'}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 2: Recent Activities & Upcoming Sessions widgets */}
      <div className="admin-dashboard-row-equal">
        
        {/* Recent Activity widget */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="history" className="admin-card-title-icon" />
              <span>Recent Activity Logs</span>
            </h3>
            <a href="#activity-logs" className="action-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>View Logs</a>
          </div>

          <div className="widget-list">
            {recentActivities.map((act, idx) => (
              <div key={idx} className="widget-item-row">
                <div className="widget-item-left">
                  <div className="widget-item-icon-circle" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
                    <Icon name="activity" style={{ width: '16px', height: '16px' }} />
                  </div>
                  <div className="widget-item-info">
                    <span className="widget-item-title">{act.title}</span>
                    <span className="widget-item-desc">{act.desc}</span>
                  </div>
                </div>
                <span className="widget-time">{act.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Sessions widget */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">
              <Icon name="calendar" className="admin-card-title-icon" />
              <span>Upcoming Batches Sessions</span>
            </h3>
            <a href="#calendar" className="action-btn-secondary" style={{ padding: '6px 12px', fontSize: '11px' }}>View Calendar</a>
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
                    <span className="widget-item-desc">{sess.batch} â€¢ {sess.trainer}</span>
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
