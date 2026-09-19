import React, { useState, useEffect } from 'react';
import feedbackService from '../../services/feedbackService';
import Icon from '../../components/Icon';

export default function TraineeFeedbackScreen() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [videoRating, setVideoRating] = useState(5);
  const [videoComment, setVideoComment] = useState('');

  const [practiceRating, setPracticeRating] = useState(5);
  const [practiceComment, setPracticeComment] = useState('');

  const [codingRating, setCodingRating] = useState(5);
  const [codingComment, setCodingComment] = useState('');

  const [supportRating, setSupportRating] = useState(5);
  const [supportComment, setSupportComment] = useState('');

  const [overallRating, setOverallRating] = useState(5);
  const [likedComment, setLikedComment] = useState('');
  const [improvementComment, setImprovementComment] = useState('');
  const [overallComment, setOverallComment] = useState('');

  const [pastFeedback, setPastFeedback] = useState([]);

  useEffect(() => {
    loadMyFeedback();
  }, []);

  const loadMyFeedback = async () => {
    try {
      const data = await feedbackService.getMyTraineeFeedback();
      if (data && data.length > 0) {
        setPastFeedback(data);
        const latest = data[0];
        setVideoRating(latest.video_rating || 5);
        setVideoComment(latest.video_comment || '');
        setPracticeRating(latest.practice_rating || 5);
        setPracticeComment(latest.practice_comment || '');
        setCodingRating(latest.coding_rating || 5);
        setCodingComment(latest.coding_comment || '');
        setSupportRating(latest.trainer_support_rating || 5);
        setSupportComment(latest.trainer_support_comment || '');
        setOverallRating(latest.overall_rating || 5);
        setLikedComment(latest.liked_comment || '');
        setImprovementComment(latest.improvement_comment || '');
        setOverallComment(latest.overall_comment || '');
      }
    } catch (err) {
      console.error('Failed to load past feedback:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await feedbackService.submitTraineeFeedback({
        video_rating: videoRating,
        video_comment: videoComment,
        practice_rating: practiceRating,
        practice_comment: practiceComment,
        coding_rating: codingRating,
        coding_comment: codingComment,
        trainer_support_rating: supportRating,
        trainer_support_comment: supportComment,
        overall_rating: overallRating,
        liked_comment: likedComment,
        improvement_comment: improvementComment,
        overall_comment: overallComment,
      });

      setSuccessMsg('Your feedback has been submitted successfully! Thank you for helping us improve.');
      loadMyFeedback();
    } catch (err) {
      console.error('Feedback submission error:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  const renderStarPicker = (val, setVal) => (
    <div style={{ display: 'flex', gap: '6px', cursor: 'pointer', margin: '6px 0 10px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          onClick={() => setVal(star)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.4rem',
            cursor: 'pointer',
            color: star <= val ? '#f59e0b' : '#cbd5e1',
            padding: 0,
            transition: 'transform 0.1s ease',
          }}
        >
          ★
        </button>
      ))}
      <span style={{ marginLeft: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#475569', alignSelf: 'center' }}>
        {val} / 5
      </span>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px', fontFamily: 'sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
          Training & Course Feedback
        </h2>
        <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
          Your feedback is anonymous and helps us optimize training quality, video content, and lab experiences.
        </p>
      </div>

      {successMsg && (
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #86efac', marginBottom: '20px', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', marginBottom: '20px', fontWeight: 600 }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Section 1: Video Content */}
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>1. Video Content Quality</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0' }}>Rate explanation clarity, video pacing, and content usefulness.</p>
          {renderStarPicker(videoRating, setVideoRating)}
          <textarea
            rows={2}
            value={videoComment}
            onChange={(e) => setVideoComment(e.target.value)}
            placeholder="Comments regarding video lectures or concept clarity..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        {/* Section 2: Practice Questions */}
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>2. Practice Questions & MCQs</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0' }}>Rate question relevance, difficulty balance, and learning value.</p>
          {renderStarPicker(practiceRating, setPracticeRating)}
          <textarea
            rows={2}
            value={practiceComment}
            onChange={(e) => setPracticeComment(e.target.value)}
            placeholder="Comments regarding practice MCQs or quizzes..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        {/* Section 3: Coding Challenges */}
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>3. Coding Challenges & Hands-on Labs</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0' }}>Rate problem quality, test-case coverage, and skill enhancement.</p>
          {renderStarPicker(codingRating, setCodingRating)}
          <textarea
            rows={2}
            value={codingComment}
            onChange={(e) => setCodingComment(e.target.value)}
            placeholder="Comments regarding coding challenges or auto-grader test cases..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        {/* Section 4: Trainer Support */}
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>4. Trainer Support & Guidance</h3>
          <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 10px 0' }}>Rate doubt clarification, accessibility, and trainer communication.</p>
          {renderStarPicker(supportRating, setSupportRating)}
          <textarea
            rows={2}
            value={supportComment}
            onChange={(e) => setSupportComment(e.target.value)}
            placeholder="Comments regarding trainer interaction and technical support..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
          />
        </div>

        {/* Section 5: Overall Experience */}
        <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 700, color: '#2563eb' }}>5. Overall Training Experience</h3>
          {renderStarPicker(overallRating, setOverallRating)}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>What did you like about the training?</label>
              <textarea
                rows={2}
                value={likedComment}
                onChange={(e) => setLikedComment(e.target.value)}
                placeholder="Highlight positive aspects of the course..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>What can be improved?</label>
              <textarea
                rows={2}
                value={improvementComment}
                onChange={(e) => setImprovementComment(e.target.value)}
                placeholder="Suggestions for syllabus or lab improvement..."
                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px 28px',
            borderRadius: '10px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
          }}
        >
          {loading ? 'Submitting Feedback...' : 'Submit Complete Feedback'}
        </button>
      </form>
    </div>
  );
}
