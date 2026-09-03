import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import './App.css';
import CreatePasswordScreen from './pages/CreatePassword';
import LoginScreen from './pages/LoginScreen';
import RegisterCourse from './pages/RegisterCourse';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import DashBoard from './pages/DashBoard';
import OverallDashboard from './pages/OverallDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import { useTheme } from './context/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import Icon from './components/Icon';
import hexawareLogo from './assets/HEXAWARE logo.png';

// Import Core Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminTrainers from './pages/admin/AdminTrainers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminCourses from './pages/admin/AdminCourses';
import AdminCourseAssignment from './pages/admin/AdminCourseAssignment';
import AdminBatches from './pages/admin/AdminBatches';
import AdminAssignments from './pages/admin/AdminAssignments';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminMassEnrollment from './pages/admin/AdminMassEnrollment';

// Import Admin Styles
import './styles/admin.css';
import AIChatbot from './components/AIChatbot';


function AdminApp() {
  const navigate = useNavigate();
  // Hash routing state for admin views
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
    const routeKey = currentRoute.split('?')[0];
    switch (routeKey) {
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
      case 'admin-mass-enrollment':
        return <AdminMassEnrollment />;
      default:
        return <AdminDashboard />;
    }
  };

  const adminNavItems = [
    { page: 'admin-dashboard', icon: 'home', label: 'Dashboard' },
    { type: 'header', label: 'Core Modules' },
    { page: 'admin-mass-enrollment', icon: 'upload-cloud', label: 'Mass Enrollment' },
    { page: 'admin-trainers', icon: 'user', label: 'Trainer Management' },
    { page: 'admin-students', icon: 'users', label: 'Student Management' },
    { page: 'admin-courses', icon: 'book-open', label: 'Course Management' },
    { page: 'admin-course-assignment', icon: 'sliders', label: 'Course Assignment' },
    { page: 'admin-batches', icon: 'layers', label: 'Batch Management' },
    { page: 'admin-assignments', icon: 'file-text', label: 'Assignment & Assessment' },
    { page: 'admin-calendar', icon: 'calendar', label: 'Calendar & Schedule' }
  ];

  return (
    <div className="app-container admin-app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header admin-sidebar-header">
          <img src={hexawareLogo} alt="Hexaware" className="sidebar-brand-logo" />
          <h1 className="logo">Mavericks Learning</h1>
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
          <button
            type="button"
            className="nav-item logout-btn"
            onClick={() => {
              localStorage.removeItem('authToken');
              sessionStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('logged_in_user_id');
              navigate('/login', { replace: true });
            }}
          >
            <Icon name="log-out" className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="main-content" id="app-content">
        {renderContent()}
      </main>

      {/* Hexaware AI Assistant for Admin */}
      <AIChatbot role="admin" />
    </div>
  );
}

function ProtectedRoute({ children }) {
  const hasAuthToken = Boolean(
    localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
  );

  return hasAuthToken ? children : <Navigate to="/login" replace />;
}

import Leaderboard from './pages/Leaderboard';
import Badges from './pages/Badges';

function AppRoutes() {
  const location = useLocation();
  const { isDarkMode } = useTheme();

  const themeClass = isDarkMode ? 'dark-theme' : '';
  const isDashboardPage = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/course/') || location.pathname.startsWith('/admin') || location.pathname.startsWith('/trainer-dashboard') || location.pathname.startsWith('/leaderboard') || location.pathname.startsWith('/badges');

  return (
    <div className={`app-container ${themeClass}`}>
      {!isDashboardPage && <ThemeToggle className="theme-toggle-auth" />}
      <Routes>
        {/* Default route (Base URL) loads the Login screen */}
        <Route path="/" element={<LoginScreen />} />

        {/* Specific paths for each of your screens */}
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/create-password" element={<CreatePasswordScreen />} />
        <Route path="/register-course" element={<RegisterCourse />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><OverallDashboard /></ProtectedRoute>} />
        <Route path="/dashboard/:courseId" element={<ProtectedRoute><DashBoard /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/badges" element={<ProtectedRoute><Badges /></ProtectedRoute>} />
        <Route path="/trainer-dashboard/*" element={<ProtectedRoute><TrainerDashboard /></ProtectedRoute>} />
        <Route path="/trainer-dashboard" element={<ProtectedRoute><TrainerDashboard /></ProtectedRoute>} />

        {/* Admin route */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Catch-all route to redirect unknown URLs back to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
