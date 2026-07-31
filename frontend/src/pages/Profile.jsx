import { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext.jsx';
import dashboardService from '../services/dashboardService.js';
import axios from 'axios';
import '../styles/profile.css'; // Importing our standalone styles

export default function Profile() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Password form state fields
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Status feedback states for user interactions
  const [submitStatus, setSubmitStatus] = useState({ loading: false, success: null, error: null });

  const { isDarkMode, toggleTheme } = useTheme();
  const darkModeEnabled = isDarkMode;

  const [profileData, setProfileData] = useState({
    name: "Loading...",
    email: "Loading..."
  });
//checking
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await dashboardService.getProfileViewData(userId);
        if (data) {
          setProfileData(data);
        }
      } catch (error) {
        console.error("Error loading profile data:", error);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setProfileData({
          name: user.employee_id || user.name || 'Student',
          email: user.email || 'student@example.com'
        });
      }
    };

    fetchProfileData();
  }, [userId]);

  const userName = profileData.name;
  const userEmail = profileData.email;

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
    // Clear alerts when switching menus
    setSubmitStatus({ loading: false, success: null, error: null });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus({ loading: true, success: null, error: null });

    // Client-side structural match validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSubmitStatus({
        loading: false,
        success: null,
        error: "New passwords do not match."
      });
      return;
    }

    try {
      // Dispatches payload to your targeted backend microservice API layout
      const response = await axios.post(`http://localhost:5000/api/profile/${userId}/change-password`, {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      setSubmitStatus({
        loading: false,
        success: response.data.message || "Password updated successfully!",
        error: null
      });

      // Clear structural input forms upon deep state resolution success
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error("Password change error:", error);
      setSubmitStatus({
        loading: false,
        success: null,
        error: error.response?.data?.message || "Failed to update password. Please check your current password."
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('logged_in_user_id');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // --- Theme Mapping ---
  const theme = {
    bgApp: darkModeEnabled ? '#0f172a' : '#f8fafc',
    bgCard: darkModeEnabled ? '#1e293b' : 'white',
    bgExpanded: darkModeEnabled ? '#0f172a' : '#f8fafc',
    bgHover: darkModeEnabled ? '#334155' : '#f1f5f9',
    textMain: darkModeEnabled ? '#f8fafc' : '#1e293b',
    textSub: darkModeEnabled ? '#94a3b8' : '#64748b',
    borderColor: darkModeEnabled ? '#334155' : '#e2e8f0',
    inputBg: darkModeEnabled ? '#0f172a' : '#ffffff',
  };

  return (
    <div className="profile-container" style={{ background: theme.bgApp }}>
      {/* Header Section */}
      <div className="profile-header">
        <h1 className="profile-header-title">Profile</h1>
      </div>

      {/* Main Content Content Canvas wrapper */}
      <div className="profile-content-wrapper">
        
        {/* Profile Identity Widget Card */}
        <div className="profile-card" style={{ background: theme.bgCard, borderColor: theme.borderColor }}>
          <div className="profile-card-flex">
            <div className="profile-avatar-badge">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="profile-user-name" style={{ color: theme.textMain }}>{userName}</h2>
              <p className="profile-user-email" style={{ color: theme.textSub }}>{userEmail}</p>
            </div>
          </div>
        </div>

        {/* Global Settings Section Wrapper */}
        <div className="profile-sections-container">
          <h3 className="profile-group-heading" style={{ color: theme.textMain }}>
            Account Settings
          </h3>

          {/* Item 1: Personal Details */}
          <div className="profile-section-item" style={{ background: theme.bgCard, borderColor: theme.borderColor }}>
            <button
              onClick={() => toggleSection('personal')}
              className="profile-section-trigger"
              style={{ '--hover-bg': theme.bgHover }}
            >
              <div className="profile-trigger-left">
                <div className="profile-icon-wrapper personal-icon" style={{ background: darkModeEnabled ? '#1e3a8a' : '#eef2ff' }}>
                  👤
                </div>
                <span className="profile-trigger-label" style={{ color: theme.textMain }}>
                  Personal Details
                </span>
              </div>
              <span className="profile-trigger-arrow" style={{ color: theme.textSub, transform: expandedSection === 'personal' ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ›
              </span>
            </button>
            
            {expandedSection === 'personal' && (
              <div className="profile-expanded-panel" style={{ borderTopColor: theme.borderColor, background: theme.bgExpanded }}>
                <p className="profile-expanded-text" style={{ color: theme.textSub }}>
                  Update your personal information including name, email, and contact details.
                </p>
              </div>
            )}
          </div>

          {/* Item 2: Password Modals & Form Actions */}
          <div className="profile-section-item" style={{ background: theme.bgCard, borderColor: theme.borderColor }}>
            <button
              onClick={() => toggleSection('password')}
              className="profile-section-trigger"
              style={{ '--hover-bg': theme.bgHover }}
            >
              <div className="profile-trigger-left">
                <div className="profile-icon-wrapper password-icon" style={{ background: darkModeEnabled ? '#14532d' : '#f0fdf4' }}>
                  🔐
                </div>
                <span className="profile-trigger-label" style={{ color: theme.textMain }}>
                  Passwords
                </span>
              </div>
              <span className="profile-trigger-arrow" style={{ color: theme.textSub, transform: expandedSection === 'password' ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ›
              </span>
            </button>
            
            {expandedSection === 'password' && (
              <div className="profile-expanded-panel" style={{ borderTopColor: theme.borderColor, background: theme.bgExpanded }}>
                <form onSubmit={handlePasswordSubmit} className="profile-password-form">
                  
                  {submitStatus.error && <div className="form-alert status-error">{submitStatus.error}</div>}
                  {submitStatus.success && <div className="form-alert status-success">{submitStatus.success}</div>}

                  <div className="form-group">
                    <label className="form-label" style={{ color: theme.textMain }}>Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordInputChange}
                      className="form-input-field"
                      style={{ background: theme.inputBg, color: theme.textMain, borderColor: theme.borderColor }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: theme.textMain }}>New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordInputChange}
                      className="form-input-field"
                      style={{ background: theme.inputBg, color: theme.textMain, borderColor: theme.borderColor }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: theme.textMain }}>Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordInputChange}
                      className="form-input-field"
                      style={{ background: theme.inputBg, color: theme.textMain, borderColor: theme.borderColor }}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitStatus.loading}
                    className="form-submit-btn"
                  >
                    {submitStatus.loading ? 'Updating Security Records...' : 'Save Updated Password'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {false && (
          /* Item 3: Theme Preferences */
          <div className="profile-section-item" style={{ background: theme.bgCard, borderColor: theme.borderColor, padding: '16px 20px' }}>
            <div className="profile-inline-row">
              <div className="profile-trigger-left">
                <div className="profile-icon-wrapper lightmode-icon" style={{ background: darkModeEnabled ? '#78350f' : '#fef3c7' }}>
                  ✨
                </div>
                <span className="profile-trigger-label" style={{ color: theme.textMain }}>
                  Dark Mode
                </span>
              </div>
              <button
                onClick={() => toggleTheme()}
                className="profile-toggle-switch"
                style={{ 
                  background: darkModeEnabled ? '#3563e9' : '#cbd5e1',
                  paddingLeft: darkModeEnabled ? '24px' : '4px'
                }}
              >
                <div className="profile-toggle-node"></div>
              </button>
            </div>
          </div>

          )}

          {/* Notifications Hub */}
          <div className="profile-section-item" style={{ background: theme.bgCard, borderColor: theme.borderColor, padding: '16px 20px' }}>
            <div className="profile-inline-row">
              <div className="profile-trigger-left">
                <div className="profile-icon-wrapper alerts-icon" style={{ background: darkModeEnabled ? '#1e3a8a' : '#e0e7ff' }}>
                  🔔
                </div>
                <span className="profile-trigger-label" style={{ color: theme.textMain }}>
                  Notifications
                </span>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className="profile-toggle-switch"
                style={{ 
                  background: notificationsEnabled ? '#3563e9' : '#cbd5e1',
                  paddingLeft: notificationsEnabled ? '24px' : '4px'
                }}
              >
                <div className="profile-toggle-node"></div>
              </button>
            </div>
          </div>

          {/* Item 5: Application Termination Context */}
          <div className="profile-section-item" style={{ background: theme.bgCard, borderColor: theme.borderColor }}>
            <button
              onClick={() => toggleSection('logout')}
              className="profile-section-trigger"
              style={{ '--hover-bg': theme.bgHover }}
            >
              <div className="profile-trigger-left">
                <div className="profile-icon-wrapper logout-icon" style={{ background: darkModeEnabled ? '#7f1d1d' : '#fee2e2' }}>
                  🚪
                </div>
                <span className="profile-trigger-label" style={{ color: theme.textMain }}>
                  Logout
                </span>
              </div>
              <span className="profile-trigger-arrow" style={{ color: theme.textSub, transform: expandedSection === 'logout' ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                ›
              </span>
            </button>
            
            {expandedSection === 'logout' && (
              <div className="profile-expanded-panel" style={{ borderTopColor: theme.borderColor, background: theme.bgExpanded }}>
                <p className="profile-expanded-text" style={{ color: theme.textSub, marginBottom: '12px' }}>
                  Sign out from your account. You'll need to log in again to access your profile.
                </p>
                <button onClick={handleLogout} className="profile-confirm-logout-btn">
                  Confirm Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
