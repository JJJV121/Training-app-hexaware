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
import hexawareLogo from '../assets/HEXAWARE logo.png';
 
import ThemeToggle from '../components/ThemeToggle';
import MentorConnect from './trainee/MentorConnect';
import CommunityConnect from './trainee/CommunityConnect';
import Leaderboard from './Leaderboard';
import Badges from './Badges';

 
export default function DashBoard() {
  const { courseId: paramCourseId } = useParams();
  const navigate = useNavigate();

  // 1. Convert profile to a state object to handle asynchronous API loading
  const [profile, setProfile] = useState({ name: "Loading...", email: "" });

  // 🌟 Dynamic Course ID & Multi-Course State tracking user's enrollment assignment
  const [courseId, setCourseId] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
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
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (hash) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  const persistSelectedCourseId = (targetId) => {
    if (!targetId) return;
    localStorage.setItem('selected_course_id', String(targetId));
  };

  const clearSelectedCourseId = () => {
    localStorage.removeItem('selected_course_id');
    dashboardService._cache = {};
  };

  useEffect(() => {
    if (paramCourseId) {
      const targetId = Number(paramCourseId);
      setCourseId(targetId);
      persistSelectedCourseId(targetId);
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
            name: data.name || "Student",
            email: data.email || "student@example.com"
          });
          const courses = data.enrolled_courses || [];
          setEnrolledCourses(courses);
          if (!paramCourseId) {
            const storedSelectedId = Number(localStorage.getItem('selected_course_id'));
            const assignedId = storedSelectedId || data.course?.id || (courses.length > 0 ? courses[0].course_id : 1);
            setCourseId(assignedId);
            persistSelectedCourseId(assignedId);
          }
        }
      } catch (error) {
        console.error("Failed to load dashboard shell data:", error);

        // Smart Fallback
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setProfile({
          name: storedUser.name || storedUser.employee_id || "Student",
          email: storedUser.email || "student@example.com"
        });
        setCourseId(1);
      } finally {
        setIsCourseLoading(false);
      }
    };

    fetchDashboardShellData();
  }, [userId, paramCourseId]);

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
      case 'mentor-connect':
        return <MentorConnect />;
      case 'community-connect':
        return <CommunityConnect />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'badges':
        return <Badges />;
      case 'profile':
        return <Profile />;
      case 'logout':
        return <Placeholder title="Logged Out" description="You have been successfully logged out." />;
      default:
        return <Home />;
    }
  };

  const isCourseDashboardView = Boolean(paramCourseId) || currentRoute === 'course';

  const navItems = [
    { page: 'home', icon: 'home', label: 'Home' },
    { page: 'course', icon: 'book-open', label: 'My Courses' },
    { page: 'mentor-connect', icon: 'message-square', label: 'Mentor Connect' },
    { page: 'community-connect', icon: 'users', label: 'Community Connect' },
    { page: 'leaderboard', icon: 'award', label: 'Leaderboard' },
    { page: 'badges', icon: 'shield', label: 'Badges' },
    { page: 'schedule', icon: 'clock', label: 'Schedule' },
    { page: 'progress', icon: 'star', label: 'Progress' },
    { page: 'notes', icon: 'file-text', label: 'Notes' },
    { page: 'profile', icon: 'user', label: 'Profile' }
  ].filter((item) => !(isCourseDashboardView && ['mentor-connect', 'community-connect', 'leaderboard', 'badges'].includes(item.page)))
    .map((item) => (
      item.page === 'course' && isCourseDashboardView
        ? { ...item, label: 'Course' }
        : item
    ));



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
          <img src={hexawareLogo} alt="Hexaware" className="sidebar-brand-logo" />
          <h1 className="logo">Mavericks Learning</h1>
        </div>

        {/* User profile info */}
        <div className="user-profile-card">
          <div className="profile-avatar" aria-hidden="true">
            <Icon name="user" />
          </div>
          <div className="profile-info">
            <span className="user-name" id="user-display-name">{profile.name}</span>
            <span className="user-email" id="user-display-email">{profile.email}</span>
          </div>
        </div>

        {/* Multi-course selector if user is enrolled in multiple courses */}
        {enrolledCourses.length > 1 && (
          <div className="course-selector-container" style={{ padding: '0 0 16px 0', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
            <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '6px' }}>
              Active Course
            </label>
            <select
              value={courseId || ''}
              onChange={(e) => {
                const targetId = Number(e.target.value);
                setCourseId(targetId);
                persistSelectedCourseId(targetId);
                navigate(`/dashboard/${targetId}`);
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-main)',
                color: 'var(--text-dark)',
                fontSize: '13px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {enrolledCourses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.course_name} ({c.progress}%)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Back to Portal Button */}
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
              clearSelectedCourseId();
              navigate('/dashboard');
            }}
          >
            <Icon name="arrow-left" className="nav-icon" />
            <span>All Courses Overview</span>
          </button>
        </div>

        {/* Nav menu list */}
        <nav className="nav-menu">
          <ul>
            {navItems.map(item => {
              const isDisabled = isLocked && currentRoute !== item.page;
              return (
                <li key={item.page}>
                  <button
                    type="button"
                    className={`nav-item ${currentRoute === item.page ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                    data-page={item.page}
                    onClick={() => {
                      if (isDisabled) {
                        alert("Assessment is in progress. You must submit the assessment before leaving the page.");
                        return;
                      }
                      setCurrentRoute(item.page);
                      window.location.hash = item.page;
                      closeMobileMenu();
                    }}
                  >

                    <Icon name={item.icon} className="nav-icon" />
                    <span>{item.label}</span>
                  </button>

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
