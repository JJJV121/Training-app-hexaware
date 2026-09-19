import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import AIChatbot from '../components/AIChatbot';
import hexawareLogo from '../assets/HEXAWARE logo.png';
import '../styles/coordinator.css';

// Import All 11 Coordinator Modules
import CoordinatorOverview from './coordinator/CoordinatorOverview';
import CoordinatorBatches from './coordinator/CoordinatorBatches';
import CoordinatorTrainees from './coordinator/CoordinatorTrainees';
import CoordinatorTrainers from './coordinator/CoordinatorTrainers';
import CoordinatorAttendance from './coordinator/CoordinatorAttendance';
import CoordinatorFeedback from './coordinator/CoordinatorFeedback';
import CoordinatorAssignments from './coordinator/CoordinatorAssignments';
import CoordinatorAssessments from './coordinator/CoordinatorAssessments';
import CoordinatorSchedule from './coordinator/CoordinatorSchedule';
import CoordinatorAnnouncements from './coordinator/CoordinatorAnnouncements';
import CoordinatorIssues from './coordinator/CoordinatorIssues';
import CoordinatorInterventions from './coordinator/CoordinatorInterventions';
import CoordinatorReports from './coordinator/CoordinatorReports';

export default function CoordinatorDashboard() {
  const navigate = useNavigate();

  const [coordinatorProfile, setCoordinatorProfile] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : {
      name: 'Batch Coordinator (SPOC)',
      email: 'coordinator@hexaware.com',
      role: 'coordinator'
    };
  });

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  // Hash-based sub-routing
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.substring(1);
    return hash || 'coordinator-dashboard';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      setCurrentRoute(hash || 'coordinator-dashboard');
    };

    window.addEventListener('hashchange', handleHashChange);

    if (!window.location.hash) {
      window.location.hash = 'coordinator-dashboard';
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (routeKey) => {
    window.location.hash = routeKey;
    setCurrentRoute(routeKey);
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  const navItems = [
    { page: 'coordinator-dashboard', icon: 'home', label: 'Dashboard Overview' },
    { type: 'header', label: 'Academic & Operations' },
    { page: 'coordinator-batches', icon: 'layers', label: 'Batch Management' },
    { page: 'coordinator-trainees', icon: 'users', label: 'Trainee 360° Monitor' },
    { page: 'coordinator-trainers', icon: 'user', label: 'Trainer Allocation' },
    { page: 'coordinator-attendance', icon: 'clock', label: 'Attendance & Audit' },
    { page: 'coordinator-schedule', icon: 'calendar', label: 'Schedule & Calendar' },
    { type: 'header', label: 'Evaluation & Oversight' },
    { page: 'coordinator-assignments', icon: 'file-text', label: 'Assignment Tracking' },
    { page: 'coordinator-assessments', icon: 'clipboard-check', label: 'Assessment Oversight' },
    { page: 'coordinator-feedback', icon: 'message-square', label: '2-Way Feedback System' },
    { page: 'coordinator-interventions', icon: 'alert-triangle', label: 'At-Risk & Interventions' },
    { type: 'header', label: 'Communications & Reports' },
    { page: 'coordinator-issues', icon: 'shield', label: 'Issues & Escalations' },
    { page: 'coordinator-announcements', icon: 'megaphone', label: 'Announcements & Alerts' },
    { page: 'coordinator-reports', icon: 'download', label: 'Report Generator' }
  ];

  const renderContent = () => {
    const routeKey = currentRoute.split('?')[0];
    switch (routeKey) {
      case 'coordinator-dashboard':
      case 'overview':
        return <CoordinatorOverview onNavigate={handleNavigate} />;
      case 'coordinator-batches':
        return <CoordinatorBatches />;
      case 'coordinator-trainees':
        return <CoordinatorTrainees />;
      case 'coordinator-trainers':
        return <CoordinatorTrainers />;
      case 'coordinator-attendance':
        return <CoordinatorAttendance />;
      case 'coordinator-feedback':
        return <CoordinatorFeedback />;
      case 'coordinator-assignments':
        return <CoordinatorAssignments />;
      case 'coordinator-assessments':
        return <CoordinatorAssessments />;
      case 'coordinator-schedule':
        return <CoordinatorSchedule />;
      case 'coordinator-announcements':
        return <CoordinatorAnnouncements />;
      case 'coordinator-issues':
        return <CoordinatorIssues />;
      case 'coordinator-interventions':
        return <CoordinatorInterventions />;
      case 'coordinator-reports':
        return <CoordinatorReports />;
      default:
        return <CoordinatorOverview onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="app-container admin-app-container">
      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="sidebar-overlay show"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobile && isMobileMenuOpen ? 'open' : ''}`} style={{ zIndex: 100 }}>
        <div className="sidebar-header admin-sidebar-header">
          <img src={hexawareLogo} alt="Hexaware" className="sidebar-brand-logo" />
          <h1 className="logo">Mavericks Learning</h1>
        </div>

        {/* Coordinator Profile Card */}
        <div className="user-profile-card" style={{ marginBottom: '20px' }}>
          <div className="profile-info">
            <span className="user-label">Logged in as</span>
            <span className="user-name" id="user-display-name">
              {coordinatorProfile.name || 'Batch Coordinator'}
            </span>
            <span className="user-email" id="user-display-email">
              {coordinatorProfile.email || 'coordinator@hexaware.com'}
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 270px)', paddingRight: '4px' }}>
          <ul>
            {navItems.map((item, idx) => {
              if (item.type === 'header') {
                return (
                  <li
                    key={`hdr-${idx}`}
                    style={{
                      padding: '10px 16px 4px 16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--text-light, #94a3b8)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {item.label}
                  </li>
                );
              }

              const isActive = currentRoute === item.page || (item.page === 'coordinator-dashboard' && currentRoute === 'overview');

              return (
                <li key={item.page}>
                  <a
                    href={`#${item.page}`}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavigate(item.page)}
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

      {/* Main Viewport Content */}
      <main className="main-content" id="app-content">
        {renderContent()}
      </main>

      {/* AI Chatbot Assistant for Coordinator */}
      <AIChatbot role="coordinator" />
    </div>
  );
}
