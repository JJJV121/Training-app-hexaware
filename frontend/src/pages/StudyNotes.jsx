import React, { useState, useEffect } from 'react';
import "../styles/StudyNotes.css";
import noteService from '../services/noteService';

const pastelColors = ['#f5e6fe', '#e6f0fa', '#eafaf1', '#fef7e0', '#fdeaf2', '#eef2fe'];

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

export default function StudyNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNote, setActiveNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTag, setEditTag] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [noteIdToDelete, setNoteIdToDelete] = useState(null);

  // Retrieve logged-in user ID
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;

  // Fetch notes on mount and when userId changes
  useEffect(() => {
    let isMounted = true;
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await noteService.getNotes(userId);
        if (isMounted) {
          setNotes(data || []);
        }
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        if (isMounted) {
          setError("Could not load study notes from server.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNotes();
    return () => { isMounted = false; };
  }, [userId]);

  const handleOpenNote = (note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTag(note.tag || '');
    setIsEditing(false);
    setCopySuccess(false);
  };

  const handleSaveNote = async () => {
    const finalTitle = editTitle.trim() || 'Untitled Note';
    const finalContent = editContent.trim() || 'No content provided.';
    const finalTag = editTag.trim() || 'General';

    try {
      if (activeNote.isNew) {
        // Create new note on backend
        const created = await noteService.createNote(userId, {
          title: finalTitle,
          content: finalContent,
          tag: finalTag,
          color: activeNote.color,
          pinned: activeNote.pinned
        });
        setNotes(prevNotes => [created, ...prevNotes]);
        setActiveNote(created);
      } else {
        // Update existing note on backend
        const updated = await noteService.updateNote(userId, activeNote.id, {
          title: finalTitle,
          content: finalContent,
          tag: finalTag,
          color: activeNote.color,
          pinned: activeNote.pinned
        });
        setNotes(prevNotes =>
          prevNotes.map(n => n.id === activeNote.id ? updated : n)
        );
        setActiveNote(updated);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to save note:", err);
      alert("Failed to save note. Please check backend connection.");
    }
  };

  const triggerDeleteConfirmation = (id) => {
    if (activeNote?.isNew) {
      setActiveNote(null);
      setIsEditing(false);
      return;
    }
    setNoteIdToDelete(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteIdToDelete) return;
    try {
      await noteService.deleteNote(userId, noteIdToDelete);
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteIdToDelete));
      setActiveNote(null);
      setShowDeleteModal(false);
      setNoteIdToDelete(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
      alert("Failed to delete note. Please check backend connection.");
    }
  };

  const handleTogglePin = async (e, id) => {
    e.stopPropagation();
    const noteToToggle = notes.find(n => n.id === id);
    if (!noteToToggle) return;

    const newPinnedState = !noteToToggle.pinned;

    // Optimistic UI update
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === id ? { ...note, pinned: newPinnedState } : note
      )
    );

    try {
      await noteService.updateNote(userId, id, {
        title: noteToToggle.title,
        content: noteToToggle.content,
        tag: noteToToggle.tag,
        color: noteToToggle.color,
        pinned: newPinnedState
      });
    } catch (err) {
      console.error("Failed to update pin state:", err);
      // Revert optimistic update
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === id ? { ...note, pinned: !newPinnedState } : note
        )
      );
    }
  };

  const handleCreateNote = () => {
    const randomColor = pastelColors[notes.length % pastelColors.length];
    const newNote = {
      title: '',
      content: '',
      color: randomColor,
      pinned: false,
      tag: '',
      isNew: true
    };

    setActiveNote(newNote);
    setEditTitle('');
    setEditContent('');
    setEditTag('');
    setIsEditing(true);
    setCopySuccess(false);
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const totalNotesCount = notes.length;
  const pinnedNotesCount = notes.filter(n => n.pinned).length;
  const sortedNotes = [...notes].sort((a, b) => b.pinned - a.pinned);

  const filteredNotes = sortedNotes.filter(note =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.tag?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-wrapper">
      {showDeleteModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-box">
            <div className="modal-icon-warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
            </div>
            <h3 className="modal-title">Delete Study Note?</h3>
            <p className="modal-message">Are you sure you want to delete this? This action cannot be undone.</p>
            <div className="modal-actions-row">
              <button className="modal-btn-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="modal-btn-confirm" onClick={handleConfirmDelete}>Delete Note</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-medium)' }}>
          <p>Fetching your study notes...</p>
        </div>
      ) : error ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--accent-red)' }}>
          <p>{error}</p>
          <button 
            className="empty-state-btn" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '16px' }}
          >
            Retry Loading
          </button>
        </div>
      ) : activeNote ? (
        <div className="notes-preview-page">
          <div className="preview-header">
            <button className="preview-back-btn" onClick={() => { setActiveNote(null); setIsEditing(false); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              <span>Back to Notes</span>
            </button>

            <div className="preview-actions">
              {!activeNote.isNew && (
                <button
                  className={`preview-action-btn preview-copy-btn ${copySuccess ? 'active' : ''}`}
                  onClick={() => handleCopyToClipboard(activeNote.content)}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>{copySuccess ? 'Copied' : 'Copy'}</span>
                </button>
              )}

              {isEditing ? (
                <button className="preview-action-btn preview-save-btn" onClick={handleSaveNote}>
                  Save Note
                </button>
              ) : (
                <button className="preview-action-btn preview-edit-btn" onClick={() => setIsEditing(true)}>
                  Edit Note
                </button>
              )}

              <button className="preview-action-btn preview-delete-btn" onClick={() => triggerDeleteConfirmation(activeNote.id)}>
                Delete
              </button>
            </div>
          </div>

          <div className="notes-preview-card" style={{ backgroundColor: activeNote.color }}>
            {isEditing ? (
              <div className="preview-form-panel">
                <div className="input-group">
                  <label className="field-label">Title</label>
                  <input
                    type="text"
                    className="preview-input"
                    value={editTitle}
                    placeholder="Enter title"
                    autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label className="field-label">Category</label>
                  <input
                    type="text"
                    className="preview-input"
                    value={editTag}
                    placeholder="e.g. Artificial Intelligence"
                    onChange={(e) => setEditTag(e.target.value)}
                  />
                </div>

                <div className="input-group textarea-group">
                  <label className="field-label">Notes Content</label>
                  <textarea
                    className="preview-textarea"
                    value={editContent}
                    placeholder="Start typing your study notes here..."
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="preview-content-panel">
                <div className="preview-meta-row">
                  <span className="preview-tag-badge">{activeNote.tag || 'General'}</span>
                  {activeNote.pinned && <span className="preview-pinned-badge">Pinned</span>}
                </div>

                <h2 className="preview-title">{activeNote.title || 'Untitled Note'}</h2>
                <p className="preview-copy-text">{activeNote.content || 'No content provided.'}</p>
                <div className="preview-timestamp">
                  Last Modified • {formatDate(activeNote.updated_at || activeNote.created_at)}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="notes-hero-premium">
            <div className="notes-hero-headline">
              <div className="branding-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>

              <div className="notes-hero-copy">
                <h1 className="white-title">Study Notes</h1>
                <p className="light-subtext">Create and organize your study materials</p>
              </div>
            </div>

            <div className="notes-hero-actions">
              <button className="add-note-btn-premium" onClick={handleCreateNote}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span>New Note</span>
              </button>
            </div>
          </header>

          <div className="notes-search-area">
            <div className="notes-search-wrapper">
              <input
                type="text"
                placeholder="Search notes..."
                className="notes-search-input-premium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')} title="Clear search">
                  ✕
                </button>
              )}
            </div>
          </div>

          {filteredNotes.length > 0 ? (
            <main className="notes-grid-layout">
              {filteredNotes.map(note => (
                <div
                  key={note.id}
                  className={`dashboard-individual-card ${note.pinned ? 'is-pinned' : ''}`}
                  style={{ backgroundColor: note.color }}
                  onClick={() => handleOpenNote(note)}
                >
                  <div className="card-top-content">
                    <div className="card-meta-header">
                      <span className="card-tag-pill">{note.tag || 'General'}</span>
                      {note.pinned && <span className="card-pin-badge">Pinned</span>}
                      <button 
                        className={`card-pin-trigger ${note.pinned ? 'pinned-active' : 'unpinned'}`}
                        onClick={(e) => handleTogglePin(e, note.id)}
                        title={note.pinned ? "Unpin Note" : "Pin Note"}
                      >
                        📌
                      </button>
                    </div>
                    <h3 className="card-item-title">{note.title || 'Untitled Note'}</h3>
                    <p className="card-item-body">{note.content || 'No content provided.'}</p>
                  </div>
                  <div className="card-item-footer-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    {formatDate(note.updated_at || note.created_at)}
                  </div>
                </div>
              ))}
            </main>
          ) : (
            <div className="dashboard-empty-state">
              <div className="empty-state-icon-container">
                {searchQuery ? (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                ) : (
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                )}
              </div>
              <h3 className="empty-state-title">
                {searchQuery ? "No matches found" : "No notes yet"}
              </h3>
              <p className="empty-state-message">
                {searchQuery 
                  ? `Could not find any results for "${searchQuery}". Please check your spelling or refine your keywords.`
                  : "Your study collection is empty. Create a brand new note to begin organizing your workspace."
                }
              </p>
              <button 
                className="empty-state-btn" 
                onClick={searchQuery ? () => setSearchQuery('') : handleCreateNote}
              >
                {searchQuery ? "Clear Search Filter" : "Create First Note"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}