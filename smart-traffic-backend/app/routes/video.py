from fastapi import APIRouter, UploadFile, File, Form
import os
import shutil

from app.vision.video_detector import track_vehicles
from app.ml.traffic_model import predict_congestion


router = APIRouter(
    prefix="/vision",
    tags=["Video Traffic Analysis"]
)


def calculate_signal(congestion_level: str):

    if congestion_level == "Low":
        return {
            "green_time": 30,
            "yellow_time": 5,
            "red_time": 60,
            "priority": "Low"
        }

    elif congestion_level == "Medium":
        return {
            "green_time": 45,
            "yellow_time": 5,
            "red_time": 50,
            "priority": "Medium"
        }

    elif congestion_level == "High":
        return {
            "green_time": 60,
            "yellow_time": 5,
            "red_time": 40,
            "priority": "High"
        }

    return {
        "green_time": 90,
        "yellow_time": 5,
        "red_time": 30,
        "priority": "Critical"
    }


@router.post("/video-analyze")
async def analyze_video(
    file: UploadFile = File(...),
    junction_id: str = Form(...),
    average_speed: float = Form(...),
    hour: int = Form(...),
    day_of_week: str = Form(...),
    weather: str = Form(...)
):

    os.makedirs("uploads", exist_ok=True)

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    # YOLO tracking
    detection = track_vehicles(
        file_path
    )

    counts = detection["vehicle_counts"]

    vehicle_count = detection[
        "unique_vehicle_count"
    ]

    # ML prediction
    congestion = predict_congestion(
        junction_id=junction_id,
        vehicle_count=vehicle_count,
        cars=counts["cars"],
        bikes=counts["bikes"],
        buses=counts["buses"],
        trucks=counts["trucks"],
        average_speed=average_speed,
        hour=hour,
        day_of_week=day_of_week,
        weather=weather
    )

    # Signal optimization
    signal = calculate_signal(
        congestion
    )

    return {
        "message": "Video traffic analysis completed successfully",

        "video_analysis": {
            "total_frames": detection["total_frames"],
            "unique_vehicle_count": vehicle_count,
            "vehicle_counts": counts
        },

        "traffic_analysis": {
            "junction_id": junction_id,
            "average_speed": average_speed,
            "hour": hour,
            "day_of_week": day_of_week,
            "weather": weather,
            "congestion_level": congestion
        },

        "signal_optimization": signal
    }