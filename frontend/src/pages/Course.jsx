import { useState } from 'react';
import courseService from '../services/courseService';
import Icon from '../components/Icon';

export default function Course() {
  const course = courseService.getCourseData();

  // Manage completed lessons state
  const [completedLessons, setCompletedLessons] = useState(() => {
    const completed = new Set();
    course.modules.forEach(module => {
      module.lessons.forEach(lesson => {
        if (lesson.completed) {
          completed.add(lesson.id);
        }
      });
    });
    return completed;
  });

  const toggleLesson = (lessonId) => {
    setCompletedLessons(prev => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  return (
    <div className="page-view course-container">
      
      {/* Course Page Banner */}
      <div className="course-banner">
        
        <div className="course-banner-left">
          <div>
            <span className="course-breadcrumb">{course.category}</span>
            <h2 className="course-banner-title">{course.title}</h2>
          </div>
          
          {/* Tabs */}
          <div className="course-tabs-wrapper">
            <a href="#course" className="course-tab active">{course.tabs[0]}</a>
            <a href="#course" className="course-tab inactive">{course.tabs[1]}</a>
          </div>
        </div>

        {/* Progress Widget */}
        <div className="course-banner-right">
          
          {/* Progress val */}
          <div className="course-banner-stat">
            <span className="course-banner-stat-lbl">PROGRESS</span>
            <span className="course-banner-stat-val">{course.progress}%</span>
            <div className="course-progress-track">
              <div className="course-progress-bar" style={{ width: `${course.progress}%` }}></div>
            </div>
          </div>
          
          {/* Current Day */}
          <div className="course-banner-stat">
            <span className="course-banner-stat-lbl">CURRENT DAY</span>
            <span className="course-banner-stat-val">{course.currentDay}/{course.totalDays}</span>
          </div>

        </div>

      </div>

      {/* Modules Section */}
      <div className="modules-section">
        {course.modules.map(module => {
          const isFirst = module.id === 1;
          const badgeClass = isFirst ? 'active-badge' : 'inactive-badge';
          
          return (
            <div key={module.id} className="module-group" id={`module-${module.id}`}>
              {/* Module Header */}
              <div className="module-header">
                <div className={`module-badge ${badgeClass}`}>{module.id}</div>
                <div className="module-details">
                  <h3 className="module-title">{module.title}</h3>
                  <span className="module-day">
                    <Icon name="clock" />
                    <span>{module.dayLabel}</span>
                  </span>
                </div>
              </div>

              {/* Lessons List */}
              <div className="lessons-list">
                {module.lessons.map(lesson => {
                  const isCompleted = completedLessons.has(lesson.id);
                  return (
                    <div key={lesson.id} className="lesson-card" id={`lesson-${lesson.id}`}>
                      
                      {/* Left side info */}
                      <div className="lesson-info">
                        <div className="lesson-title-row">
                          <h4 className="lesson-title">{lesson.title}</h4>
                          <span className="lesson-duration">{lesson.duration}</span>
                        </div>
                        
                        {/* Lesson actions (buttons) */}
                        <div className="lesson-actions">
                          <button className="lesson-action-btn action-video">
                            <Icon name="play" style={{ fill: '#ffffff' }} />
                            <span>{lesson.videos} Videos</span>
                          </button>
                          
                          {lesson.hasNotes && (
                            <button className="lesson-action-btn action-notes">
                              <Icon name="file-text" />
                              <span>Notes</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Checkbox status */}
                      <div className="lesson-checkbox-wrapper">
                        <div 
                          className={`lesson-checkbox ${isCompleted ? 'checkbox-checked' : 'checkbox-unchecked'}`} 
                          onClick={() => toggleLesson(lesson.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          {isCompleted && <Icon name="check" />}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
