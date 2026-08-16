import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService.js';
import Icon from '../components/Icon';
import Home from '../pages/Home';
import Course from '../pages/Course';
import Schedule from '../pages/Schedule';
import Placeholder from '../pages/Placeholder';
import ProgressView from './ProgressView.jsx';
import StudyNotes from './StudyNotes.jsx';
import Profile from '../pages/Profile';
import Assessment from './Assessment.jsx';
 
import ThemeToggle from '../components/ThemeToggle';
 
export default function DashBoard() {
  const { courseId: paramCourseId } = useParams();
  const navigate = useNavigate();

  // 1. Convert profile to a state object to handle asynchronous API loading
  const [profile, setProfile] = useState({ name: "Loading...", email: "" });

  // 🌟 Dynamic Course ID State tracking user's enrollment assignment
  const [courseId, setCourseId] = useState(null);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 900);

  // Hash routing state
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (paramCourseId) return 'course';
    const hash = window.location.hash.substring(1);
    return hash || 'home';
  });

  // Assessment locking state
  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(isLocked);
  const currentRouteRef = useRef(currentRoute);

  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  useEffect(() => {
    currentRouteRef.current = currentRoute;
  }, [currentRoute]);

  useEffect(() => {
    if (paramCourseId) {
      setCourseId(Number(paramCourseId));
      setCurrentRoute('course');
      setIsCourseLoading(false);
    }
  }, [paramCourseId]);

  // 2. Dynamically retrieve the logged-in user ID from localStorage
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  // 3. Fetch the user profile and assigned course asynchronously when the dashboard mounts
  useEffect(() => {
    const fetchDashboardShellData = async () => {
      try {
        setIsCourseLoading(true);
        const data = await dashboardService.getDashboard(userId);
        if (data) {
          setProfile({
            name: data.name || data.employee_id || "Student",
            email: data.email || "student@example.com"
          });
          const assignedId = data.course?.id || 1;
          setCourseId(assignedId);
        }
      } catch (error) {
        console.error("Failed to load dashboard shell data:", error);

        // Smart Fallback
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setProfile({
          name: storedUser.employee_id || "Student",
          email: storedUser.email || "student@example.com"
        });
        setCourseId(1);
      } finally {
        setIsCourseLoading(false);
      }
    };

    fetchDashboardShellData();
  }, [userId]);

  // 4. Handle hash-based navigation changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const targetRoute = hash || 'home';

      if (isLockedRef.current && targetRoute !== currentRouteRef.current) {
        alert("Assessment is in progress. You must submit the assessment before leaving the page.");
        window.location.hash = currentRouteRef.current;
        return;
      }
      setCurrentRoute(targetRoute);
    };

    window.addEventListener('hashchange', handleHashChange);

    if (!window.location.hash) {
      window.location.hash = 'home';
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
      case 'home':
        return <Home />;
      case 'course':
        // 🌟 Pass the live backend assigned courseId down to the Course subpage
        if (isCourseLoading) {
          return <div style={{ padding: '40px', textAlign: 'center' }}><h3>Verifying active enrollment...</h3></div>;
        }
        return <Course courseId={courseId} />;
      case 'schedule':
        return <Schedule />;
      case 'progress':
        return <ProgressView />;
      case 'assessment-mcq':
        return <Assessment assessmentType="MCQ" onLockChange={setIsLocked} onFinished={() => { setIsLocked(false); window.location.hash = 'progress'; }} />;
      case 'assessment-coding':
        return <Assessment assessmentType="Coding" onLockChange={setIsLocked} onFinished={() => { setIsLocked(false); window.location.hash = 'progress'; }} />;
      case 'notes':
        return <StudyNotes />;
      case 'profile':
        return <Profile />;
      case 'logout':
        return <Placeholder title="Logged Out" description="You have been successfully logged out." />;
      default:
        return <Home />;
    }
  };

  const navItems = [
    { page: 'home', icon: 'home', label: 'Home' },
    { page: 'course', icon: 'book-open', label: 'Course' },
    { page: 'schedule', icon: 'clock', label: 'Schedule' },
    { page: 'progress', icon: 'star', label: 'Progress' },
    { page: 'notes', icon: 'file-text', label: 'Notes' },
    { page: 'profile', icon: 'user', label: 'Profile' }
  ];

  const closeMobileMenu = () => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    // FIX: Use app-container here (no duplicate dark-theme class; App.jsx owns theming)
    <div className="app-container">
      <div
        className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <header className="mobile-topbar">
        <button
          type="button"
          className="mobile-menu-toggle"
          aria-label="Toggle navigation"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <Icon name={isMobileMenuOpen ? 'x' : 'menu'} className="nav-icon" />
        </button>
        <span className="mobile-topbar-title">Mavericks Learning</span>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">Mavericks Learning</h1>
        </div>

        {/* User profile info */}
        <div className="user-profile-card">
          <div className="profile-info">
            <span className="user-label">Name</span>
            <span className="user-name" id="user-display-name">{profile.name}</span>
            <span className="user-email" id="user-display-email">{profile.email}</span>
          </div>
        </div>

        {/* Back to Portal Portal Button */}
        <div className="back-to-portal-container" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <button
            type="button"
            className="nav-item back-portal-btn"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)', border: 'none', padding: '12px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', transition: 'background-color var(--transition-fast)' }}
            onClick={() => {
              if (isLocked) {
                alert("Assessment is in progress. You must submit the assessment before leaving the page.");
                return;
              }
              navigate('/dashboard');
            }}
          >
            <Icon name="arrow-left" className="nav-icon" />
            <span>All Courses</span>
          </button>
        </div>

        {/* Nav menu list */}
        <nav className="nav-menu">
          <ul>
            {navItems.map(item => {
              const isDisabled = isLocked && currentRoute !== item.page;
              return (
                <li key={item.page}>
                  <a
                    href={isDisabled ? undefined : `#${item.page}`}
                    className={`nav-item ${currentRoute === item.page ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    data-page={item.page}
                    onClick={(e) => {
                      if (isDisabled) {
                        e.preventDefault();
                        alert("Assessment is in progress. You must submit the assessment before leaving the page.");
                        return;
                      }
                      closeMobileMenu();
                    }}
                  >
                    <Icon name={item.icon} className="nav-icon" />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout at bottom — FIX: use <button> not <a href="#logout"> to prevent hash flicker */}
        <div className="sidebar-footer">
          <ThemeToggle className="theme-toggle-sidebar" />
          <button
            type="button"
            className={`nav-item logout-btn ${currentRoute === 'logout' ? 'active' : ''} ${isLocked ? 'disabled' : ''}`}
            data-page="logout"
            disabled={isLocked}
            onClick={() => {
              if (isLocked) return;
              localStorage.removeItem('authToken');
              localStorage.removeItem('user');
              localStorage.removeItem('logged_in_user_id');
              closeMobileMenu();
              window.location.href = '/';
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
    </div>
  );
}
