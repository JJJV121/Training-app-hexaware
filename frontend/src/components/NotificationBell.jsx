import React, { useState, useEffect, useRef } from 'react';
import notificationService from '../services/notificationService';
import Icon from './Icon';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getUserNotifications(false, 30);
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Failed to mark notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const getPriorityStyle = (priority) => {
    switch ((priority || '').toUpperCase()) {
      case 'HIGH':
        return { bg: '#fef2f2', border: '#fca5a5', text: '#dc2626', badge: '#ef4444' };
      case 'MEDIUM':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb', badge: '#3b82f6' };
      default:
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#64748b', badge: '#94a3b8' };
    }
  };

  return (
    <div className="notification-bell-wrapper" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'relative',
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '50%',
          width: '42px',
          height: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'var(--text-dark, #0f172a)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
          transition: 'all 0.2s ease',
        }}
        aria-label="Notifications"
      >
        <Icon name="bell" style={{ width: '20px', height: '20px' }} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 800,
              borderRadius: '10px',
              padding: '2px 6px',
              minWidth: '18px',
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(239,68,68,0.4)',
              animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notification-dropdown"
          style={{
            position: 'absolute',
            right: 0,
            top: '50px',
            width: '360px',
            maxHeight: '480px',
            backgroundColor: 'var(--card-bg, #ffffff)',
            border: '1px solid var(--border-color, #cbd5e1)',
            borderRadius: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-color, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-main, #f8fafc)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icon name="bell" style={{ width: '18px', height: '18px', color: '#2563eb' }} />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                Notifications
              </h4>
              {unreadCount > 0 && (
                <span style={{ fontSize: '12px', fontWeight: 700, backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px' }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '2px 6px',
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b' }}>
                <Icon name="check-circle" style={{ width: '32px', height: '32px', marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '13px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => {
                const style = getPriorityStyle(n.priority);
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      marginBottom: '6px',
                      backgroundColor: n.is_read ? 'transparent' : style.bg,
                      border: `1px solid ${n.is_read ? 'var(--border-color, #f1f5f9)' : style.border}`,
                      transition: 'background-color 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                        {n.title}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: style.badge, color: '#ffffff' }}>
                          {n.priority}
                        </span>
                        {!n.is_read && (
                          <button
                            type="button"
                            onClick={(e) => handleMarkRead(n.id, e)}
                            title="Mark as read"
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#64748b',
                              padding: '2px',
                            }}
                          >
                            <Icon name="check" style={{ width: '14px', height: '14px' }} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--text-medium, #475569)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
