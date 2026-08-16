import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import Icon from '../components/Icon';
import Profile from './Profile';
import ThemeToggle from '../components/ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import '../styles/overallDashboard.css';

function CountUp({ end, duration = 1200, suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endNum = parseFloat(end);
    if (isNaN(endNum)) {
      setCount(end);
      return;
    }
    if (endNum === 0) {
      setCount(0);
      return;
    }

    const incrementTime = 20;
    const totalSteps = Math.ceil(duration / incrementTime);
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = step / totalSteps;
      const currentVal = endNum * (progress * (2 - progress));
      
      if (step >= totalSteps) {
        clearInterval(timer);
        setCount(endNum);
      } else {
        if (Number.isInteger(endNum)) {
          setCount(Math.floor(currentVal));
        } else {
          setCount(parseFloat(currentVal.toFixed(1)));
        }
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
}

export default function OverallDashboard() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [currentTab, setCurrentTab] = useState('home');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [animateChart, setAnimateChart] = useState(false);

  useEffect(() => {
    if (currentTab === 'performance') {
      const t = setTimeout(() => setAnimateChart(true), 150);
      return () => clearTimeout(t);
    } else {
      setAnimateChart(false);
    }
  }, [currentTab]);

  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  const fetchOverallTelemetry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Fetch default course dashboard data (which contains overall list of courses)
      const data = await dashboardService.getDashboard(userId, 1);
      setDashboardData(data);
    } catch (err) {
      console.error("Error loading overall telemetry:", err);
      setError("Failed to synchronize student dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverallTelemetry();
  }, [userId]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('logged_in_user_id');
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
        <h3 style={{ color: 'var(--text-medium)' }}>Synchronizing overall dashboard telemetry...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: 'var(--bg-main)', gap: '16px' }}>
        <h3 style={{ color: 'var(--accent-red)' }}>{error}</h3>
        <button onClick={fetchOverallTelemetry} style={{ padding: '10px 20px', backgroundColor: 'var(--primary-blue)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const name = dashboardData?.name || "Student";
  const email = dashboardData?.email || "student@example.com";
  const coursesEnrolled = dashboardData?.courses_enrolled || 0;
  const enrolledCourses = dashboardData?.enrolled_courses || [];
  
  // Calculate aggregate stats across all courses
  const totalCourses = enrolledCourses.length;
  const totalCompletedModules = enrolledCourses.reduce((sum, c) => sum + (c.course_id === 1 ? 5 : 25), 0);
  const averageCompletion = totalCourses > 0 ? (enrolledCourses.reduce((sum, c) => sum + c.progress, 0) / totalCourses).toFixed(1) : 0;
  
  const timeSpent = {
    learning: 52.25,
    assessment: 25.0,
    practice: 17.0,
    total: 94.25
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <div className="overall-tab-panel">
            {/* Banner */}
            <div className="overall-banner">
              <h2 className="overall-banner-title">{getGreeting()}, {name}! 👋</h2>
              <span className="overall-banner-subtitle">Welcome back to your Hexaware Learning workspace. Here's your overall progress summary.</span>
            </div>

            {/* Stats Grid */}
            <div className="overall-stats-grid">
              <div className="overall-stat-card">
                <div className="overall-stat-icon-wrapper blue">
                  <Icon name="book-open" />
                </div>
                <div className="overall-stat-info">
                  <span className="overall-stat-value"><CountUp end={totalCourses} /></span>
                  <span className="overall-stat-label">Courses Enrolled</span>
                </div>
              </div>

              <div className="overall-stat-card">
                <div className="overall-stat-icon-wrapper green">
                  <Icon name="check-circle" />
                </div>
                <div className="overall-stat-info">
                  <span className="overall-stat-value"><CountUp end={totalCompletedModules} /></span>
                  <span className="overall-stat-label">Modules Completed</span>
                </div>
              </div>

              <div className="overall-stat-card">
                <div className="overall-stat-icon-wrapper blue">
                  <Icon name="trending-up" />
                </div>
                <div className="overall-stat-info">
                  <span className="overall-stat-value"><CountUp end={averageCompletion} suffix="%" /></span>
                  <span className="overall-stat-label">Average Completion</span>
                </div>
              </div>

              <div className="overall-stat-card">
                <div className="overall-stat-icon-wrapper orange">
                  <Icon name="clock" />
                </div>
                <div className="overall-stat-info">
                  <span className="overall-stat-value"><CountUp end={timeSpent.total} suffix=" hrs" /></span>
                  <span className="overall-stat-label">Total Time Spent</span>
                </div>
              </div>
            </div>

            {/* Mid Row Visuals */}
            <div className="overall-row-mid">
              {/* Venn Diagram */}
              <div className="overall-venn-card">
                <div className="overall-venn-header">
                  <div className="overall-venn-header-left">
                    <Icon name="zap" style={{ color: 'var(--accent-orange)' }} />
                    <span className="overall-venn-title">Time Spent Breakdown</span>
                  </div>
                  <span className="overall-venn-total">Total: <CountUp end={timeSpent.total} suffix=" hrs" /></span>
                </div>
                <div className="overall-venn-visual">
                  <div className="overall-venn-circle learning">
                    <span className="overall-venn-circle-hours"><CountUp end={timeSpent.learning} suffix=" hrs" /></span>
                    <span className="overall-venn-circle-label">Learning</span>
                  </div>
                  <div className="overall-venn-circle assessment">
                    <span className="overall-venn-circle-hours"><CountUp end={timeSpent.assessment} suffix=" hrs" /></span>
                    <span className="overall-venn-circle-label">Assessments</span>
                  </div>
                  <div className="overall-venn-circle practice">
                    <span className="overall-venn-circle-hours"><CountUp end={timeSpent.practice} suffix=" hrs" /></span>
                    <span className="overall-venn-circle-label">Practice</span>
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <div className="overall-activity-card">
                <h3 className="overall-venn-title">Recent Activity Logs</h3>
                <div className="overall-activity-list">
                  <div className="overall-activity-item">
                    <div className="overall-activity-dot blue" />
                    <div className="overall-activity-info">
                      <span className="overall-activity-text">Enrolled in C# Digital Foundation</span>
                      <span className="overall-activity-time">Yesterday, 10 mins ago</span>
                    </div>
                  </div>
                  <div className="overall-activity-item">
                    <div className="overall-activity-dot green" />
                    <div className="overall-activity-info">
                      <span className="overall-activity-text">Completed Day 5 Java Training modules</span>
                      <span className="overall-activity-time">Yesterday, 04:30 PM</span>
                    </div>
                  </div>
                  <div className="overall-activity-item">
                    <div className="overall-activity-dot orange" />
                    <div className="overall-activity-info">
                      <span className="overall-activity-text">Submitted Midterm Java assessment</span>
                      <span className="overall-activity-time">3 days ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="overall-tab-panel">
            <div className="overall-section-header">
              <h3 className="overall-section-title">My Courses</h3>
            </div>
            <div className="overall-courses-grid">
              {enrolledCourses.map((course) => (
                <div key={course.course_id} className="overall-course-card">
                  <div className="overall-course-card-header">
                    <div className="overall-course-icon-bg">
                      <Icon name="book-open" />
                    </div>
                    <span className="overall-course-card-status active">Active</span>
                  </div>
                  
                  <div className="overall-course-card-body">
                    <h4 className="overall-course-card-title">{course.course_name}</h4>
                    
                    <div className="overall-course-card-dates">
                      <div className="overall-course-date-item">
                        <span className="overall-course-date-label">Start Date</span>
                        <span className="overall-course-date-value">{course.start_date}</span>
                      </div>
                      <div className="overall-course-date-item">
                        <span className="overall-course-date-label">End Date</span>
                        <span className="overall-course-date-value">{course.end_date}</span>
                      </div>
                    </div>

                    <div className="overall-course-progress-container">
                      <div className="overall-course-progress-info">
                        <span className="overall-course-progress-label">Course Progress</span>
                        <span className="overall-course-progress-value">{course.progress}%</span>
                      </div>
                      <div className="overall-course-progress-rail">
                        <div className="overall-course-progress-fill" style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="overall-course-card-footer">
                    <button 
                      className="overall-course-card-btn" 
                      onClick={() => navigate(`/dashboard/${course.course_id}`)}
                    >
                      <span>Open Course Dashboard</span>
                      <Icon name="arrow-right" style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="overall-tab-panel">
            <div className="performance-chart-card">
              <h3 className="performance-chart-title">Course Completion Rates</h3>
              <div className="performance-bar-chart">
                {enrolledCourses.map((course, idx) => (
                  <div key={course.course_id} className="performance-bar-item">
                    <div className="performance-bar-label">
                      <span>{course.course_name}</span>
                      <span><CountUp end={course.progress} suffix="%" /></span>
                    </div>
                    <div className="performance-bar-rail">
                      <div 
                        className={`performance-bar-fill ${idx === 0 ? 'blue' : 'green'}`}
                        style={{ 
                          width: animateChart ? `${course.progress}%` : '0%',
                          transition: 'width 1s cubic-bezier(0.25, 1, 0.5, 1)',
                          transitionDelay: `${idx * 200}ms`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="performance-chart-card">
              <h3 className="performance-chart-title">Learning Activity Timeline</h3>
              <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border-color)' }}>
                {[4, 6, 5, 8, 12, 10, 15].map((hours, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1, gap: '12px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-blue)' }}><CountUp end={hours} suffix="h" /></span>
                    <div style={{ 
                      width: '32px', 
                      height: animateChart ? `${hours * 10}px` : '0px', 
                      background: 'linear-gradient(to top, var(--primary-blue), #60a5fa)', 
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
                      transitionDelay: `${index * 100}ms`
                    }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-light)' }}>
                      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'profile':
        return <Profile />;

      default:
        return null;
    }
  };

  const navItems = [
    { page: 'home', icon: 'home', label: 'Overall Home' },
    { page: 'courses', icon: 'book-open', label: 'My Courses' },
    { page: 'performance', icon: 'star', label: 'Performance' },
    { page: 'profile', icon: 'user', label: 'Profile' }
  ];

  return (
    <div className={`app-container ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className={`sidebar-overlay ${isMobileMenuOpen ? 'show' : ''}`} onClick={() => setIsMobileMenuOpen(false)} />
      
      <header className="mobile-topbar">
        <button type="button" className="mobile-menu-toggle" aria-label="Toggle navigation" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Icon name={isMobileMenuOpen ? 'x' : 'menu'} className="nav-icon" />
        </button>
        <span className="mobile-topbar-title">Hexaware</span>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="logo">Hexaware</h1>
        </div>

        {/* User Card */}
        <div className="user-profile-card">
          <div className="profile-info">
            <span className="user-label">Portal</span>
            <span className="user-name" id="user-display-name">{name}</span>
            <span className="user-email" id="user-display-email">{email}</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="nav-menu">
          <ul>
            {navItems.map((item) => (
              <li key={item.page}>
                <button
                  type="button"
                  className={`nav-item ${currentTab === item.page ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentTab(item.page);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon name={item.icon} className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <ThemeToggle className="theme-toggle-sidebar" />
          <button type="button" className="nav-item logout-btn" onClick={handleLogout}>
            <Icon name="log-out" className="nav-icon" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="overall-content-area" id="app-content">
        {renderTabContent()}
      </main>
    </div>
  );
}
