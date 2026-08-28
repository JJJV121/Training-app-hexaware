import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import apiClient from '../services/apiClient';
import TrainerOverview from './trainer/TrainerOverview';
import BatchManagement from './trainer/BatchManagement';
import GradingQueue from './trainer/GradingQueue';
import PerformanceReports from './trainer/PerformanceReports';
import SessionScheduler from './trainer/SessionScheduler';
import TrainerMentorConnect from './trainer/MentorConnect';
import Placeholder from './Placeholder';
import '../styles/trainer/trainer-dashboard.css';
import AIChatbot from '../components/AIChatbot';



export default function TrainerDashboard() {
  const [trainerProfile, setTrainerProfile] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : { name: 'Trainer', email: 'trainer@hexaware.com' };
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get('/profile');
        setTrainerProfile(response.data);
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, ...response.data }));
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  // Hash-based routing
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.substring(1);
    return hash || 'overview';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      setCurrentRoute(hash || 'overview');
    };

    window.addEventListener('hashchange', handleHashChange);

    if (!window.location.hash) {
      window.location.hash = 'overview';
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

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentRoute]);

  const renderContent = () => {
    switch (currentRoute) {
      case 'overview':
        return <TrainerOverview />;
      case 'batches':
        return <BatchManagement />;
      case 'grading':
        return <GradingQueue />;
      case 'scheduler':
        return <SessionScheduler />;
      case 'mentor-connect':
        return <TrainerMentorConnect />;
      case 'reports':
        return <PerformanceReports />;
      default:
        return <TrainerOverview />;
    }
  };

  const navItems = [
    { page: 'overview', icon: 'home', label: 'Home/Overview' },
    { page: 'mentor-connect', icon: 'message-square', label: 'Mentor Connect' },
    { page: 'batches', icon: 'users', label: 'Enrolled Batches' },
    { page: 'grading', icon: 'clipboard-check', label: 'Grading Queue' },
    { page: 'scheduler', icon: 'clock', label: 'Session Scheduler' },
    { page: 'reports', icon: 'bar-chart-2', label: 'Performance Reports' },
  ];


  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="trainer-app-container">
      {/* Sidebar Overlay for Mobile views */}
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Top Header */}
      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Toggle navigation"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <Icon name={isMobileMenuOpen ? 'x' : 'menu'} className="nav-icon" />
        </button>
        <span className="mobile-topbar-title">Hexaware Trainer</span>
      </header>

      {/* Sidebar navigation */}
      <aside className={`trainer-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="trainer-sidebar-header">
          <h1 className="trainer-logo">Hexaware</h1>
        </div>

        {/* User profile info */}
        <div className="trainer-profile-card">
          <div className="trainer-profile-info">
            <span className="trainer-label-tag">Role</span>
            <span className="trainer-name-display">{trainerProfile.name}</span>
            <span className="trainer-email-display">{trainerProfile.email}</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="trainer-nav-menu">
          <ul>
            {navItems.map((item) => (
              <li key={item.page}>
                <a
                  href={`#${item.page}`}
                  className={`trainer-nav-item ${currentRoute === item.page ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <Icon name={item.icon} className="nav-icon" />
                  <span>{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer Logout button */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="nav-item logout-btn"
            onClick={() => {
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('logged_in_user_id');
              window.location.href = '/';
            }}
          >
            <Icon name="log-out" className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Viewport Content */}
      <main className="trainer-main-content">
        {renderContent()}
      </main>

      {/* Hexaware AI Assistant for Trainer */}
      <AIChatbot role="trainer" />
    </div>
  );
}
