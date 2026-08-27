import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient.js';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';
import dashboardService from '../services/dashboardService.js';
import Icon from '../components/Icon';
import PasswordPolicyChecker from '../components/PasswordPolicyChecker.jsx';
import { isPasswordValid } from '../utils/passwordPolicy.js';
import '../styles/profile.css';

export default function Profile() {
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState(null);
  const [profileData, setProfileData] = useState({
    name: 'Loading...',
    email: 'Loading...',
    courseName: 'Java Training'
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [visiblePasswords, setVisiblePasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [submitStatus, setSubmitStatus] = useState({ loading: false, success: null, error: null });

  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const data = await dashboardService.getProfileViewData(userId);
        if (data) setProfileData((current) => ({ ...current, ...data }));
      } catch (error) {
        console.error('Error loading profile data:', error);
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        setProfileData({
          name: user.name || user.employee_id || 'Student',
          email: user.email || 'student@example.com',
          courseName: 'Java Training'
        });
      }
    };

    fetchProfileData();
  }, [userId]);

  const userName = profileData.name || 'Student';
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  const toggleSection = (section) => {
    setExpandedSection((current) => (current === section ? null : section));
    setSubmitStatus({ loading: false, success: null, error: null });
  };

  const handlePasswordInputChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setVisiblePasswords((current) => ({ ...current, [fieldName]: !current[fieldName] }));
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setSubmitStatus({ loading: true, success: null, error: null });

    if (!isPasswordValid(passwordForm.newPassword)) {
      setSubmitStatus({ loading: false, success: null, error: 'New password does not comply with the password policy requirements.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSubmitStatus({ loading: false, success: null, error: 'New passwords do not match.' });
      return;
    }

    try {
      const response = await apiClient.post(`/profile/${userId}/change-password`, {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      setSubmitStatus({
        loading: false,
        success: response.data.message || 'Password updated successfully.',
        error: null
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
      setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (error) {
      console.error('Password change error:', error);
      setSubmitStatus({
        loading: false,
        success: null,
        error: error.response?.data?.detail || error.response?.data?.message || 'Failed to update password. Please check your current password.'
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('logged_in_user_id');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const settings = [
    { id: 'personal', icon: 'user', tone: 'blue', title: 'Personal details', description: 'Your account information and course' },
    { id: 'password', icon: 'key', tone: 'green', title: 'Password & security', description: 'Keep your account protected' },
    { id: 'preferences', icon: isDarkMode ? 'sun' : 'layout', tone: 'orange', title: 'Appearance', description: `${isDarkMode ? 'Dark' : 'Light'} theme selected` },
    { id: 'logout', icon: 'log-out', tone: 'red', title: 'Log out', description: 'Sign out of this account' }
  ];

  const passwordFields = [
    { name: 'currentPassword', label: 'Current password' },
    { name: 'newPassword', label: 'New password' },
    { name: 'confirmPassword', label: 'Confirm new password' }
  ];

  return (
    <main className={`profile-page ${isDarkMode ? 'profile-page-dark' : ''}`}>
      <section className="profile-hero">
        <div className="profile-hero-glow profile-hero-glow-one" />
        <div className="profile-hero-glow profile-hero-glow-two" />
        <div className="profile-hero-copy">
          <span className="profile-eyebrow">Account overview</span>
          <h1>My profile</h1>
          <p>Manage your account details and learning preferences.</p>
        </div>
        <div className="profile-hero-mark" aria-hidden="true"><Icon name="user" /></div>
      </section>

      <section className="profile-identity-card">
        <div className="profile-avatar">{initials || 'S'}</div>
        <div className="profile-identity-copy">
          <div className="profile-name-line">
            <h2>{userName}</h2>
            <span className="profile-status"><span /> Active learner</span>
          </div>
          <p>{profileData.email}</p>
          <span className="profile-course"><Icon name="book-open" /> {profileData.courseName || 'Java Training'}</span>
        </div>
        <div className="profile-identity-meta">
          <span>Learning journey</span>
          <strong>In progress</strong>
        </div>
      </section>

      <section className="profile-stats" aria-label="Profile summary">
        <div className="profile-stat-card">
          <span 
            className="profile-stat-icon blue" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', minWidth: '38px', borderRadius: '11px', padding: 0, margin: 0 }}
          >
            <Icon name="book-open" size={18} style={{ display: 'block', margin: 0 }} />
          </span>
          <div><strong>01</strong><span>Active course</span></div>
        </div>
        <div className="profile-stat-card">
          <span 
            className="profile-stat-icon green" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', minWidth: '38px', borderRadius: '11px', padding: 0, margin: 0 }}
          >
            <Icon name="check-circle" size={18} style={{ display: 'block', margin: 0 }} />
          </span>
          <div><strong>Ready</strong><span>Account status</span></div>
        </div>
        <div className="profile-stat-card">
          <span 
            className="profile-stat-icon orange" 
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', minWidth: '38px', borderRadius: '11px', padding: 0, margin: 0 }}
          >
            <Icon name="zap" size={18} style={{ display: 'block', margin: 0 }} />
          </span>
          <div><strong>Keep going</strong><span>Next milestone</span></div>
        </div>
      </section>

      <section className="profile-settings-section">
        <div className="profile-section-heading"><div><span className="profile-eyebrow">Preferences</span><h2>Account settings</h2></div><span className="profile-settings-count">{settings.length} options</span></div>
        <div className="profile-settings-list">
          {settings.map((setting) => (
            <div className={`profile-setting ${expandedSection === setting.id ? 'is-expanded' : ''}`} key={setting.id}>
              <button className="profile-setting-trigger" onClick={() => toggleSection(setting.id)} aria-expanded={expandedSection === setting.id}>
                <span 
                  className={`profile-setting-icon ${setting.tone}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', minWidth: '38px', borderRadius: '11px', padding: 0, margin: 0 }}
                >
                  <Icon name={setting.icon} size={18} style={{ display: 'block', margin: 0 }} />
                </span>
                <span className="profile-setting-copy"><strong>{setting.title}</strong><small>{setting.description}</small></span>
                <Icon name="chevron-right" size={16} className="profile-chevron" />
              </button>

              {expandedSection === 'personal' && setting.id === 'personal' && (
                <div className="profile-panel"><div className="profile-detail-grid"><div><span>Email address</span><strong>{profileData.email}</strong></div><div><span>Assigned course</span><strong>{profileData.courseName || 'Not assigned'}</strong></div></div></div>
              )}

              {expandedSection === 'password' && setting.id === 'password' && (
                <div className="profile-panel"><form onSubmit={handlePasswordSubmit} className="profile-password-form">
                  {submitStatus.error && <div className="form-alert status-error">{submitStatus.error}</div>}
                  {submitStatus.success && <div className="form-alert status-success">{submitStatus.success}</div>}
                  {passwordFields.map((field) => (
                    <label key={field.name}>
                      {field.label}
                      <span className="profile-password-input-wrap">
                        <input
                          type={visiblePasswords[field.name] ? 'text' : 'password'}
                          name={field.name}
                          value={passwordForm[field.name]}
                          onChange={handlePasswordInputChange}
                          required
                        />
                        <button
                          type="button"
                          className="profile-password-toggle"
                          onClick={() => togglePasswordVisibility(field.name)}
                          aria-label={visiblePasswords[field.name] ? `Hide ${field.label.toLowerCase()}` : `Show ${field.label.toLowerCase()}`}
                        >
                          <Icon name={visiblePasswords[field.name] ? 'eye-off' : 'eye'} size={18} />
                        </button>
                      </span>
                    </label>
                  ))}
                  <PasswordPolicyChecker
                    password={passwordForm.newPassword}
                    confirmPassword={passwordForm.confirmPassword}
                    showConfirm={true}
                  />
                  <button
                    type="submit"
                    className="profile-primary-button"
                    disabled={submitStatus.loading || !isPasswordValid(passwordForm.newPassword) || passwordForm.newPassword !== passwordForm.confirmPassword}
                  >
                    {submitStatus.loading ? 'Updating password...' : 'Update password'}
                  </button>
                </form></div>
              )}

              {expandedSection === 'preferences' && setting.id === 'preferences' && (
                <div className="profile-panel profile-control-row"><div><strong>Theme preference</strong><span>Switch between light and dark mode</span></div><button className={`profile-switch ${isDarkMode ? 'active' : ''}`} onClick={toggleTheme} aria-label="Toggle theme"><span /></button></div>
              )}

              {expandedSection === 'logout' && setting.id === 'logout' && (
                <div className="profile-panel profile-logout-panel"><p>Sign out from your account. You can log back in anytime to continue learning.</p><button onClick={handleLogout} className="profile-danger-button">Confirm log out</button></div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
