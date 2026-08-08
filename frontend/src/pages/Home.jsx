import dashboardService from '../services/dashboardService';
import Icon from '../components/Icon';

export default function Home() {
  const stats = dashboardService.getOverviewStats();
  const keepGoing = dashboardService.getKeepGoingData();
  const timeSpent = dashboardService.getTimeSpentData();
  const progress = dashboardService.getCourseProgressData();

  return (
    <div className="page-view dashboard-container">
      
      {/* Blue Banner */}
      <div className="dashboard-banner">
        <div className="banner-content">
          <h2 className="banner-greeting">Hii Name! 👋</h2>
          <span className="banner-subtitle">READY TO LEARN</span>
        </div>
      </div>

      {/* Stats Grid (Overlapping) */}
      <div className="stats-cards-grid">
        {stats.map(stat => (
          <div key={stat.id} className={`stat-card color-${stat.color}`} id={`stat-${stat.id}`}>
            <div className="stat-icon-wrapper">
              <Icon name={stat.icon} className="stat-icon" />
            </div>
            <span className="stat-title">{stat.title}</span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Mid Row (Keep Going & Time Spent) */}
      <div className="dashboard-row-mid">
        
        {/* Keep Going Card */}
        <div className="keep-going-card">
          <div className="card-badge-pill">
            <Icon name="zap" style={{ width: '12px', height: '12px', fill: '#ffdf40', stroke: '#ffdf40' }} />
            <span>{keepGoing.badge}</span>
          </div>
          
          <div className="keep-going-content">
            <h3 className="keep-going-title">{keepGoing.title}</h3>
            <p className="keep-going-desc">{keepGoing.description}</p>
          </div>
          
          <a href="#course" className="continue-btn">
            <span>{keepGoing.buttonText}</span>
            <Icon name="arrow-right" style={{ width: '16px', height: '16px' }} />
          </a>
        </div>

        {/* Time Spent Card */}
        <div className="time-spent-card">
          <div className="card-badge-pill time-spent-badge">
            <Icon name="zap" style={{ width: '12px', height: '12px', fill: '#ffdf40', stroke: '#ffdf40' }} />
            <span>{timeSpent.badge}</span>
          </div>
          
          <div className="venn-container">
            {/* Learning Contents Circle */}
            <div className="venn-circle circle-learning">
              <span className="venn-circle-title">{timeSpent.categories[0].title}</span>
              <span className="venn-circle-hours">{timeSpent.categories[0].hours}</span>
              <span className="venn-circle-label">{timeSpent.categories[0].label}</span>
            </div>
            
            {/* Assessment Circle */}
            <div className="venn-circle circle-assessment">
              <span className="venn-circle-hours">{timeSpent.categories[1].hours}</span>
              <span className="venn-circle-label">{timeSpent.categories[1].label}</span>
            </div>
            
            {/* Practice Circle */}
            <div className="venn-circle circle-practice">
              <span className="venn-circle-hours">{timeSpent.categories[2].hours}</span>
              <span className="venn-circle-label">{timeSpent.categories[2].label}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row (Course Progress) */}
      <div className="course-progress-card">
        <div className="course-progress-header">
          <div className="course-progress-info">
            <div className="course-icon-bg">
              <Icon name="book-open" style={{ width: '20px', height: '20px' }} />
            </div>
            <div className="course-title-sub">
              <h3>{progress.title}</h3>
              <span>{progress.subtitle}</span>
            </div>
          </div>
          <span className="progress-percent-label">{progress.percent}% Completed</span>
        </div>

        {/* SVG Progress Chart */}
        <div className="line-chart-container">
          <svg viewBox="0 0 1000 120" className="chart-svg" preserveAspectRatio="none">
            {/* Blue baseline tracker */}
            <line x1="100" y1="90" x2="900" y2="90" className="chart-baseline" style={{ stroke: '#e2e8f0', strokeWidth: 2 }} />
            <line x1="100" y1="90" x2="900" y2="90" className="chart-baseline" />
            
            {/* Completion Line curve */}
            <path d="M 100 80 Q 250 50 400 45 T 700 40 T 900 35" className="chart-line" />
            
            {/* Interactive dots */}
            <circle cx="100" cy="80" r="5" className="chart-point" data-desc="Day 0: 0%" />
            <circle cx="400" cy="45" r="5" className="chart-point" data-desc="Day 4: 35%" />
            <circle cx="600" cy="41" r="5" className="chart-point" data-desc="Day 8: 40%" />
            <circle cx="800" cy="35" r="5" className="chart-point" data-desc="Day 12: 48%" />
            
            {/* X axis scale labels */}
            <text x="100" y="112" className="chart-label" textAnchor="middle">0%</text>
            <text x="900" y="112" className="chart-label" textAnchor="middle">100%</text>
          </svg>
        </div>

        {/* Date fields & view button */}
        <div className="course-progress-footer">
          <div className="date-ranges">
            <div className="date-item">
              <Icon name="calendar" />
              <div>
                <span className="date-lbl">Start Date</span>
                <span className="date-val">{progress.startDate}</span>
              </div>
            </div>
            
            <div className="date-separator"></div>
            
            <div className="date-item">
              <Icon name="calendar" />
              <div>
                <span className="date-lbl">End Date</span>
                <span className="date-val">{progress.endDate}</span>
              </div>
            </div>
          </div>
          
          <a href="#course" className="view-course-btn">View Course</a>
        </div>
      </div>

    </div>
  );
}
