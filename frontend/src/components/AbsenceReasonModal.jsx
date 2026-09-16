import React, { useState } from 'react';

export default function AbsenceReasonModal({ followupRecord, onClose, onSuccess }) {
  const [category, setCategory] = useState('Medical');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a detailed explanation.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const formData = new FormData();
      formData.append('followup_id', followupRecord.id);
      formData.append('reason_category', category);
      formData.append('reason_description', description);
      if (file) {
        formData.append('file', file);
      }

      const res = await fetch('/api/attendance-followup/candidate/submit-reason', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'Failed to submit absence reason');
      }

      const updated = await res.json();
      if (onSuccess) onSuccess(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#fff', padding: '28px', borderRadius: '12px', width: '520px', maxWidth: '95%' }}>
        <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>Submit Absence Reason</h3>
        <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#475569' }}>
          Please provide a valid explanation for your training absences in <strong>{followupRecord?.course_name || 'your course'}</strong>.
        </p>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Reason Category <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            >
              <option value="Medical">Medical / Illness</option>
              <option value="Personal Emergency">Personal / Family Emergency</option>
              <option value="Academic Conflict">Academic / Exam Conflict</option>
              <option value="Technical Issue">Connectivity / Technical Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Detailed Explanation <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide specific details about why you were unable to attend..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              required
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>
              Supporting Document / Attachment (Optional)
            </label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              style={{ fontSize: '13px' }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Accepted formats: PDF, PNG, JPG, DOCX
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                background: '#0061fe',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Reason'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
