import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import dashboardService from '../services/dashboardService';

export default function Placeholder({ title, description }) {
  // Toggle states for Profile screen
  const [modeEnabled, setModeEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Safe fallback states to prevent rendering crashes while waiting for data
  const [profileData, setProfileData] = useState({
    name: "Alex Mercer",
    email: "alex.mercer@devstudent.io"
  });

  // Fetch your profile view telemetry data asynchronously on mount
  useEffect(() => {
    if (title === 'Profile' && typeof dashboardService.getProfileViewData === 'function') {
      dashboardService.getProfileViewData("EMP001")
        .then(data => {
          if (data) setProfileData(data);
        })
        .catch(err => console.error("Error loading profile view data:", err));
    }
  }, [title]);

  if (title === 'Progress') {
    /* --- HARDCODED SAFE FALLBACK DATA FOR PROGRESS VIEW --- */
    const progressData = {
      percentage: 58,
      completedModules: 48,
      totalModules: 48,
      completedAssessments: 2,
      totalAssessments: 3,
      insights: [
        { title: "20% ahead of average pace", description: "You're making excellent progress!" },
        { title: "Estimated completion: May 22, 2026", description: "2 days earlier than scheduled" }
      ],
      assessments: [
        { id: "java-basics", title: "Java Basics Quiz", status: "Passed", score: 85, total: 100, details: "Score: 85/100" },
        { id: "oop-mid", title: "OOP Mid-Assessment", status: "Passed", score: 78, total: 100, details: "Score: 78/100" },
        { id: "data-structures", title: "Data Structures Quiz", status: "Upcoming", score: null, total: null, details: "Not yet taken" }
      ]
    };

    return (
      <div className="page-view progress-container-view" style={{ padding: '24px', width: '100%' }}>
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
    return (
      <div 
        className="page-view profile-container-view" 
        style={{ 
          maxWidth: '640px', 
          margin: '0 auto', 
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}
      >
        {/* Blue Banner Header Card Layout */}
        <div 
          className="profile-banner-header" 
          style={{ 
            height: '160px', 
            borderRadius: '24px', 
            display: 'flex', 
            alignItems: 'flex-start', 
            padding: '24px',
            position: 'relative'
          }}
        >
          <h2 className="profile-banner-title" style={{ fontSize: '32px', margin: 0 }}>Profile</h2>
        </div>

        {/* Floating Profile Details Block Overlay */}
        <div 
          className="profile-details-card" 
          style={{ 
            marginTop: '-50px', 
            marginLeft: '16px', 
            marginRight: '16px', 
            borderRadius: '20px',
            background: '#ffffff',
            boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.05)',
            border: '1px solid #F1F5F9',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative',
            zIndex: 10
          }}
        >
          <div className="profile-avatar-container">
            <div 
              className="profile-avatar-box" 
              style={{ 
                width: '56px', 
                height: '56px', 
                background: '#3563e9', 
                color: '#ffffff', 
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <Icon name="user" style={{ width: '28px', height: '28px' }} />
              <button 
                className="profile-avatar-edit-badge" 
                aria-label="Edit Profile Picture"
                style={{
                  position: 'absolute',
                  bottom: '-4px',
                  right: '-4px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <Icon name="edit-3" style={{ width: '10px', height: '10px', color: '#64748B' }} />
              </button>
            </div>
          </div>
          <div className="profile-info-text">
            <h3 className="profile-user-name" style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 2px 0' }}>{profileData.name}</h3>
            <span className="profile-user-email" style={{ fontSize: '13px', color: '#64748B' }}>{profileData.email}</span>
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="profile-settings-section" style={{ padding: '0 16px', marginTop: '28px' }}>
          <h3 
            className="profile-settings-title" 
            style={{ 
              fontSize: '14px', 
              fontWeight: '700', 
              color: '#1E293B', 
              marginBottom: '16px'
            }}
          >
            Account Settings
          </h3>
          
          <div className="profile-settings-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'transparent', border: 'none' }}>
            
            {/* Personal Details */}
            <div className="profile-settings-row" style={{ background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle" style={{ background: '#F8FAFC', color: '#3563e9', borderRadius: '12px' }}>
                  <Icon name="user" className="settings-icon" />
                </div>
                <span style={{ fontWeight: '500', color: '#0F172A' }}>Personal Details</span>
              </div>
              <Icon name="chevron-right" className="settings-chevron" style={{ color: '#94A3B8' }} />
            </div>

            {/* Passwords */}
            <div className="profile-settings-row" style={{ background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle" style={{ background: '#F8FAFC', color: '#3563e9', borderRadius: '12px' }}>
                  <Icon name="key" className="settings-icon" />
                </div>
                <span style={{ fontWeight: '500', color: '#0F172A' }}>Passwords</span>
              </div>
              <Icon name="chevron-right" className="settings-chevron" style={{ color: '#94A3B8' }} />
            </div>

            {/* Mode Switch */}
            <div className="profile-settings-row" onClick={() => setModeEnabled(!modeEnabled)} style={{ background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle" style={{ background: '#F8FAFC', color: '#3563e9', borderRadius: '12px' }}>
                  <Icon name="sun" className="settings-icon" />
                </div>
                <span style={{ fontWeight: '500', color: '#0F172A' }}>Mode</span>
              </div>
              <div 
                className={`settings-toggle-switch ${modeEnabled ? 'active' : ''}`}
                style={{
                  width: '40px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: modeEnabled ? '#3563e9' : '#E2E8F0',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <div 
                  className="settings-toggle-knob" 
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: '3px',
                    left: modeEnabled ? '19px' : '3px',
                    transition: 'left 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Notifications Switch */}
            <div className="profile-settings-row" onClick={() => setNotificationsEnabled(!notificationsEnabled)} style={{ background: '#ffffff', border: '1px solid #F1F5F9', borderRadius: '16px', padding: '16px' }}>
              <div className="profile-settings-left">
                <div className="settings-icon-circle" style={{ background: '#F8FAFC', color: '#3563e9', borderRadius: '12px' }}>
                  <Icon name="bell" className="settings-icon" />
                </div>
                <span style={{ fontWeight: '500', color: '#0F172A' }}>Notifications</span>
              </div>
              <div 
                className={`settings-toggle-switch ${notificationsEnabled ? 'active' : ''}`}
                style={{
                  width: '40px',
                  height: '24px',
                  borderRadius: '12px',
                  backgroundColor: notificationsEnabled ? '#3563e9' : '#E2E8F0',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <div 
                  className="settings-toggle-knob" 
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    position: 'absolute',
                    top: '3px',
                    left: notificationsEnabled ? '19px' : '3px',
                    transition: 'left 0.2s'
                  }}
                />
              </div>
            </div>

            {/* Logout Row */}
            <a 
              href="#logout" 
              className="profile-settings-row logout-row" 
              style={{ 
                textDecoration: 'none',
                background: '#ffffff',
                border: '1px solid #F1F5F9',
                borderRadius: '16px',
                padding: '16px'
              }}
            >
              <div className="profile-settings-left">
                <div className="settings-icon-circle" style={{ background: '#F8FAFC', color: '#3563e9', borderRadius: '12px' }}>
                  <Icon name="log-out" className="settings-icon" />
                </div>
                <span style={{ fontWeight: '500', color: '#0F172A' }}>Logout</span>
              </div>
              <Icon name="chevron-right" className="settings-chevron" style={{ color: '#94A3B8' }} />
            </a>

          </div>
        </div>
      </div>
    );
  }

  // Default Fallback Container View
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