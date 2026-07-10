import { useState } from 'react';
import Icon from '../../components/Icon';
import mockDataService from '../../services/mockDataService';

export default function AdminNotifications() {
  const [toastMsg, setToastMsg] = useState(null);

  // Load state from mockDataService
  const [notifications, setNotifications] = useState(() => mockDataService.getNotifications());

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    mockDataService.saveNotifications(updated);
    triggerToast('All notifications marked as read.');
  };

  const handleClear = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    mockDataService.saveNotifications(updated);
    triggerToast('Notification cleared.');
  };

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
          <span className="admin-banner-subtitle">PLATFORM ALERTS</span>
          <h2 className="admin-banner-title">Notifications Inbox</h2>
        </div>
        <div className="admin-banner-right">
          <button className="admin-banner-btn" onClick={handleMarkAllRead}>
            <Icon name="check-circle" style={{ width: '16px', height: '16px' }} />
            <span>Mark all as Read</span>
          </button>
        </div>
      </div>

      {/* Notifications list layout */}
      <div className="admin-card" style={{ gap: '0' }}>
        {notifications.length > 0 ? (
          notifications.map((n, idx) => (
            <div 
              key={n.id} 
              className="widget-item-row" 
              style={{ 
                padding: '20px', 
                borderBottom: idx < notifications.length - 1 ? '1px solid var(--border-color)' : 'none',
                backgroundColor: n.read ? '' : '#fafbfc'
              }}
            >
              <div className="widget-item-left">
                <div 
                  className="widget-item-icon-circle" 
                  style={{ 
                    backgroundColor: n.read ? '#f1f5f9' : 'var(--primary-blue-light)', 
                    color: n.read ? 'var(--text-medium)' : 'var(--primary-blue)' 
                  }}
                >
                  <Icon name={n.type} style={{ width: '18px', height: '18px' }} />
                </div>
                <div className="widget-item-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="widget-item-title" style={{ fontSize: '14px' }}>{n.title}</span>
                    {!n.read && <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent-red)', borderRadius: '50%' }}></span>}
                  </div>
                  <span className="widget-item-desc" style={{ fontSize: '12px', marginTop: '2px' }}>{n.message}</span>
                </div>
              </div>

              <div className="widget-item-right" style={{ gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
                <span className="widget-time">{n.time}</span>
                <button className="row-action-btn delete" style={{ border: 'none' }} title="Clear alert" onClick={() => handleClear(n.id)}>
                  <Icon name="plus" style={{ transform: 'rotate(45deg)', width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
            <Icon name="bell" style={{ width: '48px', height: '48px', marginBottom: '12px', opacity: 0.5 }} />
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Your inbox is completely clear!</p>
          </div>
        )}
      </div>

    </div>
  );
}
