from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.course import router as course_router
from app.routers.progress import router as progress_router
from app.routers.schedule import router as schedule_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.note import router as note_router
from app.routers.batch_router import router as batch_router

from app.routers.admin_course import router as admin_course_router
from app.routers.admin_course_assignment import (
    router as admin_course_assignment_router
)
from app.routers.admin_user import router as admin_user_router

from app.routers.coding_problem_router import router as coding_problem_router
from app.routers.submission_router import router as submission_router
from app.routers.assignment import router as assignment_router
from app.routers.assignment_submission import (
    router as assignment_submission_router
)
from app.routers.course_day_qa_router import router as course_day_qa_router
from app.routers.case_study_router import router as case_study_router
from app.routers.generator_router import router as generator_router

from app.database.session import test_connection
from app.utils.index_setup import setup_indexes


app = FastAPI()

app.mount(
    "/assignment_files",
    StaticFiles(directory="assignment_files"),
    name="assignment_files",
)


@app.on_event("startup")
async def startup():
    await test_connection()
    await setup_indexes()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/uploads",
    StaticFiles(directory="app/uploads"),
    name="uploads",
)


# Register routers
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(course_router)
app.include_router(progress_router)
app.include_router(schedule_router)
app.include_router(dashboard_router)
app.include_router(note_router)
app.include_router(batch_router)

app.include_router(admin_course_router)
app.include_router(admin_course_assignment_router)
app.include_router(admin_user_router)

app.include_router(coding_problem_router)
app.include_router(submission_router)
app.include_router(assignment_router)
app.include_router(assignment_submission_router)
app.include_router(course_day_qa_router)
app.include_router(case_study_router)
app.include_router(generator_router)


@app.get("/")
async def health_check():
    return {
        "status": "running",
        "message": "Training App API is running successfully",
    }