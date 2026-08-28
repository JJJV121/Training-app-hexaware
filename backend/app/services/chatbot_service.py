"""
Chatbot Service for Hexaware Mavericks Learning Platform.
Provides intelligent, context-aware guidance for Admin and Trainer roles.
"""
from typing import Dict, Any, List

ADMIN_KNOWLEDGE_BASE = [
    {
        "keywords": ["trainer", "add trainer", "create trainer", "onboard trainer", "manage trainer", "trainers"],
        "title": "Trainer Management",
        "answer": "To manage or onboard trainers:\n\n1. Go to **Trainer Management** from the sidebar menu.\n2. Click the **'Add New Trainer'** button at the top right.\n3. Enter the trainer's Full Name, Hexaware Email, Department, and Expertise.\n4. Click **'Save Trainer'**. The trainer will receive credentials to access the Trainer Portal.",
        "action": {"label": "Open Trainer Management", "route": "admin-trainers"}
    },
    {
        "keywords": ["student", "trainee", "add student", "enroll student", "manage student", "students", "user"],
        "title": "Student & Trainee Management",
        "answer": "To manage students or trainees:\n\n1. Navigate to **Student Management** from the sidebar.\n2. You can view all enrolled trainees across batches.\n3. Click **'Add Student'** to manually onboard a student, or bulk import via CSV.\n4. Assign trainees to specific batches to activate their learning path.",
        "action": {"label": "Open Student Management", "route": "admin-students"}
    },
    {
        "keywords": ["course", "create course", "add course", "edit course", "syllabus", "curriculum", "courses"],
        "title": "Course Management",
        "answer": "To build or update learning courses:\n\n1. Open **Course Management** in the core modules.\n2. Click **'Create New Course'** and specify Title, Domain, Code, and Total Hours.\n3. Add Course Modules & Days to define daily topics, Q&As, and study materials.\n4. Use the **'Content Generator'** option to automatically seed syllabus outlines.",
        "action": {"label": "Open Course Management", "route": "admin-courses"}
    },
    {
        "keywords": ["assign course", "course assignment", "map course", "assign trainer to course", "allocation"],
        "title": "Course & Trainer Allocation",
        "answer": "To assign courses to batches or trainers:\n\n1. Navigate to **Course Assignment**.\n2. Select the target **Batch** and desired **Course**.\n3. Choose the **Primary Trainer** responsible for delivery.\n4. Set start & end dates and click **'Confirm Assignment'**.",
        "action": {"label": "Open Course Allocation", "route": "admin-course-assignment"}
    },
    {
        "keywords": ["batch", "create batch", "manage batch", "cohort", "batches"],
        "title": "Batch Management",
        "answer": "To create or configure training cohorts:\n\n1. Go to **Batch Management**.\n2. Click **'Create New Batch'** (e.g. Maverick Java-2026-B1).\n3. Define start date, capacity, and assigned curriculum.\n4. Monitor active status and trainee enrollment statistics.",
        "action": {"label": "Open Batch Management", "route": "admin-batches"}
    },
    {
        "keywords": ["assignment", "assessment", "proctored", "test", "exam", "quiz", "coding problem"],
        "title": "Assignments & Assessments",
        "answer": "To create assignments or proctored assessments:\n\n1. Go to **Assignment & Assessment**.\n2. Choose **'Create Assignment'** or **'Create Proctored Test'**.\n3. Define question parameters, time limits, total marks, and passing threshold.\n4. Publish the test to make it available to designated batches.",
        "action": {"label": "Open Assignments & Tests", "route": "admin-assignments"}
    },
    {
        "keywords": ["schedule", "calendar", "event", "timetable", "class", "time"],
        "title": "Calendar & Schedule",
        "answer": "To manage the master calendar:\n\n1. Open **Calendar & Schedule**.\n2. View upcoming training sessions, proctored test schedules, and holidays.\n3. Click any date slot to add custom schedule events or broadcast schedule updates.",
        "action": {"label": "Open Master Calendar", "route": "admin-calendar"}
    },
    {
        "keywords": ["dashboard", "overview", "metrics", "analytics", "admin overview"],
        "title": "Admin Executive Dashboard",
        "answer": "The **Admin Dashboard** provides high-level organizational analytics:\n\n- Active Trainees & Trainers headcount.\n- Ongoing courses and overall completion rate.\n- Quick overview of pending course allocations and assessment results.",
        "action": {"label": "Go to Admin Dashboard", "route": "admin-dashboard"}
    }
]

TRAINER_KNOWLEDGE_BASE = [
    {
        "keywords": ["grade", "grading", "evaluate", "submission", "evaluate assignment", "mark", "queue"],
        "title": "Grading Queue & Evaluation",
        "answer": "To evaluate student submissions:\n\n1. Navigate to **Grading Queue** from the trainer navigation.\n2. Select pending assignments or coding submissions.\n3. Review student code/files, assign marks, and provide constructive feedback.\n4. Click **'Submit Evaluation'** to release marks to the trainee.",
        "action": {"label": "Open Grading Queue", "route": "grading"}
    },
    {
        "keywords": ["session", "schedule session", "live session", "class", "zoom", "teams", "meeting", "scheduler"],
        "title": "Session Scheduler",
        "answer": "To schedule a live training session:\n\n1. Open **Session Scheduler**.\n2. Click **'Schedule New Session'**.\n3. Fill in Topic, Date, Start Time, Duration, and Meeting URL.\n4. Choose target batch(es) and save. Students will see the join link on their dashboard.",
        "action": {"label": "Open Session Scheduler", "route": "scheduler"}
    },
    {
        "keywords": ["batch", "my batches", "assigned batch", "students in batch", "attendance"],
        "title": "Batch Management for Trainers",
        "answer": "To track your assigned batches:\n\n1. Click **Batch Management** on your sidebar.\n2. View batch lists, trainee rosters, and daily attendance logs.\n3. Update module progress for each day of training.",
        "action": {"label": "Open Batch Management", "route": "batches"}
    },
    {
        "keywords": ["report", "performance", "analytics", "student progress", "scores"],
        "title": "Performance Reports",
        "answer": "To analyze student performance:\n\n1. Go to **Performance Reports**.\n2. Filter by batch, course, or assessment type.\n3. Inspect completion velocity, average scores, and top/bottom performers.\n4. Export performance summary for management reviews.",
        "action": {"label": "Open Performance Reports", "route": "reports"}
    },
    {
        "keywords": ["mentor", "connect", "doubt", "trainee query", "message", "chat"],
        "title": "Mentor Connect & Q&A",
        "answer": "To interact with trainees:\n\n1. Open **Mentor Connect**.\n2. View incoming doubt tickets and direct student messages.\n3. Post answers or schedule 1-on-1 mentoring sessions.",
        "action": {"label": "Open Mentor Connect", "route": "mentor-connect"}
    },
    {
        "keywords": ["overview", "home", "dashboard", "summary"],
        "title": "Trainer Overview Dashboard",
        "answer": "Your **Trainer Overview** gives a snapshot of:\n\n- Active assigned batches and upcoming live sessions.\n- Pending submissions awaiting grading.\n- Trainee attendance and batch progress summary.",
        "action": {"label": "Go to Trainer Overview", "route": "overview"}
    }
]

GENERAL_GUIDANCE = {
    "admin": {
        "greeting": "Hello Admin! I'm your Hexaware AI Assistant. I can help you manage courses, onboard trainers & students, configure batches, or set up proctored assessments.",
        "suggestions": [
            "How do I add a new trainer?",
            "How to create and structure a course?",
            "How to assign courses to batches?",
            "How to create a proctored assessment?",
            "How to manage batches?"
        ]
    },
    "trainer": {
        "greeting": "Hello Trainer! I'm your Hexaware AI Guide. I can assist you with grading submissions, scheduling live sessions, tracking batch progress, and resolving student queries.",
        "suggestions": [
            "How do I evaluate pending assignments?",
            "How to schedule a live training session?",
            "Where can I view student performance reports?",
            "How to track batch attendance & progress?",
            "How to handle mentor connect tickets?"
        ]
    }
}


def process_chatbot_query(query: str, user_role: str = "admin") -> Dict[str, Any]:
    """
    Process user query and return a structured response with contextual guidance & quick actions.
    """
    role = (user_role or "admin").lower()
    kb = ADMIN_KNOWLEDGE_BASE if role == "admin" else TRAINER_KNOWLEDGE_BASE
    query_clean = query.strip().lower()

    # Search for matching knowledge item
    best_match = None
    max_hits = 0

    for item in kb:
        hits = sum(1 for kw in item["keywords"] if kw in query_clean)
        if hits > max_hits:
            max_hits = hits
            best_match = item

    if best_match and max_hits > 0:
        return {
            "status": "success",
            "title": best_match["title"],
            "answer": best_match["answer"],
            "action": best_match.get("action"),
            "role": role
        }

    # Fallback contextual response if no direct match
    if role == "admin":
        answer = (
            f"I see you asked: '{query}'. As an **Admin**, you have full control over the Hexaware Learning Platform.\n\n"
            "Here are common tasks I can help you with:\n"
            "• **Trainer Management**: Add and assign trainers.\n"
            "• **Course Management**: Build curricula, upload modules, and seed daily Q&As.\n"
            "• **Batch & Student Allocations**: Organize trainees into cohorts.\n"
            "• **Assignments & Assessments**: Create coding tests and proctored exams."
        )
        actions = [
            {"label": "Trainers", "route": "admin-trainers"},
            {"label": "Courses", "route": "admin-courses"},
            {"label": "Assignments", "route": "admin-assignments"}
        ]
    else:
        answer = (
            f"I see you asked: '{query}'. As a **Trainer**, here is how you can manage your training pipeline:\n\n"
            "• **Grading Queue**: Evaluate trainee code submissions and assignments.\n"
            "• **Session Scheduler**: Host live interactive webinars or technical workshops.\n"
            "• **Batch Progress**: Monitor cohort attendance and course completion.\n"
            "• **Performance Reports**: Access trainee scores and velocity stats."
        )
        actions = [
            {"label": "Grading Queue", "route": "grading"},
            {"label": "Session Scheduler", "route": "scheduler"},
            {"label": "Performance Reports", "route": "reports"}
        ]

    return {
        "status": "success",
        "title": "Hexaware AI Guidance",
        "answer": answer,
        "action": actions[0] if actions else None,
        "related_actions": actions,
        "role": role
    }


def get_initial_suggestions(user_role: str = "admin") -> Dict[str, Any]:
    role = (user_role or "admin").lower()
    data = GENERAL_GUIDANCE.get(role, GENERAL_GUIDANCE["admin"])
    return {
        "greeting": data["greeting"],
        "suggestions": data["suggestions"],
        "role": role
    }
