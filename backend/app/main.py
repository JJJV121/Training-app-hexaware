from fastapi import FastAPI

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.course import router as course_router
from app.routers.progress import router as progress_router
from app.routers.dashoboard import router as dashboard_router
from app.routers.schedule import router as schedule_router
from app.routers.assessment_attempt import router as assessment_attempt_router
from app.routers.assessment import router as assessment_router
from app.routers.coding_problem import router as coding_problem_router
from app.routers.coding_test_case import router as coding_test_case_router
from app.routers.coding_submission import router as coding_submission_router
from app.routers.mcq_router import router as mcq_router

app = FastAPI()


app.include_router(assessment_router)
app.include_router(assessment_attempt_router)
app.include_router(coding_problem_router)
app.include_router(coding_test_case_router)
app.include_router(coding_submission_router)
app.include_router(mcq_router)

@app.get("/")
async def health_check():
    return {"status": "running"}