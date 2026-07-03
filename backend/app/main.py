from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.course import router as course_router
from app.routers.progress import router as progress_router
from app.routers.schedule import router as schedule_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.profile import router as profile_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

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


@app.get("/")
async def health_check():
    return {
        "status": "running",
        "message": "Training App API is running successfully"
    }