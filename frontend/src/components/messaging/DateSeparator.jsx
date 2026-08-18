import React from 'react';

export default function DateSeparator({ dateString }) {
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '16px 0 8px 0',
        position: 'relative'
      }}
    >
      <div
        style={{
          flex: 1,
          height: '1px',
          backgroundColor: 'var(--msg-border, #e2e8f0)'
        }}
      />
      <span
        style={{
          padding: '4px 14px',
          fontSize: '0.725rem',
          fontWeight: 700,
          color: 'var(--text-light, #64748b)',
          backgroundColor: 'var(--msg-card-bg, #ffffff)',
          borderRadius: '12px',
          border: '1px solid var(--msg-border, #e2e8f0)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}
      >
        {formatDateLabel(dateString)}
      </span>
      <div
        style={{
          flex: 1,
          height: '1px',
          backgroundColor: 'var(--msg-border, #e2e8f0)'
        }}
      />
    </div>
  );
}
