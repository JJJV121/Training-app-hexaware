import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import dashboardService from '../services/dashboardService';
import Icon from '../components/Icon';

// ==========================================
// BUSINESS LOGIC HELPERS
// ==========================================

const formatHours = (hoursDecimal) => {
  const totalHours = Number(hoursDecimal || 0);
  const hrs = Math.floor(totalHours);
  const mins = Math.round((totalHours - hrs) * 60);
  return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")} hrs`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toISOString().split('T')[0];
  } catch (e) {
    return dateStr;
  }
};

const getMotivationMessage = (percent) => {
  const p = Number(percent || 0);
  if (p <= 25) return "Let's get started!";
  if (p <= 60) return "Great Progress!";
  if (p <= 90) return "Almost There!";
  return "Congratulations!";
};

const calculateBubbleSize = (hours, maxHours, minSize = 90, maxSize = 160) => {
  const hrs = Number(hours || 0);
  const max = Number(maxHours || 1);
  if (max === 0) return minSize;
  const size = minSize + (hrs / max) * (maxSize - minSize);
  return Math.min(maxSize, Math.max(minSize, size));
};

const generateChartPath = (points) => {
  if (!points || points.length === 0) return 'M 100 90 L 900 90';
  const totalPoints = points.length;
  return points.map((point, index) => {
    const x = 100 + (index * (800 / Math.max(1, totalPoints - 1)));
    const y = 90 - (Number(point.progress_percentage || 0) * 0.8);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
};

// ==========================================
// CSS STYLES FOR LOADING SKELETON
// ==========================================

const skeletonStyles = `
  @keyframes pulse {
    0% { opacity: 0.6; }
    50% { opacity: 1; }
    100% { opacity: 0.6; }
  }
  .skeleton-box {
    background: #e2e8f0;
    border-radius: 4px;
    animation: pulse 1.5s infinite ease-in-out;
    display: inline-block;
  }
  .app-container.dark-theme .skeleton-box {
    background: #334155;
  }
`;

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

function CountUpHours({ end, duration = 1200 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const endNum = parseFloat(end);
    if (isNaN(endNum) || endNum === 0) {
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
        setCount(currentVal);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [end, duration]);

  return <span>{formatHours(count)}</span>;
}

export default function Home() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;
  const selectedCourseId = Number(localStorage.getItem('selected_course_id')) || null;

  const fetchDashboardTelemetry = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dashboardService.getDashboard(userId, selectedCourseId);
      setDashboardData(data);
    } catch (err) {
      console.error("Critical error mapping dashboard metrics:", err);
      setError("Failed to synchronize live dashboard telemetry metrics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardTelemetry();
  }, [userId, selectedCourseId]);

  // Handle Loading Skeletons State
  if (isLoading) {
    return (
      <div className="page-view dashboard-container">
        <style dangerouslySetInnerHTML={{ __html: skeletonStyles }} />
        
        {/* Banner Skeleton */}
        <div className="dashboard-banner">
          <div className="banner-content">
            <h2 className="banner-greeting">
              Hii <span className="skeleton-box" style={{ width: '120px', height: '28px', verticalAlign: 'middle' }}></span>! 👋
            </h2>
            <span className="banner-subtitle">READY TO LEARN</span>
          </div>
        </div>

        {/* Stats Grid Skeleton */}
        <div className="stats-cards-grid">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="stat-card color-blue">
              <div className="stat-icon-wrapper skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
              <span className="stat-title skeleton-box" style={{ width: '80px', height: '20px', marginTop: '12px' }}></span>
              <span className="stat-label skeleton-box" style={{ width: '100px', height: '14px', marginTop: '8px' }}></span>
            </div>
          ))}
        </div>

        {/* Mid Row Skeleton */}
        <div className="dashboard-row-mid">
          <div className="keep-going-card">
            <div className="card-badge-pill skeleton-box" style={{ width: '90px', height: '18px' }}></div>
            <div className="keep-going-content">
              <h3 className="keep-going-title skeleton-box" style={{ width: '70%', height: '24px', marginBottom: '8px' }}></h3>
              <p className="keep-going-desc skeleton-box" style={{ width: '90%', height: '16px' }}></p>
            </div>
            <div className="continue-btn skeleton-box" style={{ width: '160px', height: '40px', borderRadius: '20px', border: 'none' }}></div>
          </div>

          <div className="time-spent-card">
            <div className="card-badge-pill time-spent-badge skeleton-box" style={{ width: '90px', height: '18px' }}></div>
            <div className="venn-container">
              <div className="venn-circle circle-learning skeleton-box" style={{ width: '140px', height: '140px', opacity: 0.3 }}></div>
              <div className="venn-circle circle-assessment skeleton-box" style={{ width: '110px', height: '110px', opacity: 0.3 }}></div>
              <div className="venn-circle circle-practice skeleton-box" style={{ width: '90px', height: '90px', opacity: 0.3 }}></div>
            </div>
          </div>
        </div>

        {/* Course Progress Skeleton */}
        <div className="course-progress-card">
          <div className="course-progress-header">
            <div className="course-progress-info">
              <div className="course-icon-bg skeleton-box" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
              <div className="course-title-sub">
                <h3 className="skeleton-box" style={{ width: '160px', height: '20px', marginBottom: '6px' }}></h3>
                <span className="skeleton-box" style={{ width: '120px', height: '14px' }}></span>
              </div>
            </div>
            <span className="progress-percent-label skeleton-box" style={{ width: '110px', height: '20px' }}></span>
          </div>
          <div className="line-chart-container skeleton-box" style={{ height: '120px', width: '100%', marginTop: '20px', borderRadius: '8px' }}></div>
        </div>
      </div>
    );
  }

  // Handle Error State
  if (error) {
    return (
      <div className="page-view dashboard-container structural-fallback-centered" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', minHeight: '50vh' }}>
        <h3 className="error-headline-text" style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>{error}</h3>
        <button 
          className="empty-state-btn" 
          onClick={fetchDashboardTelemetry}
          style={{ padding: '10px 24px', backgroundColor: '#0061FE', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const name = dashboardData?.name || "Student";
  const coursesEnrolled = dashboardData?.courses_enrolled || 0;
  const course = dashboardData?.course;
  const progressData = dashboardData?.progress || { completed_days: 0, remaining_days: 0 };
  const timeSpent = dashboardData?.time_spent || { learning_hours: 0, assessment_hours: 0, practice_hours: 0, revision_hours: 0 };
  const continueLearning = dashboardData?.continue_learning;
  const enrolledCourses = dashboardData?.enrolled_courses || [];

  const getGreeting = (nameVal) => {
    const hr = new Date().getHours();
    let greet = "Good Morning";
    if (hr >= 12 && hr < 17) {
      greet = "Good Afternoon";
    } else if (hr >= 17) {
      greet = "Good Evening";
    }
    return `${greet}, ${nameVal}`;
  };

  // Generate dynamic day-wise progress points for SVG curve
  const dayWiseProgress = [];
  if (course) {
    for (let d = 1; d <= course.total_days; d++) {
      let progressPct = 0;
      if (d <= progressData.completed_days) {
        progressPct = 100;
      } else if (d === course.current_day) {
        const dayModulesTotal = Math.ceil(course.total_modules / course.total_days) || 1;
        const dayModulesCompleted = Math.max(0, course.completed_modules - (progressData.completed_days * dayModulesTotal));
        progressPct = Math.min(100, Math.round((dayModulesCompleted / dayModulesTotal) * 100));
      }
      dayWiseProgress.push({
        day: d,
        progress_percentage: progressPct
      });
    }
  }

  return (
    <div className="page-view dashboard-container">
      
      {/* 1. Blue Header Banner */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <h2 className="banner-greeting">{getGreeting(name)}! 😊</h2>
          <span className="banner-subtitle">READY TO LEARN</span>
        </div>
      </div>

      {course ? (
        <>
          {/* 2. Stats Grid (Dynamic Mapping) */}
          <div className="stats-cards-grid">
            <div className="stat-card color-blue" id="stat-current-course">
              <div className="stat-icon-wrapper">
                <Icon name="book-open" className="stat-icon" />
              </div>
              <span className="stat-title">{course.name}</span>
              <span className="stat-label">Course Enrolled</span>
            </div>

            <div className="stat-card color-green" id="stat-modules-completed">
              <div className="stat-icon-wrapper">
                <Icon name="check-circle" className="stat-icon" />
              </div>
              <span className="stat-title"><CountUp end={course.completed_modules} /></span>
              <span className="stat-label">Modules Completed</span>
            </div>

            <div className="stat-card color-blue" id="stat-overall-completion">
              <div className="stat-icon-wrapper">
                <Icon name="trending-up" className="stat-icon" />
              </div>
              <span className="stat-title"><CountUp end={course.completed_percentage} suffix="%" /></span>
              <span className="stat-label">Overall Completion</span>
            </div>

            <div className="stat-card color-red" id="stat-courses-enrolled">
              <div className="stat-icon-wrapper">
                <Icon name="alert-circle" className="stat-icon" />
              </div>
              <span className="stat-title"><CountUp end={coursesEnrolled} /></span>
              <span className="stat-label">Courses Enrolled</span>
            </div>
          </div>

          {/* 2.5 Enrolled Courses Support Cards */}
          {enrolledCourses.length > 0 && (
            <div className="enrolled-courses-section">
              <h3 className="section-title">Your Enrolled Courses</h3>
              <div className="course-cards-grid">
                {enrolledCourses.map((c) => (
                  <div 
                    key={c.course_id} 
                    className="course-card-interactive" 
                    onClick={() => {
                      navigate(`/dashboard/${c.course_id}`);
                    }}
                  >
                    <div className="course-card-header">
                      <div className="course-card-icon-bg">
                        <Icon name="book-open" />
                      </div>
                      <h4 className="course-card-name">{c.course_name}</h4>
                    </div>
                    <div className="course-card-body">
                      <div className="course-card-date-row">
                        <div className="course-card-date">
                          <span className="date-label">Start Date</span>
                          <span className="date-value">{formatDate(c.start_date)}</span>
                        </div>
                        <div className="course-card-date">
                          <span className="date-label">End Date</span>
                          <span className="date-value">{formatDate(c.end_date)}</span>
                        </div>
                      </div>
                      <div className="course-card-progress-container">
                        <div className="progress-info-row">
                          <span className="progress-label">Progress</span>
                          <span className="progress-value">{c.progress}%</span>
                        </div>
                        <div className="progress-bar-rail">
                          <div className="progress-bar-fill" style={{ width: `${c.progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Mid Row (Keep Going & Time Spent Cards) */}
          <div className="dashboard-row-mid">
            
            {/* Keep Going / Hero Card */}
            <div className="keep-going-card">
              <div className="card-badge-pill">
                <Icon name="zap" style={{ width: '12px', height: '12px', fill: '#ffdf40', stroke: '#ffdf40' }} />
                <span>Keep Going!</span>
              </div>
              
              <div className="keep-going-content">
                <h3 className="keep-going-title">
                  <CountUp end={course.remaining_modules} /> Modules Remaining
                </h3>
                <p className="keep-going-desc">
                  Currently on Day {course.current_day} of {course.name} (<CountUp end={course.completed_percentage} suffix="%" /> Completed). {course.motivation_message}
                </p>
              </div>
              
              <a 
                href="#course" 
                className="continue-btn"
                onClick={(e) => {
                  e.preventDefault();
                  if (continueLearning) {
                    localStorage.setItem('continue_learning_target', JSON.stringify({
                      course_id: continueLearning.course_id,
                      day: continueLearning.day,
                      module_id: continueLearning.module_id
                    }));
                  }
                  window.location.hash = 'course';
                }}
              >
                <span>Continue Learning</span>
                <Icon name="arrow-right" style={{ width: '16px', height: '16px' }} />
              </a>
            </div>

            {/* Time Spent Venn Diagram Card */}
            {(() => {
              const maxHours = Math.max(
                timeSpent.learning_hours || 0,
                timeSpent.assessment_hours || 0,
                timeSpent.practice_hours || 0,
                timeSpent.revision_hours || 0
              );
              
              const learningSize = calculateBubbleSize(timeSpent.learning_hours, maxHours, 80, 130);
              const assessmentSize = calculateBubbleSize(timeSpent.assessment_hours, maxHours, 80, 130);
              const practiceSize = calculateBubbleSize(timeSpent.practice_hours, maxHours, 80, 130);

              const totalHours = (timeSpent.learning_hours || 0) + 
                                 (timeSpent.assessment_hours || 0) + 
                                 (timeSpent.practice_hours || 0);
                                 

              return (
                <div className="time-spent-card">
                  <div className="card-badge-pill time-spent-badge" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Icon name="zap" style={{ width: '12px', height: '12px', fill: '#ffdf40', stroke: '#ffdf40' }} />
                      <span>Time Spent</span>
                    </div>
                    <span style={{ fontWeight: '700', opacity: 0.8 }}>Total: <CountUpHours end={totalHours} /></span>
                  </div>
                  
                  <div className="venn-container">
                    {/* Learning Contents Circle */}
                    <div 
                      className="venn-circle circle-learning" 
                      style={{ width: `${learningSize}px`, height: `${learningSize}px` }}
                    >
                      <span className="venn-circle-hours"><CountUpHours end={timeSpent.learning_hours} /></span>
                      <span className="venn-circle-label">Learning</span>
                    </div>
                    
                    {/* Assessment Circle */}
                    <div 
                      className="venn-circle circle-assessment" 
                      style={{ width: `${assessmentSize}px`, height: `${assessmentSize}px` }}
                    >
                      <span className="venn-circle-hours"><CountUpHours end={timeSpent.assessment_hours} /></span>
                      <span className="venn-circle-label">Assessment</span>
                    </div>
                    
                    {/* Practice Circle */}
                    <div 
                      className="venn-circle circle-practice" 
                      style={{ width: `${practiceSize}px`, height: `${practiceSize}px` }}
                    >
                      <span className="venn-circle-hours"><CountUpHours end={timeSpent.practice_hours} /></span>
                      <span className="venn-circle-label">Practice</span>
                    </div>

                    
                  </div>
                </div>
              );
            })()}

          </div>

          {/* 4. Bottom Row (Course Progress & Line Graph Tracker) */}
          <div className="course-progress-card">
            <div className="course-progress-header">
              <div className="course-progress-info">
                <div className="course-icon-bg">
                  <Icon name="book-open" style={{ width: '20px', height: '20px' }} />
                </div>
                <div className="course-title-sub">
                  <h3>{course.name}</h3>
                  <span>Day {course.current_day} of {course.total_days}</span>
                </div>
              </div>
              <span className="progress-percent-label">{course.completed_percentage}% Completed</span>
            </div>

            {/* SVG Progress Curve plotted dynamically */}
            <div className="line-chart-container">
              <svg viewBox="0 0 1000 120" className="chart-svg" preserveAspectRatio="none">
                {/* Background tracking alignment rail line */}
                <line x1="100" y1="90" x2="900" y2="90" style={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
                
                {/* Dynamic Progress line curvature */}
                {dayWiseProgress.length > 0 && (
                  <path 
                    d={generateChartPath(dayWiseProgress)} 
                    className="chart-line" 
                  />
                )}
                
                {/* Dynamic Milestone node circles based on API timeline data */}
                {dayWiseProgress.map((point, index) => {
                  const totalPoints = dayWiseProgress.length;
                  const normalizedXCoordinate = 100 + (index * (800 / Math.max(1, totalPoints - 1)));
                  const calculatedYCoordinate = 90 - (Number(point.progress_percentage || 0) * 0.8);

                  return (
                    <circle 
                      key={index}
                      cx={normalizedXCoordinate} 
                      cy={calculatedYCoordinate} 
                      r="5" 
                      className="chart-point" 
                      data-desc={`Day ${point.day}: ${Number(point.progress_percentage || 0).toFixed(0)}%`} 
                    />
                  );
                })}
                
                {/* Scale references */}
                <text x="100" y="112" className="chart-label" textAnchor="middle">0%</text>
                <text x="900" y="112" className="chart-label" textAnchor="middle">100%</text>
              </svg>
            </div>

            {/* Progress Timeline Checklist */}
            <div className="progress-timeline-container">
              <div className="timeline-title-row">
                <span className="timeline-title">Progress Timeline</span>
                <span className="timeline-summary">Day {course.current_day} of {course.total_days}</span>
              </div>
              <div className="timeline-scroll-wrapper">
                <div className="timeline-track">
                  {Array.from({ length: course.total_days }, (_, i) => {
                    const dayNum = i + 1;
                    const isCompleted = dayNum <= progressData.completed_days;
                    const isCurrent = dayNum === course.current_day;

                    let statusClass = "upcoming";
                    if (isCompleted) statusClass = "completed";
                    else if (isCurrent) statusClass = "current";

                    return (
                      <div 
                        key={dayNum} 
                        className={`timeline-node ${statusClass}`}
                        style={{
                          animationDelay: `${i * 80}ms`
                        }}
                      >
                        <div className="node-circle">
                          {isCompleted ? (
                            <Icon name="check" style={{ width: '14px', height: '14px', color: '#fff' }} />
                          ) : (
                            <span>{dayNum}</span>
                          )}
                        </div>
                        <span className="node-label">Day {dayNum}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Date references & footer button redirection links */}
            <div className="course-progress-footer">
              <div className="date-ranges">
                <div className="date-item">
                  <Icon name="calendar" />
                  <div>
                    <span className="date-lbl">Start Date</span>
                    <span className="date-val">{formatDate(course.start_date)}</span>
                  </div>
                </div>
                
                <div className="date-separator"></div>
                
                <div className="date-item">
                  <Icon name="calendar" />
                  <div>
                    <span className="date-lbl">End Date</span>
                    <span className="date-val">{formatDate(course.end_date)}</span>
                  </div>
                </div>
              </div>
              
              <a 
                href={`/course/${course.id}`} 
                className="view-course-btn"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/course/${course.id}`);
                }}
              >
                View Course
              </a>
            </div>
          </div>
        </>
      ) : (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-medium)' }}>
          <h3>No active course enrollment found.</h3>
          <p>Please register for a course to begin learning.</p>
        </div>
      )}
    </div>
  );
}