from app.database import test_database
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.traffic import router as traffic_router
from app.routes import signals
from app.routes.vision import router as vision_router
from app.routes.video import router as video_router
from app.routes.emergency import router as emergency_router
from app.routes.dashboard import router as dashboard_router
from app.routes.junctions import router as junctions_router


app = FastAPI(
    title="Smart Traffic Management System",
    description="AI-powered traffic monitoring and management backend",
    version="1.0.0"
)

@app.on_event("startup")
def startup_event():
    test_database()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(traffic_router)
app.include_router(signals.router)
app.include_router(vision_router)
app.include_router(video_router)
app.include_router(emergency_router)
app.include_router(dashboard_router)
app.include_router(junctions_router)


@app.get("/")
def root():
    return {
        "message": "Smart Traffic Management System API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }