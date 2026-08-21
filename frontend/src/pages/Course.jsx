import { useState, useEffect, useCallback, useRef } from 'react';
import courseService from '../services/courseService';
import dashboardService from '../services/dashboardService';
import Icon from '../components/Icon';
import '../styles/Course.css';
import Assignment from '../components/Assignment.jsx'
import { qaService } from '../services/qaService';
import { caseStudyService } from '../services/caseStudyService';
import { proctoredTestService } from '../services/proctoredTestService';
import ProctoredTestView from './ProctoredTestView';

// 🌟 Prop Injection: Accept courseId dynamically from DashBoard parent component shell
export default function Course({ courseId, onLockChange }) {
  // Fallback sanity guard: Ensure we have a default ID if undefined or null
  const activeCourseId = courseId || 1;

  // Asynchronous Core Data States
  const [course, setCourse] = useState(null);
  const [rawCourseData, setRawCourseData] = useState(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  // Dynamic User Tracking States
  const userId = Number(localStorage.getItem('logged_in_user_id')) || 1;
  const [currentUnlockedDay, setCurrentUnlockedDay] = useState(1); 
  const [expandedDay, setExpandedDay] = useState(1); 
  const lastValidTime = useRef(0);
  const isSeekingRef = useRef(false);

  // Layout Sub-Views Controllers
  const [activeMainTab, setActiveMainTab] = useState('Content'); 
  const [subView, setSubView] = useState('outline'); 
  const [activeHorizontalTab, setActiveHorizontalTab] = useState('Videos');
  const [selectedLesson, setSelectedLesson] = useState(null);

  // Video Player & Playlist States
  const [unitVideos, setUnitVideos] = useState([]);
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [completedVideos, setCompletedVideos] = useState(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(`course-video-progress-${activeCourseId}-${userId}`);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch (err) {
      console.error('Failed to load persisted video progress:', err);
      return new Set();
    }
  });

  // Progress states
  const [completedLessons, setCompletedLessons] = useState(new Set());
  const [progressPercentage, setProgressPercentage] = useState(0);

const getModuleByDayId = (dayId) => {
  if (!course || dayId === null || dayId === undefined) return null;
  return course.modules.find(module => String(module.id) === String(dayId)) || null;
};

const isDayFullyCompleted = (dayId) => {
  const module = getModuleByDayId(dayId);
  if (!module || !module.lessons.length) return false;
  return module.lessons.every(lesson => completedLessons.has(String(lesson.id)));
};

const getActiveDayDbId = () => {
  if (!course || !course.modules) return null;
  const activeDayNumber = selectedLesson?.dayId || expandedDay || currentUnlockedDay;
  const mod = course.modules.find(m => Number(m.dayNumber) === Number(activeDayNumber)) || course.modules.find(m => Number(m.id) === Number(activeDayNumber));
  return mod ? mod.id : activeDayNumber;
};

const activeDayDbId = getActiveDayDbId();

useEffect(() => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      `course-video-progress-${activeCourseId}-${userId}`,
      JSON.stringify([...completedVideos])
    );
  } catch (err) {
    console.error('Failed to persist video progress:', err);
  }
}, [completedVideos, activeCourseId, userId]);

// Converts Google Drive share/view links into playable direct links for <video>
const normalizeVideoUrl = (url) => {
  if (!url) return '';

  // Match Google Drive file links:
  // https://drive.google.com/file/d/<FILE_ID>/view?usp=drive_link
  const match = url.match(/\/file\/d\/([^/]+)\//);

  if (match && match[1]) {
    return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }

  return url;
};

  // Fetch Structure and Progress from Backend
  const syncCourseProgressAndDashboard = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);

      const dashData = await dashboardService.getDashboardData(userId);
      const activeDay = dashData?.current_course?.current_day || 1;
      setCurrentUnlockedDay(activeDay);

      if (showLoading) {
        setExpandedDay(activeDay);
      }

      const [contentData, progressData] = await Promise.all([
        courseService.getCourseContent(activeCourseId),
        courseService.getCourseProgress(activeCourseId, userId)
      ]);

      setRawCourseData(contentData?.course || contentData);

      const mappedCourse = {
        title: contentData?.course?.title || contentData?.course_name || "Unknown Course",
        totalDays: contentData?.course?.duration_days || contentData?.duration_days || 0,
        modules: (contentData?.days || []).map(day => ({
          id: day.day_id || day.day_number,
          dayNumber: day.day_number,
          title: day.title || `Day ${day.day_number}`,
          dayLabel: `DAY ${day.day_number}`,
          lessons: (day.learning_units || day.units || []).map(unit => ({
            id: unit.unit_id || unit.id,
            title: unit.title || "Untitled Unit",
            duration: unit.duration_mins ? `${unit.duration_mins}m` : "Estimated: 45m",
            type: unit.type || "theory",
            dayId: day.day_id || day.day_number
          }))
        }))
      };

      setCourse(mappedCourse);
      setProgressPercentage(progressData?.progress_percentage || progressData?.percentage || 0); 

if (Array.isArray(progressData?.completed_learning_units)) {
  setCompletedLessons(
    new Set(progressData.completed_learning_units.map(id => String(id)))
  );
} else if (Array.isArray(progressData?.completed_units)) {
  setCompletedLessons(
    new Set(progressData.completed_units.map(id => String(id)))
  );
} else if (progressData?.completed_learning_units) {
  setCompletedLessons(
    new Set([String(progressData.completed_learning_units)])
  );
} else if (progressData?.completed_units && typeof progressData.completed_units !== 'number') {
  setCompletedLessons(
    new Set([String(progressData.completed_units)])
  );
} else {
  setCompletedLessons(new Set());
}

      if (Array.isArray(progressData?.completed_videos)) {
        setCompletedVideos(prev => {
          const next = new Set(prev);
          progressData.completed_videos.forEach(id => next.add(String(id)));
          return next;
        });
      }

    } catch (err) {
      console.error("Failed to fetch course data:", err);
      setError("Failed to load course details. Please try again later.");
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [userId, activeCourseId]);

  useEffect(() => {
    syncCourseProgressAndDashboard(true);
  }, [syncCourseProgressAndDashboard]);

  useEffect(() => {
    if (!isLoading && course) {
      const targetRaw = localStorage.getItem('continue_learning_target');
      if (targetRaw) {
        try {
          const target = JSON.parse(targetRaw);
          if (Number(target.course_id) === Number(activeCourseId)) {
            let targetLesson = null;
            for (const mod of course.modules) {
              const lesson = mod.lessons.find(l => Number(l.id) === Number(target.module_id));
              if (lesson) {
                targetLesson = lesson;
                break;
              }
            }
            if (targetLesson) {
              setExpandedDay(target.day);
              handleLaunchVideoPlayer(targetLesson, 'Videos');
            } else {
              setExpandedDay(target.day);
            }
          }
        } catch (e) {
          console.error("Failed to automatically redirect to lesson module:", e);
        } finally {
          localStorage.removeItem('continue_learning_target');
        }
      }
    }
  }, [isLoading, course, activeCourseId]);

  // Accordion Toggle Handler
  const toggleDayAccordion = (dayId, isLocked) => {
    if (isLocked) return; 
    setExpandedDay(expandedDay === dayId ? null : dayId);
  };

  // Automated Progress Sync
  const triggerLessonCompletion = async (lessonId) => {
    const normalizedLessonId = String(lessonId);
    if (completedLessons.has(normalizedLessonId)) return;

setCompletedLessons(prev => {
  const next = new Set(prev);
  next.add(normalizedLessonId);
  return next;
});

    try {
      await courseService.markUnitComplete(userId, lessonId);
      await syncCourseProgressAndDashboard(false);
    } catch (err) {
      console.error("Failed to sync progress with database:", err);
      setCompletedLessons(prev => {
        const next = new Set(prev);
        next.delete(normalizedLessonId);
        return next;
      });
    }
  };

  // Launch Dynamic Video Player & Initialize Playlist
  const handleLaunchVideoPlayer = async (lesson, fallbackTab = 'Videos') => {
    setSelectedLesson(lesson);
    const titleLower = (lesson?.title || '').toLowerCase();
    const isAssignmentUnit = titleLower.includes('assignment') || titleLower.includes('q&a');
    setActiveHorizontalTab(isAssignmentUnit ? 'Assignment' : fallbackTab);
    setSubView('player');
    setUnitVideos([]); 
    setCurrentVideoUrl('');

    try {
      const progressData = await courseService.getCourseProgress(activeCourseId, userId);
      console.log("Progress Data:", progressData);
      if (Array.isArray(progressData?.completed_videos)) {
        setCompletedVideos(prev => {
          const next = new Set(prev);
          progressData.completed_videos.forEach(id => next.add(String(id)));
          return next;
        });
      }

      const videos = await courseService.getUnitVideos(lesson.id);
      console.log(videos);
      setUnitVideos(videos || []);
      console.log("Video URL:", videos[0].video_url || videos[0].url);
console.log("Normalized URL:", normalizeVideoUrl(videos[0].video_url || videos[0].url));

      if (videos && videos.length > 0) {
        setMaxWatchedTime(0);
        setCurrentVideoUrl(
          normalizeVideoUrl(videos[0].video_url || videos[0].url)
        );
      }
    } catch (err) {
      console.error("Failed to load videos for the learning unit:", err);
    }
  };

  // Unified click/select video mechanism 
  const handleSelectVideo = (targetUrl) => {
    setMaxWatchedTime(0);
    const normalizedUrl = normalizeVideoUrl(targetUrl);

    if (currentVideoUrl === normalizedUrl) {
      const videoEl = document.querySelector('.dashboard-active-video-element');
      if (videoEl) {
        videoEl.currentTime = 0;
        videoEl.play().catch(err => console.log("Playback forced error:", err));
      }
    } else {
      setCurrentVideoUrl(normalizedUrl);
    }
  };
const handleTimeUpdate = (e) => {
    if (!e.target.seeking) {
        lastValidTime.current = e.target.currentTime;
    }
};

const handleSeeking = (e) => {
    if (e.target.currentTime > lastValidTime.current + 1) {
        e.target.currentTime = lastValidTime.current;
    }
};

  // Video End Handler / manual complete handler
  const handleVideoComplete = async () => {
    const currentIndex = unitVideos.findIndex(v => {
      const videoUrl = normalizeVideoUrl(v.video_url || v.url);
      return videoUrl === currentVideoUrl;
    });

    if (currentIndex === -1) return;

    const currentVid = unitVideos[currentIndex];
    const videoId = String(currentVid.id ?? currentVid.video_id ?? currentIndex);

    setCompletedVideos(prev => {
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });

    try {
      if (typeof courseService.markVideoComplete === 'function') {
        await courseService.markVideoComplete(userId, videoId);
      }

      const nextIndex = currentIndex + 1;

      if (nextIndex < unitVideos.length) {
        const nextVid = unitVideos[nextIndex];
        setCurrentVideoUrl(normalizeVideoUrl(nextVid.video_url || nextVid.url));
      } else if (selectedLesson) {
        await triggerLessonCompletion(selectedLesson.id);
      }

      await syncCourseProgressAndDashboard(false);
    } catch (err) {
      console.error('Failed to sync video completion to backend:', err);
    }
  };

  if (isLoading) return <div className="course-viewport-centered-fallback"><h3>Loading Course Details...</h3></div>;
  if (error) return <div className="course-viewport-centered-fallback"><h3 className="error-headline-text">{error}</h3></div>;
  if (!course) return null; 

  if (subView === 'outline') {
    return (
      <div className="course-main-viewport">
        <div className="course-hero-banner">
          <div className="hero-left-block">
            <span className="hero-meta-label">COURSE CONTENT</span>
            <h2 className="hero-main-title">{course.title}</h2>
            <div className="hero-navigation-tabs">
              <button className={`hero-tab-item ${activeMainTab === 'Content' ? 'active-ui-tab' : ''}`} onClick={() => setActiveMainTab('Content')}>Content</button>
              <button className={`hero-tab-item ${activeMainTab === 'Overview' ? 'active-ui-tab' : ''}`} onClick={() => setActiveMainTab('Overview')}>Overview</button>
            </div>
          </div>
          <div className="hero-right-metrics">
            <div className="metric-pill-card">
              <span className="metric-pill-title">PROGRESS</span>
              <span className="metric-pill-digit">{progressPercentage}%</span>
              <div className="metric-pill-track-rail">
                <div className="metric-pill-track-fill" style={{ width: `${progressPercentage}%` }}></div>
              </div>
            </div>
            <div className="metric-pill-card">
              <span className="metric-pill-title">CURRENT DAY</span>
              <span className="metric-pill-digit">{currentUnlockedDay}/{course.totalDays}</span>
            </div>
          </div>
        </div>

        <div className="course-workspace-scroll-area">
          {activeMainTab === 'Content' ? (
            course.modules.map(module => {
              const isLocked = Number(module.id) > Number(currentUnlockedDay);
              const isExpanded = expandedDay === module.id;

              return (
                <div 
                  key={module.id} 
                  className={`module-timeline-group ${isLocked ? 'locked-module' : 'unlocked-module'}`}
                  style={{ 
                    opacity: isLocked ? 0.6 : 1, 
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    marginBottom: '16px',
                    background: isLocked ? 'var(--bg-main)' : 'var(--bg-sidebar)'
                  }}
                >
                  <div 
                    className="module-timeline-header" 
                    onClick={() => toggleDayAccordion(module.id, isLocked)}
                    style={{ 
                      cursor: isLocked ? 'not-allowed' : 'pointer', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '20px',
                      borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div className="module-numeric-badge" style={{ background: isLocked ? 'var(--border-color)' : 'var(--primary-blue)', color: '#fff' }}>
                        {module.id}
                      </div>
                      <div className="module-heading-details">
                        <h3 className="module-primary-title" style={{ color: isLocked ? 'var(--text-medium)' : 'var(--text-dark)', margin: 0 }}>
                          {module.title}
                        </h3>
                        <span className="module-duration-subtitle" style={{ color: 'var(--text-medium)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <Icon name="clock" style={{ width: '14px' }} />
                          <span>{module.dayLabel} • {module.lessons.length} Modules</span>
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {!isLocked && (![1, 2, 16].includes(Number(module.id)) && ![1, 2, 16].includes(Number(module.dayNumber))) && (
                        <button
                          className="action-pill-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedDay(module.id);
                            const firstLesson = module.lessons && module.lessons[0];
                            if (firstLesson) {
                              handleLaunchVideoPlayer(firstLesson, 'Assignment');
                            } else {
                              setSubView('player');
                              setActiveHorizontalTab('Assignment');
                            }
                          }}
                          style={{
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <Icon name="file-text" style={{ width: '14px', height: '14px' }} />
                          <span>Assignment</span>
                        </button>
                      )}
                      {isLocked ? <Icon name="lock" style={{ color: 'var(--text-light)' }} /> : <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} style={{ color: 'var(--primary-blue)' }} />}
                    </div>
                  </div>

                  {isExpanded && !isLocked && (
                    <div className="module-lessons-deck" style={{ padding: '0 20px 20px 20px' }}>
                      {(() => {
                        let isLessonChainBroken = false;

                        return module.lessons.map((lesson, lessonIdx) => {
                          const isCompleted = completedLessons.has(String(lesson.id));
                          let isLessonLocked = false;

                          if (lessonIdx > 0) {
                            if (isLessonChainBroken) {
                              isLessonLocked = true;
                            } else {
                              const prevLesson = module.lessons[lessonIdx - 1];
                              if (!completedLessons.has(String(prevLesson.id))) {
                                isLessonLocked = true;
                                isLessonChainBroken = true;
                              }
                            }
                          }

                          return (
                            <div 
                              key={lesson.id} 
                              className={`lesson-row-interactive-card ${isLessonLocked ? 'locked-lesson' : ''}`} 
                              style={{ 
                                marginTop: '16px', 
                                background: isCompleted ? 'var(--accent-green-light)' : isLessonLocked ? 'var(--bg-main)' : 'var(--bg-sidebar)',
                                opacity: isLessonLocked ? 0.55 : 1,
                                cursor: isLessonLocked ? 'not-allowed' : 'pointer'
                              }}
                            >
                              <div className="lesson-row-meta-left">
                                <h4 className="lesson-row-title" style={{ color: isLessonLocked ? 'var(--text-light)' : 'var(--text-dark)' }}>
                                  {lesson.title}
                                </h4>
                                <span className="lesson-row-duration">{lesson.duration}</span>
                                <div className="lesson-row-action-row">
                                  {(() => {
                                    const titleLower = (lesson.title || '').toLowerCase();
                                    const isAssignmentUnit = titleLower.includes('assignment') || titleLower.includes('q&a');

                                    if (isAssignmentUnit) {
                                      return (
                                        <button 
                                          className="action-pill-btn variant-blue-play" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isLessonLocked) handleLaunchVideoPlayer(lesson, 'Assignment');
                                          }}
                                          disabled={isLessonLocked}
                                          style={{ opacity: isLessonLocked ? 0.6 : 1, backgroundColor: '#2563eb' }}
                                        >
                                          <Icon name="file-text" style={{ marginRight: '6px', width: '14px', height: '14px' }} />
                                          <span>Assignment (3 Questions)</span>
                                        </button>
                                      );
                                    }

                                    return (
                                      <>
                                        <button 
                                          className="action-pill-btn variant-blue-play" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isLessonLocked) handleLaunchVideoPlayer(lesson, 'Videos');
                                          }}
                                          disabled={isLessonLocked}
                                          style={{ opacity: isLessonLocked ? 0.6 : 1 }}
                                        >
                                          <Icon name={isLessonLocked ? "lock" : "play"} style={{ fill: isLessonLocked ? 'transparent' : '#ffffff', marginRight: '4px' }} />
                                          <span>Videos</span>
                                        </button>
                                        <button 
                                          className="variant-secondary-notes" 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (!isLessonLocked) handleLaunchVideoPlayer(lesson, 'Notes');
                                          }}
                                          disabled={isLessonLocked}
                                          style={{ opacity: isLessonLocked ? 0.6 : 1 }}
                                        >
                                          <Icon name="file-text" style={{ marginRight: '4px', width: '14px', height: '14px' }} />
                                          <span>Notes</span>
                                        </button>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="lesson-row-checkbox-right">
                                <div className={`ui-checkbox-node ${isCompleted ? 'state-checked' : 'state-unchecked'}`}>
                                  {isCompleted ? (
                                    <Icon name="check" />
                                  ) : isLessonLocked ? (
                                    <Icon name="lock" style={{ width: '12px', color: 'var(--text-light)' }} />
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="overview-split-layout-grid">
              <div className="overview-informational-card">
                <h3>Course Overview</h3>
                <p className="overview-body-narrative">
                  {rawCourseData?.description || "Master the fundamentals of Java programming with this comprehensive course. Learn everything from basic syntax to advanced concepts like data structures, algorithms, and object-oriented programming."}
                </p>

                <div className="overview-metrics-vertical-stack">
                  <div className="overview-metric-strip-row">
                    <div className="overview-metric-icon-housing"><Icon name="clock" /></div>
                    <div className="overview-metric-meta-details">
                      <span className="overview-metric-meta-label">Duration</span>
                      <span className="overview-metric-meta-value">{course.totalDays} Days • 48 Hours</span>
                    </div>
                  </div>

                  <div className="overview-metric-strip-row">
                    <div className="overview-metric-icon-housing"><Icon name="file-text" /></div>
                    <div className="overview-metric-meta-details">
                      <span className="overview-metric-meta-label">Total Lessons</span>
                      <span className="overview-metric-meta-value">48 Video Lessons</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overview-informational-card">
                <h3>What You'll Learn</h3>
                <div className="overview-curriculum-checklist-deck">
                  {[
                    "Core Java syntax and fundamentals",
                    "Object-oriented programming concepts",
                    "Data structures and algorithms",
                    "Exception handling and debugging",
                    "File I/O and serialization",
                    "Multithreading and concurrency"
                  ].map((curriculumValue, index) => (
                    <div key={index} className="overview-checklist-node-item">
                      <div className="overview-checklist-bullet-node"><Icon name="check" /></div>
                      <span className="overview-checklist-bullet-text">{curriculumValue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="course-main-viewport">
      <div className="video-workspace-banner">
        <button className="video-banner-back-btn" onClick={() => setSubView('outline')}>
<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
          Back to Course
        </button>
        <h2 className="video-banner-title">{course.title}</h2>
        <p className="video-banner-subtitle">{selectedLesson?.title}</p>
      </div>

      <div className="course-workspace-scroll-area">
        {unitVideos.length > 0 && activeHorizontalTab !== 'Assignment' && (
          <div className="video-media-frame-wrapper">
            <div className="video-playback-screen-canvas">
              {currentVideoUrl && (
                <video
                key={currentVideoUrl}
                controls
                className="dashboard-active-video-element"
                autoPlay
                onEnded={handleVideoComplete}
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeeking}
                controlsList="nodownload"
                disablePictureInPicture
                style={{ width: '100%', height: '100%', backgroundColor: '#000' }}
                >
                  <source src={currentVideoUrl} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          </div>
        )}

        <div className="video-content-horizontal-nav-row">
          {['Videos', 'Notes', 'Assignment', 'Quiz', 'Assessment', 'Case Studies'].map((tabName) => (
            <button key={tabName} onClick={() => setActiveHorizontalTab(tabName)} className={`video-horizontal-nav-item ${activeHorizontalTab === tabName ? 'active-nav-pill' : ''}`}>{tabName}</button>
          ))}
        </div>

        <div className="video-dynamic-card-container-wrapper">
          {activeHorizontalTab === 'Videos' && (
            <VideoPlaylist 
              videos={unitVideos}
              currentVideoUrl={currentVideoUrl} 
              onPlayVideo={handleSelectVideo} 
              completedVideos={completedVideos} 
            />
          )}
          {activeHorizontalTab === 'Notes' && <NotesSection learningUnitId={selectedLesson?.id} />}
          {activeHorizontalTab === 'Assignment' && (
            <Assignment
              courseDayId={activeDayDbId}
              userId={userId}
              isUnlocked={expandedDay <= currentUnlockedDay}
              onBackToCourse={() => setSubView('outline')}
            />
          )}
          {activeHorizontalTab === 'Quiz' && (
            <QnASection 
              courseId={activeCourseId} 
              dayId={activeDayDbId} 
            />
          )}
          {activeHorizontalTab === 'Assessment' && (
            <AssessmentTab
              courseDayId={activeDayDbId}
              onLockChange={onLockChange}
            />
          )}
          {activeHorizontalTab === 'Case Studies' && (
            <CaseStudiesSection 
              courseId={activeCourseId} 
              dayId={activeDayDbId} 
            />
          )}
        </div>
      </div>
    </div>
  );
}

function VideoPlaylist({ videos, currentVideoUrl, onPlayVideo, completedVideos }) {
  if (!videos || videos.length === 0) {
    return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-medium)' }}><p>No lecture parts attached.</p></div>;
  }

  let isChainBroken = false;

  return (
    <div className="video-tab-playlist-vertical-stack">
      {videos.map((video, idx) => {
        const targetUrl = video.video_url || video.url;
        const videoId = String(video.id ?? video.video_id ?? idx);

        const prevVideo = idx === 0 ? null : videos[idx - 1];

const prevVideoId = prevVideo
    ? String(prevVideo.id ?? prevVideo.video_id ?? (idx - 1))
    : null;

let isLocked = false;

if (idx > 0) {
    isLocked = !completedVideos.has(prevVideoId);
}

        const isActive = !isLocked && currentVideoUrl === (targetUrl.includes('drive.google.com/file/d/') ? targetUrl.replace(/https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view.*$/, 'https://drive.google.com/uc?export=download&id=$1') : targetUrl);

        return (
          <div 
            key={videoId}
            className={`playlist-card-item ${isActive ? 'selection-active' : ''}`}
            onClick={() => {
              if (!isLocked) onPlayVideo(targetUrl); 
            }} 
            style={{ 
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.5 : 1,
              background: isLocked ? 'var(--bg-main)' : ''
            }}
          >
            <div className="playlist-card-icon-frame"><Icon name={isLocked ? "lock" : "play"} /></div>
            <div className="playlist-card-text-block">
              <h4 className="playlist-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dark)' }}>
                {video.title || `Part ${idx + 1}`}
                {completedVideos.has(videoId) && <Icon name="check" style={{ width: '14px', color: '#16a34a' }} />}
              </h4>
              <p className="playlist-card-meta" style={{ color: 'var(--text-medium)' }}>{isLocked ? 'Complete previous video to unlock' : (video.duration || 'Lecture Video File')}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function NotesSection({ learningUnitId }) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!learningUnitId) return;

    let isMounted = true;
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await courseService.getUnitNotes(learningUnitId);
        if (isMounted) {
          setNotes(data?.content_text || data?.content || '');
        }
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        if (isMounted) setError("Could not load lesson text summaries.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchNotes();
    return () => { isMounted = false; };
  }, [learningUnitId]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-medium)' }}><p>Fetching lesson notes...</p></div>;
  if (error) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}><p>{error}</p></div>;

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: 'var(--text-dark)' }}>
        <Icon name="file-text" style={{ width: '20px', height: '20px' }} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Lesson Notes & Summaries</h3>
      </div>
      {notes ? (
        <div 
          style={{ color: 'var(--text-medium)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}
          dangerouslySetInnerHTML={{ __html: notes }}
        />
      ) : (
        <p style={{ color: 'var(--text-light)', fontStyle: 'italic', margin: 0 }}>No theory text summaries provided for this lesson yet.</p>
      )}
    </div>
  );
}

export function QnASection({ courseId, dayId }) {
  const [mcqs, setMcqs] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || !dayId) return;

    let isMounted = true;
    const fetchMCQs = async () => {
      try {
        setLoading(true);
        setError(null);
        setIsSubmitted(false);
        setSelectedAnswers({});
        const res = await qaService.getDayMCQs(courseId, dayId);
        if (isMounted) {
          setMcqs(res?.mcqs || []);
        }
      } catch (err) {
        console.error("Failed to load MCQ quiz:", err);
        if (isMounted) setError("Could not load quiz questions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMCQs();
    return () => { isMounted = false; };
  }, [courseId, dayId]);

  const handleSelectOption = (questionId, optionIdx) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleReset = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
  };

  const filteredMcqs = mcqs.filter((m) => {
    if (filterDifficulty === 'all') return true;
    return m.difficulty === filterDifficulty;
  });

  const lowCount = mcqs.filter((m) => m.difficulty === 'low').length;
  const mediumCount = mcqs.filter((m) => m.difficulty === 'medium').length;
  const hardCount = mcqs.filter((m) => m.difficulty === 'hard').length;

  const totalAnswered = Object.keys(selectedAnswers).length;
  const correctCount = mcqs.reduce((acc, m) => {
    return selectedAnswers[m.id] === m.correct_index ? acc + 1 : acc;
  }, 0);

  const scorePercentage = mcqs.length > 0 ? Math.round((correctCount / mcqs.length) * 100) : 0;

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-medium)' }}>
        <p style={{ fontWeight: 600 }}>Loading 25 Practice MCQs based on Course Notes & Transcripts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      {/* Quiz Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icon name="help-circle" style={{ width: '22px', height: '22px', color: 'var(--primary-blue)' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              Practice Quiz (25 MCQs)
            </h3>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-medium)' }}>
            Evaluates key concepts from course lecture notes & transcripts across Low, Medium, and Hard difficulties.
          </p>
        </div>

        {/* Retake or Submit Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isSubmitted ? (
            <button
              type="button"
              onClick={handleReset}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-dark)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              🔄 Reset / Retake Quiz
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsSubmitted(true)}
              disabled={totalAnswered === 0}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                backgroundColor: totalAnswered > 0 ? '#2563eb' : '#cbd5e1',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                cursor: totalAnswered > 0 ? 'pointer' : 'not-allowed',
                fontSize: '0.85rem',
                boxShadow: totalAnswered > 0 ? '0 4px 10px rgba(37,99,235,0.25)' : 'none'
              }}
            >
              Submit Quiz ({totalAnswered}/{mcqs.length} Answered)
            </button>
          )}
        </div>
      </div>

      {/* Submitted Score Summary Banner */}
      {isSubmitted && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '12px',
            marginBottom: '20px',
            background: scorePercentage >= 70
              ? 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))'
              : 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(220,38,38,0.1))',
            border: scorePercentage >= 70 ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'

          }}
        >
          <div>
            <h4 style={{ margin: '0 0 2px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-dark)' }}>
              {scorePercentage >= 70 ? '🎉 Excellent Job!' : '💪 Keep Practicing!'}
            </h4>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-medium)' }}>
              You scored <strong>{correctCount}</strong> out of <strong>{mcqs.length}</strong> questions correctly ({scorePercentage}% Accuracy).
            </span>
          </div>
          <div
            style={{
              fontSize: '1.6rem',
              fontWeight: 900,
              color: scorePercentage >= 70 ? '#059669' : '#dc2626'
            }}
          >
            {scorePercentage}%
          </div>
        </div>
      )}

      {/* Difficulty Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {[
          { key: 'all', label: `All Questions (${mcqs.length})` },
          { key: 'low', label: `🟢 Low / Easy (${lowCount})` },
          { key: 'medium', label: `🟡 Medium (${mediumCount})` },
          { key: 'hard', label: `🔴 Hard (${hardCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilterDifficulty(tab.key)}
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: filterDifficulty === tab.key ? '1px solid #2563eb' : '1px solid var(--border-color)',
              backgroundColor: filterDifficulty === tab.key ? 'rgba(37,99,235,0.1)' : 'var(--bg-main)',
              color: filterDifficulty === tab.key ? '#2563eb' : 'var(--text-medium)',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* MCQ Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredMcqs.map((mcq, idx) => {
          const selectedOpt = selectedAnswers[mcq.id];
          const isCorrect = selectedOpt === mcq.correct_index;

          const diffBadgeColor =
            mcq.difficulty === 'low'
              ? { bg: 'rgba(16,185,129,0.12)', text: '#059669', label: 'Low / Easy' }
              : mcq.difficulty === 'medium'
              ? { bg: 'rgba(245,158,11,0.12)', text: '#d97706', label: 'Medium' }
              : { bg: 'rgba(239,68,68,0.12)', text: '#dc2626', label: 'Hard' };

          return (
            <div
              key={mcq.id}
              style={{
                padding: '18px 20px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-main)',
                border: isSubmitted
                  ? isCorrect
                    ? '1px solid rgba(16,185,129,0.5)'
                    : selectedOpt !== undefined
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid var(--border-color)'
                  : '1px solid var(--border-color)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              {/* Question Header & Difficulty Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.5 }}>
                  <span style={{ color: 'var(--primary-blue)', marginRight: '6px' }}>Q{idx + 1}.</span>
                  {mcq.question}
                </h4>
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: diffBadgeColor.bg,
                    color: diffBadgeColor.text,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {diffBadgeColor.label}
                </span>
              </div>

              {/* Options Radio List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mcq.options.map((optText, optIdx) => {
                  const isThisSelected = selectedOpt === optIdx;
                  const isThisCorrectOption = mcq.correct_index === optIdx;

                  let optionBg = 'var(--bg-sidebar)';
                  let optionBorder = 'var(--border-color)';
                  let optionTextColor = 'var(--text-dark)';

                  if (isSubmitted) {
                    if (isThisCorrectOption) {
                      optionBg = 'rgba(16,185,129,0.12)';
                      optionBorder = '#10b981';
                      optionTextColor = '#047857';
                    } else if (isThisSelected && !isThisCorrectOption) {
                      optionBg = 'rgba(239,68,68,0.12)';
                      optionBorder = '#ef4444';
                      optionTextColor = '#b91c1c';
                    }
                  } else if (isThisSelected) {
                    optionBg = 'rgba(37,99,235,0.08)';
                    optionBorder = '#2563eb';
                    optionTextColor = '#1d4ed8';
                  }

                  return (
                    <label
                      key={optIdx}
                      onClick={() => handleSelectOption(mcq.id, optIdx)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${optionBorder}`,
                        backgroundColor: optionBg,
                        color: optionTextColor,
                        cursor: isSubmitted ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '0.875rem',
                        fontWeight: isThisSelected || (isSubmitted && isThisCorrectOption) ? 700 : 500,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name={`mcq-${mcq.id}`}
                        checked={isThisSelected}
                        onChange={() => handleSelectOption(mcq.id, optIdx)}
                        disabled={isSubmitted}
                        style={{ accentColor: '#2563eb', width: '16px', height: '16px' }}
                      />
                      <span>{optText}</span>
                    </label>
                  );
                })}
              </div>

              {/* Collapsible / Auto Technical Explanation Box after submission */}
              {isSubmitted && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(59,130,246,0.06)',
                    border: '1px solid rgba(59,130,246,0.2)',
                    fontSize: '0.825rem',
                    color: 'var(--text-dark)',
                    lineHeight: 1.5
                  }}
                >
                  <span style={{ fontWeight: 800, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    💡 Technical Rationale
                  </span>
                  <span>{mcq.explanation}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


function CaseStudiesSection({ courseId, dayId }) {
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId || !dayId) return;

    let isMounted = true;
    const fetchCaseStudies = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await caseStudyService.getDayCaseStudies(courseId, dayId);
        if (isMounted) {
          setCasesList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Failed to load Case Studies:", err);
        if (isMounted) setError("Could not retrieve case study scenarios.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCaseStudies();
    return () => { isMounted = false; };
  }, [courseId, dayId]);

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-medium)' }}><p>Loading case studies...</p></div>;
  if (error) return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}><p>{error}</p></div>;

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-dark)' }}>
        <Icon name="book-open" style={{ width: '20px', height: '20px' }} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Case Studies</h3>
      </div>

      {casesList.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '16px' }}>
          <p>No case studies assigned for this day yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {casesList.map((item, idx) => (
            <div key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-dark)', fontSize: '16px', fontWeight: '700' }}>
                📂 {item.title}
              </h4>
              
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '4px' }}>BUSINESS SCENARIO:</span>
                <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{item.scenario}</p>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-medium)', display: 'block', marginBottom: '4px' }}>TASK REQUIREMENTS:</span>
                <p style={{ margin: 0, color: 'var(--text-medium)', fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{item.requirements}</p>
              </div>

              {item.total_marks && (
                <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary-blue)' }}>
                  Grade Weight: {item.total_marks} Points
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentSection() {
  return (
    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-medium)', backgroundColor: 'var(--bg-main)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
      <Icon name="file-text" style={{ width: '32px', height: '32px', marginBottom: '16px', opacity: 0.5 }} />
      <h3>Assignments & Code Labs</h3>
      <p style={{ maxWidth: '400px', margin: '0 auto 12px auto', fontSize: '14px', color: 'var(--text-medium)' }}>
        Coding sandbox workspaces and testing suite verifications are currently being developed by our backend engineering team.
      </p>
      <span style={{ fontSize: '11px', textTransform: 'uppercase', padding: '4px 8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', color: 'var(--text-medium)', fontWeight: 'bold' }}>
        Coming Soon
      </span>
    </div>
  );
}

function AssessmentTab({ courseDayId, onLockChange }) {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

  useEffect(() => {
    if (!courseDayId) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const list = await proctoredTestService.getAssessmentsByDay(courseDayId);
        if (mounted) setAssessments(list || []);
      } catch (err) {
        if (mounted) setError(err.response?.data?.detail || 'Unable to load assessments.');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [courseDayId]);

  if (selectedAssessmentId) {
    return (
      <ProctoredTestView
        assessmentId={selectedAssessmentId}
        onBack={() => {
          setSelectedAssessmentId(null);
          onLockChange?.(false);
        }}
      />
    );
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-medium)' }}>Loading assessments...</div>;
  if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626' }}>{error}</div>;

  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg-sidebar)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: 'var(--text-dark)' }}>
        <Icon name="clipboard" style={{ width: '20px', height: '20px' }} />
        <h3 style={{ margin: 0, fontSize: '18px' }}>Assessments</h3>
      </div>
      <p style={{ color: 'var(--text-medium)', marginTop: 0, marginBottom: '20px', fontSize: '14px' }}>
        Assessments scheduled for this training day.
      </p>
      {assessments.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-light)', padding: '32px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
          <Icon name="clipboard" style={{ width: '32px', height: '32px', marginBottom: '12px', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>No assessments scheduled for this day.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {assessments.map((assessment) => (
            <div
              key={assessment.assessment_id}
              style={{
                padding: '22px',
                background: 'var(--bg-main)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div>
                <h3 style={{ margin: '0 0 8px', color: 'var(--text-dark)', fontSize: '16px' }}>{assessment.title}</h3>
                <span style={{ color: 'var(--text-medium)', fontSize: '13px' }}>
                  {assessment.assessment_type} • {assessment.duration_minutes} min • {assessment.total_marks} marks
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedAssessmentId(assessment.assessment_id);
                  onLockChange?.(true);
                }}
                style={{
                  padding: '10px 18px',
                  border: 0,
                  borderRadius: '8px',
                  background: '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Start Assessment
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
