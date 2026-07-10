import { useState, useEffect } from 'react';
import Icon from './components/Icon';
import Placeholder from './pages/Placeholder';

// Import Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTrainers from './pages/admin/AdminTrainers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseAssignment from './pages/admin/AdminCourseAssignment';
import AdminBatches from './pages/admin/AdminBatches';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';
import AdminReports from './pages/admin/AdminReports';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminActivityLogs from './pages/admin/AdminActivityLogs';
import AdminSettings from './pages/admin/AdminSettings';

// Import Admin Styles
import './styles/admin.css';

export default function App() {
  // Hash routing state
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.substring(1);
    return hash || 'admin-dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      setCurrentRoute(hash || 'admin-dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);
    
    // Set default hash if none is present
    if (!window.location.hash) {
      window.location.hash = 'admin-dashboard';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const renderContent = () => {
    switch (currentRoute) {
      case 'admin-dashboard':
        return <AdminDashboard />;
      case 'admin-trainers':
        return <AdminTrainers />;
      case 'admin-students':
        return <AdminStudents />;
      case 'admin-courses':
        return <AdminCourses />;
      case 'admin-course-assignment':
        return <AdminCourseAssignment />;
      case 'admin-batches':
        return <AdminBatches />;
      case 'admin-assignments':
        return <AdminAssignments />;
      case 'admin-calendar':
        return <AdminCalendar />;
      case 'admin-announcements':
        return <AdminAnnouncements />;
      case 'admin-reports':
        return <AdminReports />;
      case 'admin-feedback':
        return <AdminFeedback />;
      case 'admin-notifications':
        return <AdminNotifications />;
      case 'admin-activity-logs':
        return <AdminActivityLogs />;
      case 'admin-settings':
        return <AdminSettings />;
      case 'logout':
        return <Placeholder title="Logged Out" description="You have been successfully logged out." />;
      default:
        return <AdminDashboard />;
    }
  };

  const adminNavItems = [
    { page: 'admin-dashboard', icon: 'home', label: 'Dashboard' },
    { type: 'header', label: 'User Management' },
    { page: 'admin-students', icon: 'users', label: 'Students', isSub: true },
    { page: 'admin-trainers', icon: 'user', label: 'Trainers', isSub: true },
    { type: 'divider' },
    { page: 'admin-courses', icon: 'book-open', label: 'Course Management' },
    { page: 'admin-course-assignment', icon: 'sliders', label: 'Course Assignment' },
    { page: 'admin-batches', icon: 'layers', label: 'Batch Management' },
    { page: 'admin-assignments', icon: 'file-text', label: 'Assignments' },
    { page: 'admin-calendar', icon: 'calendar', label: 'Calendar' },
    { page: 'admin-announcements', icon: 'send', label: 'Announcements' },
    { page: 'admin-reports', icon: 'file-text', label: 'Reports' },
    { page: 'admin-feedback', icon: 'message-square', label: 'Feedback' },
    { page: 'admin-notifications', icon: 'bell', label: 'Notifications' },
    { page: 'admin-activity-logs', icon: 'history', label: 'Activity Logs' },
    { page: 'admin-settings', icon: 'settings', label: 'Settings' }
  ];

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header" style={{ marginBottom: '24px' }}>
          <h1 className="logo">Hexaware</h1>
        </div>
        
        {/* User profile info */}
        <div className="user-profile-card" style={{ marginBottom: '24px' }}>
          <div className="profile-info">
            <span className="user-label">Logged in as</span>
            <span className="user-name" id="user-display-name">System Admin</span>
            <span className="user-email" id="user-display-email">admin@hexaware.com</span>
          </div>
        </div>
        
        {/* Nav menu list */}
        <nav className="nav-menu" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)', paddingRight: '4px' }}>
          <ul>
            {adminNavItems.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <li key={`hdr-${idx}`} style={{ padding: '8px 16px 4px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {item.label}
                  </li>
                );
              }
              if (item.type === 'divider') {
                return (
                  <li key={`div-${idx}`} style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 16px' }}></li>
                );
              }
              return (
                <li key={item.page}>
                  <a 
                    href={`#${item.page}`} 
                    className={`nav-item ${currentRoute === item.page ? 'active' : ''}`}
                    data-page={item.page}
                    style={item.isSub ? { paddingLeft: '32px' } : {}}
                  >
                    <Icon name={item.icon} className="nav-icon" />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Logout at bottom */}
        <div className="sidebar-footer" style={{ paddingTop: '16px' }}>
          <a 
            href="#logout" 
            className={`nav-item logout-btn ${currentRoute === 'logout' ? 'active' : ''}`}
            data-page="logout"
          >
            <Icon name="log-out" className="nav-icon" />
            <span>Logout</span>
          </a>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-content" id="app-content">
        {renderContent()}
      </main>
    </div>
  );
}