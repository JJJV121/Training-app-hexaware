import React, { useState } from 'react';
import issueService from '../services/issueService';
import Icon from './Icon';

export default function RaiseIssueModal({ isOpen, onClose, onSuccess }) {
  const [issueType, setIssueType] = useState('Login Issue');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [attachment, setAttachment] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const issueCategories = [
    'Login Issue',
    'Account Setup Issue',
    'Password Issue',
    'MFA / Authentication Issue',
    'Course Access Issue',
    'Assignment Issue',
    'Assessment Issue',
    'Other',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError('Please fill in both subject and description.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('issue_type', issueType);
      formData.append('subject', subject);
      formData.append('description', description);
      formData.append('priority', priority);
      if (attachment) {
        formData.append('file', attachment);
      }

      const res = await issueService.raiseCandidateIssue(formData);
      setSuccessMsg(`Issue ${res.issue_id} submitted successfully! Admin has been notified.`);
      setTimeout(() => {
        setSuccessMsg(null);
        setSubject('');
        setDescription('');
        setAttachment(null);
        onSuccess && onSuccess(res);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error raising issue:', err);
      setError(err.response?.data?.detail || 'Failed to submit issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: 'var(--card-bg, #ffffff)',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          border: '1px solid var(--border-color, #cbd5e1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--bg-main, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="help-circle" style={{ width: '20px', height: '20px' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark, #0f172a)' }}>
                Raise an Issue
              </h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-medium, #64748b)' }}>
                Report technical or course issues to the LMS Support Admin.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-medium, #64748b)',
              padding: '4px',
            }}
          >
            <Icon name="x" style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {error && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', fontSize: '0.85rem', fontWeight: 700 }}>
              {successMsg}
            </div>
          )}

          {/* Issue Type */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark, #0f172a)', marginBottom: '6px' }}>
              Issue Type <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-dark, #0f172a)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            >
              {issueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark, #0f172a)', marginBottom: '6px' }}>
              Subject <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief title of the issue (e.g., Unable to submit assignment)"
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-dark, #0f172a)',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark, #0f172a)', marginBottom: '6px' }}>
              Description <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Provide complete details, error messages, or steps to reproduce the issue..."
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color, #cbd5e1)',
                backgroundColor: 'var(--bg-main, #f8fafc)',
                color: 'var(--text-dark, #0f172a)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Priority & Attachment Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark, #0f172a)', marginBottom: '6px' }}>
                Priority (Optional)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #cbd5e1)',
                  backgroundColor: 'var(--bg-main, #f8fafc)',
                  color: 'var(--text-dark, #0f172a)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dark, #0f172a)', marginBottom: '6px' }}>
                Attachment (Optional)
              </label>
              <input
                type="file"
                onChange={(e) => setAttachment(e.target.files[0] || null)}
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-medium, #64748b)',
                }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color, #cbd5e1)',
                color: 'var(--text-dark, #0f172a)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
