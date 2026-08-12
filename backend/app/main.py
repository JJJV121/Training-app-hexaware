from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Existing routers
from app.routers.auth import router as auth_router
from app.routers.course import router as course_router
from app.routers.progress import router as progress_router
from app.routers.schedule import router as schedule_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.profile import router as profile_router
from app.routers.note import router as note_router

# Coding / Assignment routers
from app.routers.coding_problem_router import router as coding_problem_router
from app.routers.submission_router import router as submission_router
from app.routers.assignment import router as assignment_router
from app.routers.assignment_submission import router as assignment_submission_router

# Trainer Analytics
from app.routers.trainer_analytics import (
    router as trainer_analytics_router
)

# Existing trainer / session / attendance routers
from app.routers import trainer
from app.routers import live_session
from app.routers import attendance_record

# Database
from app.database.session import test_connection


app = FastAPI()


# --------------------------------------------------
# Startup
# --------------------------------------------------

@app.on_event("startup")
async def startup():
    await test_connection()


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# Static Files
# --------------------------------------------------

app.mount(
    "/assignment_files",
    StaticFiles(directory="assignment_files"),
    name="assignment_files",
)

app.mount(
    "/uploads",
    StaticFiles(directory="app/uploads"),
    name="uploads",
)


# --------------------------------------------------
# Register Routers
# --------------------------------------------------

# Authentication
app.include_router(auth_router)

# User/Profile
app.include_router(profile_router)

# Course
app.include_router(course_router)

# Progress
app.include_router(progress_router)

# Schedule
app.include_router(schedule_router)

# Dashboard
app.include_router(dashboard_router)

# Notes
app.include_router(note_router)

# Coding Problems
app.include_router(coding_problem_router)

# Coding Problem Submissions
app.include_router(submission_router)

# Assignments
app.include_router(assignment_router)

# Assignment Submissions
app.include_router(assignment_submission_router)

# Trainer
app.include_router(trainer.router)

# Live Sessions
app.include_router(live_session.router)

# Attendance Records
app.include_router(attendance_record.router)

# Trainer Analytics - Member 3
app.include_router(trainer_analytics_router)


# --------------------------------------------------
# Health Check
# --------------------------------------------------

@app.get("/")
async def health_check():
    return {
        "status": "running",
        "message": "Training App API is running successfully"
    }