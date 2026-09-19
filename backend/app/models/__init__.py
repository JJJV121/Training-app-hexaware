from app.models.user import User
from app.models.activation_token import ActivationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.login_history import LoginHistory
from app.models.password_history import PasswordHistory

from .note import Note
from app.models.course import Course
from app.models.course_day import CourseDay
from app.models.learning_unit import LearningUnit
from app.models.content import Content
from app.models.video import Video
from app.models.progress import Progress
from app.models.video_progress import VideoProgress
from app.models.lesson_qa import LessonQA
from app.models.enrollment import Enrollment

from app.models.assignment import Assignment
from app.models.coding_problem import CodingProblem
from app.models.hidden_test_case import HiddenTestCase
from app.models.coding_submission import CodingSubmission
from app.models.assignment_submission import AssignmentSubmission

from app.models.course_day_qa import CourseDayQA
from app.models.case_study import CaseStudy

# Trainer Module V2 models
from app.models.batch_models import Batch, BatchTrainee

from app.models.live_session import LiveSession
from app.models.attendance_record import AttendanceRecord, AttendanceStatus
from app.models.messaging import (
    Conversation,
    ConversationParticipant,
    Message,
    Community,
    CommunityMember,
)
from app.models.gamification import (
    UserGamification,
    Badge,
    UserBadge,
    XPLog,
)
from app.models.assessment import (
    Assessment,
    AssessmentQuestion,
    AssessmentOption,
    AssessmentAttempt,
    AssessmentAnswer,
    ProctoringEvent,
    AssessmentType,
    QuestionType,
    AttemptStatus,
)
from app.models.trainee_feedback import TraineeFeedback
from app.models.attendance_followup import (
    AttendanceFollowupRecord,
    AttendanceFollowupAuditLog,
    SystemSetting,
    FollowupStage,
)
from app.models.mcq_bank import MCQQuestionBank
from app.models.notification import Notification
from app.models.candidate_issue import CandidateIssue
from app.models.course_trainee_feedback import CourseTraineeFeedback
from app.models.trainer_evaluation import TrainerEvaluation
from app.models.trainee_report_override import TraineeReportOverride



