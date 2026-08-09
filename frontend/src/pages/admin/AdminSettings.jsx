import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminSettings() {
  const [toastMsg, setToastMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  // Load state from mockDataService
  const settingsData = mockDataService.getSettings();
  const [adminName, setAdminName] = useState(settingsData.adminName);
  const [adminEmail, setAdminEmail] = useState(settingsData.adminEmail);
  const [platformName, setPlatformName] = useState(settingsData.platformName);
  const [passwordMinLength, setPasswordMinLength] = useState(settingsData.passwordMinLength);
  const [requireDigits, setRequireDigits] = useState(settingsData.requireDigits);
  const [themeMode, setThemeMode] = useState(settingsData.themeMode);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    mockDataService.saveSettings({
      adminName,
      adminEmail,
      platformName,
      passwordMinLength,
      requireDigits,
      themeMode
    });
    triggerToast('Settings saved successfully!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: 'user' },
    { id: 'platform', label: 'Platform & Branding', icon: 'layout' },
    { id: 'security', label: 'Security & Policy', icon: 'lock' },
    { id: 'roles', label: 'Roles & Permissions', icon: 'shield' }
  ];

  return (
    <div className="page-view admin-container">
      
      {toastMsg && (
        <div className="toast-message">
          <Icon name="check" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Banner */}
      <div className="admin-banner">
        <div className="admin-banner-left">
          <span className="admin-banner-subtitle">SYSTEM SETTINGS</span>
          <h2 className="admin-banner-title">LMS Configuration Panel</h2>
        </div>
      </div>

      {/* Settings layout split tabs */}
      <div className="split-view-container" style={{ gridTemplateColumns: '1fr 3fr' }}>
        
        {/* Navigation Sidebar inside Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              style={{ border: 'none', background: activeTab === tab.id ? 'var(--primary-blue)' : '#ffffff', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} className="nav-icon" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Configurations Forms Pane */}
        <div className="admin-card">
          <form onSubmit={handleSave} className="modal-form">
            
            {activeTab === 'profile' && (
              <div className="settings-section-container">
                <h3 style={{ fontFamily: 'var(--font-family-header)', fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>Administrator Profile</h3>
                
                <div className="settings-row-pair">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-input" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-input" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  </div>
                </div>

                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Change Password</label>
                  <input type="password" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className="form-input" />
                </div>
              </div>
            )}

            {activeTab === 'platform' && (
              <div className="settings-section-container">
                <h3 style={{ fontFamily: 'var(--font-family-header)', fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>Branding Settings</h3>
                
                <div className="form-group">
                  <label className="form-label">Platform Display Name</label>
                  <input type="text" className="form-input" value={platformName} onChange={(e) => setPlatformName(e.target.value)} required />
                </div>

                <div className="settings-row-pair" style={{ alignItems: 'center' }}>
                  <div className="form-group">
                    <label className="form-label">Platform Mode Theme</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {['Light', 'Dark'].map(mode => (
                        <button 
                          type="button" 
                          key={mode} 
                          className="action-btn-secondary" 
                          style={{ 
                            flexGrow: 1, 
                            justifyContent: 'center', 
                            backgroundColor: themeMode === mode ? 'var(--primary-blue)' : '', 
                            color: themeMode === mode ? '#ffffff' : '' 
                          }}
                          onClick={() => setThemeMode(mode)}
                        >
                          {mode} Mode
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Upload Corporate Logo</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" className="action-btn-secondary" onClick={() => triggerToast('Logo file browser simulated!')}>
                        <Icon name="upload" style={{ width: '16px', height: '16px' }} />
                        <span>Select File</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-section-container">
                <h3 style={{ fontFamily: 'var(--font-family-header)', fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>Password & Access Policy</h3>
                
                <div className="form-group" style={{ maxWidth: '300px' }}>
                  <label className="form-label">Minimum Password Length</label>
                  <input type="number" min="6" max="32" className="form-input" value={passwordMinLength} onChange={(e) => setPasswordMinLength(e.target.value)} required />
                </div>

                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <input 
                    type="checkbox" 
                    id="digit-chk" 
                    checked={requireDigits}
                    onChange={(e) => setRequireDigits(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <label htmlFor="digit-chk" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>Require digits and special characters in passwords</label>
                </div>
              </div>
            )}

            {activeTab === 'roles' && (
              <div className="settings-section-container">
                <h3 style={{ fontFamily: 'var(--font-family-header)', fontSize: '16px', fontWeight: 800, color: 'var(--text-dark)' }}>Roles & Permissions Registry</h3>
                
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Role Name</th>
                        <th>Create Course</th>
                        <th>Assign Trainers</th>
                        <th>Grade Students</th>
                        <th>System Access</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 700 }}>Administrator</td>
                        <td>âœ… Yes</td>
                        <td>âœ… Yes</td>
                        <td>âœ… Yes</td>
                        <td>âœ… Full Root</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700 }}>Trainer</td>
                        <td>âŒ No</td>
                        <td>âŒ No</td>
                        <td>âœ… Yes</td>
                        <td>âœ… Read-Write</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 700 }}>Student</td>
                        <td>âŒ No</td>
                        <td>âŒ No</td>
                        <td>âŒ No</td>
                        <td>âœ… View Only</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="action-btn-primary" style={{ padding: '12px 28px' }}>
                Save Settings
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
