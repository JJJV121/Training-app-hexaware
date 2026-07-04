import React, { useState, useEffect } from 'react';
import { assignmentService } from '../services/assignmentService';

export default function Assignment({ courseDayId, userId, isUnlocked = true }) {
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLocked, setIsLocked] = useState(false);

  // Workflow states
  const [hasDownloaded, setHasDownloaded] = useState({});
  const [selectedFiles, setSelectedFiles] = useState({});
  const [uploadingIds, setUploadingIds] = useState(new Set());

  useEffect(() => {
    if (!courseDayId || !isUnlocked) {
      setLoading(false);
      setAssignments([]);
      setSubmissions([]);
      setIsLocked(false);
      setError(null);
      return;
    }

    const loadModuleData = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsLocked(false);

        const [assignedList, submissionList] = await Promise.all([
          assignmentService.getAvailableAssignments(courseDayId),
          assignmentService.getMySubmissions()
        ]);

        setAssignments(assignedList || []);
        setSubmissions(submissionList || []);
      } catch (err) {
        if (err.response && err.response.status === 403) {
          setIsLocked(true);
        } else {
          setError("Unable to process assignments layout. Verify API connectivity.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadModuleData();
  }, [courseDayId, isUnlocked]);

  // Execute Step 1: Download
  const handleDownloadStep = async (assignmentId, title) => {
    try {
      const fileData = await assignmentService.downloadAssignment(assignmentId);
      const fileURL = window.URL.createObjectURL(new Blob([fileData]));
      const anchorNode = document.createElement('a');
      anchorNode.href = fileURL;
      anchorNode.setAttribute('download', `${title.replace(/\s+/g, '_')}_Starter.zip`);
      document.body.appendChild(anchorNode);
      anchorNode.click();
      anchorNode.parentNode.removeChild(anchorNode);

      setHasDownloaded(prev => ({ ...prev, [assignmentId]: true }));
    } catch (err) {
      alert("Error initiating file download streaming.");
    }
  };

  const handleFileSelection = (assignmentId, event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setSelectedFiles(prev => ({ ...prev, [assignmentId]: selectedFile }));
    }
  };

  // Execute Step 2: Upload Solution
  const handleUploadStep = async (assignmentId) => {
    const file = selectedFiles[assignmentId];
    if (!file) return;

    try {
      setUploadingIds(prev => new Set(prev).add(assignmentId));
      await assignmentService.submitAssignment(assignmentId, file, userId);

      const updatedSubmissions = await assignmentService.getMySubmissions();
      setSubmissions(updatedSubmissions || []);
    } catch (err) {
      alert("Error transmitting solution archive package.");
    } finally {
      setUploadingIds(prev => {
        const copy = new Set(prev);
        copy.delete(assignmentId);
        return copy;
      });
    }
  };

  if (loading) return <div style={styles.stateBox}>Loading module tasks...</div>;
  if (!courseDayId) return <div style={styles.stateBox}>Select a lesson to load its assignments.</div>;

  if (!isUnlocked) {
    return (
      <div style={{ ...styles.container, ...styles.lockedBox }}>
        <h4>Assignments Locked</h4>
        <p>Complete every required video for this day to unlock the assignment workflow.</p>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div style={{ ...styles.container, ...styles.lockedBox }}>
        <h4>Tasks Locked</h4>
        <p>Complete all instructional video units for this day to unlock your practical assignment workflow.</p>
      </div>
    );
  }

  if (error) return <div style={{ ...styles.stateBox, color: '#ef4444' }}>{error}</div>;
  if (assignments.length === 0) return <div style={styles.stateBox}>No tasks assigned to this module.</div>;

  return (
    <div style={styles.container}>
      <h3 style={styles.header}>Module Assignment Pipeline</h3>

      {assignments.map(task => {
        const record = submissions.find(s => s.assignment_id === task.id);
        const fileChoice = selectedFiles[task.id];
        const isUploading = uploadingIds.has(task.id);
        const downloaded = hasDownloaded[task.id] || !!record;

        return (
          <div key={task.id} style={styles.taskCard}>
            <div style={styles.infoBanner}>
              <h4 style={styles.taskTitle}>{task.title}</h4>
              <p style={styles.taskDesc}>{task.description}</p>
            </div>

            <div style={styles.workflowGrid}>
              <div style={{ ...styles.stepBox, opacity: record ? 0.6 : 1 }}>
                <span style={styles.stepBadge}>Step 1</span>
                <p style={styles.stepText}>Download the official setup files and prompt documents directly to your workspace.</p>
                <button
                  onClick={() => handleDownloadStep(task.id, task.title)}
                  disabled={!!record}
                  style={styles.downloadBtn}
                >
                  Download Starter Material
                </button>
                {downloaded && <span style={styles.successIndicator}>Package Acquired</span>}
              </div>

              <div style={{
                ...styles.stepBox,
                opacity: !downloaded ? 0.4 : 1
              }}>
                <span style={styles.stepBadge}>Step 2</span>
                <p style={styles.stepText}>Once completed locally, bundle your solution into a single compressed (.zip) archive.</p>

                {!record ? (
                  <div style={styles.actionRow}>
                    <label htmlFor={`input-${task.id}`} style={styles.uploadLabel}>
                      {fileChoice ? fileChoice.name : "Select Solution File..."}
                    </label>
                    <input
                      type="file"
                      id={`input-${task.id}`}
                      accept=".zip,.rar,.7z"
                      style={{ display: 'none' }}
                      onChange={(e) => handleFileSelection(task.id, e)}
                      disabled={!downloaded}
                    />
                    <button
                      onClick={() => handleUploadStep(task.id)}
                      disabled={!downloaded || !fileChoice || isUploading}
                      style={{
                        ...styles.submitBtn,
                        backgroundColor: downloaded && fileChoice ? '#2563eb' : '#cbd5e1'
                      }}
                    >
                      {isUploading ? "Uploading..." : "Submit Project"}
                    </button>
                  </div>
                ) : (
                  <div style={styles.statusBlock}>
                    {record.status === 'SUBMITTED' && (
                      <div style={styles.statusPending}>Submission Recorded. Awaiting Evaluation.</div>
                    )}
                    {record.status === 'PASSED' && (
                      <div style={styles.statusPassed}>Completed! Score Awarded: {record.marks}%</div>
                    )}
                    {record.status === 'FAILED' && (
                      <div style={styles.statusFailed}>
                        Revision Required. Feedback: "{record.review_comments}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    marginTop: '24px'
  },
  header: {
    fontSize: '18px',
    color: '#1e3a8a',
    margin: '0 0 20px 0',
    fontWeight: '700'
  },
  taskCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  infoBanner: {
    backgroundColor: '#93c5fd',
    padding: '20px',
    color: '#1e3a8a'
  },
  taskTitle: {
    margin: '0 0 8px 0',
    fontSize: '16px',
    fontWeight: '700'
  },
  taskDesc: {
    margin: 0,
    fontSize: '14px',
    lineHeight: '1.5',
    opacity: 0.95
  },
  workflowGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f8fafc'
  },
  stepBox: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 8px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    marginBottom: '8px'
  },
  stepText: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 16px 0',
    lineHeight: '1.4'
  },
  downloadBtn: {
    backgroundColor: '#1e40af',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'center'
  },
  successIndicator: {
    fontSize: '12px',
    color: '#16a34a',
    fontWeight: '600',
    marginTop: '10px',
    textAlign: 'center'
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
    marginTop: 'auto'
  },
  uploadLabel: {
    flex: 1,
    border: '1px dashed #cbd5e1',
    borderRadius: '6px',
    backgroundColor: '#f8fafc',
    padding: '10px',
    fontSize: '13px',
    color: '#64748b',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'flex',
    alignItems: 'center'
  },
  submitBtn: {
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  statusBlock: {
    marginTop: 'auto',
    paddingTop: '10px'
  },
  statusPending: {
    backgroundColor: '#fef9c3',
    color: '#854d0e',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },
  statusPassed: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },
  statusFailed: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500'
  },
  stateBox: {
    padding: '40px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px'
  },
  lockedBox: {
    textAlign: 'center',
    border: '1px dashed #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#64748b'
  }
};
