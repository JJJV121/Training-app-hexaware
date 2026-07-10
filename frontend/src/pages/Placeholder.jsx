import { useState } from 'react';
import Icon from '../components/Icon';
import dashboardService from '../services/dashboardService';

export default function Placeholder({ title, description }) {
  // Toggle states for Profile screen
  const [modeEnabled, setModeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  if (title === 'Progress') {
    const progressData = dashboardService.getProgressOverview();
    return (
      <div className="page-view progress-container-view">
        {/* Blue Banner Header */}
        <div className="progress-banner-header">
          <div className="progress-banner-left">
            <div className="progress-banner-icon-bg">
              <Icon name="activity" className="progress-banner-icon" />
            </div>
            <div className="progress-banner-text">
              <h2 className="progress-banner-title">Your Progress</h2>
              <span className="progress-banner-subtitle">Track your progress</span>
            </div>
          </div>
          <button className="progress-new-note-btn">
            <Icon name="plus" className="progress-new-note-icon" />
            <span>New Note</span>
          </button>
        </div>

        {/* Column Row (Certificate and Insights) */}
        <div className="progress-grid-mid">
          
          {/* Certificate Card */}
          <div className="progress-card progress-cert-card">
            <div className="progress-card-header">
              <div className="progress-cert-icon-circle">
                <Icon name="file-text" className="progress-cert-icon" />
              </div>
              <div className="progress-card-header-text">
                <h3>Course Certificate</h3>
                <span>Complete all modules to unlock</span>
              </div>
            </div>

            <div className="progress-cert-body">
              <div className="progress-req-box">
                <div className="progress-req-header">
                  <span className="progress-req-title">Requirements Progress</span>
                  <span className="progress-req-pct">{progressData.percentage}%</span>
                </div>
                <div className="progress-req-track">
                  <div className="progress-req-bar" style={{ width: `${progressData.percentage}%` }}></div>
                </div>
                
                <ul className="progress-req-list">
                  <li className="progress-req-item completed">
                    <span className="progress-check-circle">
                      <Icon name="check" className="progress-check-icon" />
                    </span>
                    <span>Complete all {progressData.completedModules} modules</span>
                  </li>
                  <li className="progress-req-item pending">
                    <span className="progress-empty-circle"></span>
                    <span>Pass all assessments ({progressData.completedAssessments}/{progressData.totalAssessments} completed)</span>
                  </li>
                </ul>
              </div>
            </div>

            <button className="progress-cert-btn" disabled>
              <Icon name="lock" className="progress-lock-icon" />
              <span>Certificate Locked</span>
            </button>
          </div>

          {/* Learning Insights Card */}
          <div className="progress-card progress-insights-card">
            <div className="progress-insights-header">
              <Icon name="info" className="progress-info-icon" />
              <h3>Learning Insights</h3>
            </div>
            
            <div className="progress-insights-body">
              {progressData.insights.map((insight, idx) => (
                <div key={idx} className="progress-insight-item">
                  <span className="insight-item-title">{insight.title}</span>
                  <span className="insight-item-desc">{insight.description}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Assessment Results Card */}
        <div className="progress-card progress-assessment-card">
          <h3 className="progress-assessment-title">Assessment Results</h3>
          
          <div className="progress-assessment-list">
            {progressData.assessments.map(item => (
              <div key={item.id} className="progress-assessment-item-row">
                <div className="progress-assessment-row-header">
                  <div className="progress-assessment-info">
                    <h4>{item.title}</h4>
                    <span>{item.details}</span>
                  </div>
                  <span className={`progress-badge badge-${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>
                {item.status === 'Passed' && (
                  <div className="progress-assessment-track">
                    <div className="progress-assessment-bar" style={{ width: `${item.score}%` }}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  if (title === 'Profile') {
    const profileData = dashboardService.getProfileData();
    return (
      <div className="page-view profile-container-view">
        {/* Blue Banner Header */}
        <div className="profile-banner-header">
          <h2 className="profile-banner-title">Profile</h2>
        </div>

        {/* Profile Details Overlay Card */}
        <div className="profile-details-card">
          <div className="profile-avatar-container">
            <div className="profile-avatar-box">
              <Icon name="user" className="profile-avatar-icon" />
              <button className="profile-avatar-edit-badge" aria-label="Edit Profile Picture">
                <Icon name="edit-3" className="profile-avatar-edit-icon" />
              </button>
            </div>
          </div>
          <div className="profile-info-text">
            <h3 className="profile-user-name">{profileData.name}</h3>
            <span className="profile-user-email">{profileData.email}</span>
          </div>
        </div>

        {/* Account Settings List */}
        <div className="profile-settings-section">
          <h3 className="profile-settings-title">Account Settings</h3>
          
          <div className="profile-settings-list">
            
            {/* Personal Details */}
            <div className="profile-settings-row">
              <div className="profile-settings-left">
                <div className="settings-icon-circle">
                  <Icon name="user" className="settings-icon" />
                </div>
                <span>Personal Details</span>
              </div>
              <Icon name="chevron-right" className="settings-chevron" />
            </div>

            {/* Passwords */}
            <div className="profile-settings-row">
              <div className="profile-settings-left">
                <div className="settings-icon-circle">
                  <Icon name="key" className="settings-icon" />
                </div>
                <span>Passwords</span>
              </div>
              <Icon name="chevron-right" className="settings-chevron" />
            </div>

            {/* Mode Switch */}
            <div className="profile-settings-row" onClick={() => setModeEnabled(!modeEnabled)}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle">
                  <Icon name="sun" className="settings-icon" />
                </div>
                <span>Mode</span>
              </div>
              <div className={`settings-toggle-switch ${modeEnabled ? 'active' : ''}`}>
                <div className="settings-toggle-knob"></div>
              </div>
            </div>

            {/* Notifications Switch */}
            <div className="profile-settings-row" onClick={() => setNotificationsEnabled(!notificationsEnabled)}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle">
                  <Icon name="bell" className="settings-icon" />
                </div>
                <span>Notifications</span>
              </div>
              <div className={`settings-toggle-switch ${notificationsEnabled ? 'active' : ''}`}>
                <div className="settings-toggle-knob"></div>
              </div>
            </div>

            {/* Logout */}
            <a href="#logout" className="profile-settings-row logout-row" style={{ textDecoration: 'none' }}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle">
                  <Icon name="log-out" className="settings-icon" />
                </div>
                <span>Logout</span>
              </div>
              <Icon name="chevron-right" className="settings-chevron" />
            </a>

          </div>
        </div>
      </div>
    );
  }

  // Default Placeholder layout for other views (Notes, Logged Out, etc.)
  let iconName = 'layout';
  if (title === 'Notes') iconName = 'file-text';
  else if (title === 'Logged Out') iconName = 'log-out';

  return (
    <div
      className="page-view placeholder-page-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        textAlign: 'center',
        color: 'var(--text-medium)',
        fontFamily: 'var(--font-family-body)'
      }}
    >
      <div
        className="placeholder-icon-wrapper"
        style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          backgroundColor: 'var(--primary-blue-light)',
          color: 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <Icon name={iconName} style={{ width: '40px', height: '40px' }} />
      </div>
      <h2
        className="placeholder-title"
        style={{
          fontFamily: 'var(--font-family-header)',
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--text-dark)',
          marginBottom: '8px'
        }}
      >
        {title}
      </h2>
      <p
        className="placeholder-desc"
        style={{
          fontSize: '16px',
          color: 'var(--text-light)',
          maxWidth: '400px',
          lineHeight: 1.5,
          marginBottom: '32px'
        }}
      >
        {description}
      </p>

      <div
        className="placeholder-card"
        style={{
          background: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px 32px',
          boxShadow: 'var(--card-shadow)',
          maxWidth: '480px',
          width: '100%'
        }}
      >
        <h4
          style={{
            fontFamily: 'var(--font-family-header)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--text-dark)',
            marginBottom: '8px'
          }}
        >
          Development Notice
        </h4>
        <p style={{ fontSize: '14px', color: 'var(--text-medium)', lineHeight: 1.4 }}>
          This section represents a placeholder menu item. The Home, Course, and Schedule tabs are fully functional training environments.
        </p>
      </div>
    </div>
  );
}
