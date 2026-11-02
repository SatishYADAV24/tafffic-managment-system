from fastapi import APIRouter, UploadFile, File, Form
import os
import shutil
from datetime import datetime, timezone

from app.vision.vehicle_detector import detect_vehicles
from app.database import db
from app.ml.traffic_model import predict_congestion

from app.routes.signals import (
    calculate_signal_timing
)


router = APIRouter(
    prefix="/vision",
    tags=["Vehicle Detection"]
)


@router.post("/analyze")
async def analyze_traffic(
    file: UploadFile = File(...),
    junction_id: str = Form(...),
    average_speed: float = Form(...),
    hour: int = Form(...),
    day_of_week: str = Form(...),
    weather: str = Form(...)
):

    # -------------------------
    # Create upload folder
    # -------------------------

    os.makedirs(
        "uploads",
        exist_ok=True
    )

    file_path = os.path.join(
        "uploads",
        file.filename
    )

    # -------------------------
    # Save uploaded image
    # -------------------------

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )


    # -------------------------
    # 1. YOLO VEHICLE DETECTION
    # -------------------------

    vehicle_data = detect_vehicles(
        file_path
    )

    vehicle_count = vehicle_data[
        "vehicle_count"
    ]


    # -------------------------
    # 2. ML CONGESTION PREDICTION
    # -------------------------

    congestion_level = predict_congestion(

        junction_id=junction_id,

        vehicle_count=vehicle_count,

        cars=vehicle_data["cars"],

        bikes=vehicle_data["bikes"],

        buses=vehicle_data["buses"],

        trucks=vehicle_data["trucks"],

        average_speed=average_speed,

        hour=hour,

        day_of_week=day_of_week,

        weather=weather
    )


    # -------------------------
    # 3. EMERGENCY DETECTION
    # -------------------------
    #
    # Emergency is detected ONLY
    # by the custom YOLO emergency model.
    #
    # It detects:
    # - ambulance
    # - fire_truck
    # - police
    #
    # Normal cars do NOT trigger
    # emergency priority.
    # -------------------------

    emergency_detected = vehicle_data.get(
        "emergency_detected",
        False
    )

    emergency_type = vehicle_data.get(
        "emergency_type"
    )

    emergency_confidence = vehicle_data.get(
        "emergency_confidence",
        0
    )


    # -------------------------
    # 4. SIGNAL OPTIMIZATION
    # -------------------------

    if emergency_detected:

        signal = {

            "green_time": 120,

            "yellow_time": 5,

            "red_time": 15,

            "priority": "EMERGENCY",

            "emergency_type":
                emergency_type,

            "emergency_direction":
                "North",

            "emergency_confidence":
                emergency_confidence,

            "signal_action": (
                "GREEN priority for "
                "North direction"
            )
        }

    else:

        signal = calculate_signal_timing(
            congestion_level
        )


    # -------------------------
    # 5. SAVE TRAFFIC DATA
    # -------------------------

    traffic_data = {

        "timestamp":
            datetime.now(timezone.utc),

        "junction_id":
            junction_id,

        "vehicle_count":
            vehicle_count,

        "cars":
            vehicle_data["cars"],

        "bikes":
            vehicle_data["bikes"],

        "buses":
            vehicle_data["buses"],

        "trucks":
            vehicle_data["trucks"],

        "average_speed":
            average_speed,

        "hour":
            hour,

        "day_of_week":
            day_of_week,

        "weather":
            weather,

        "congestion_level":
            congestion_level,

        # Emergency information
        "emergency_detected":
            emergency_detected,

        "emergency_type":
            emergency_type,

        "emergency_confidence":
            emergency_confidence
    }


    db["traffic"].insert_one(
        traffic_data
    )


    # -------------------------
    # 6. SAVE SIGNAL OPTIMIZATION
    # -------------------------

    signal_data = {

        "timestamp":
            datetime.now(timezone.utc),

        "junction_id":
            junction_id,

        "vehicle_count":
            vehicle_count,

        "cars":
            vehicle_data["cars"],

        "bikes":
            vehicle_data["bikes"],

        "buses":
            vehicle_data["buses"],

        "trucks":
            vehicle_data["trucks"],

        "average_speed":
            average_speed,

        "hour":
            hour,

        "day_of_week":
            day_of_week,

        "weather":
            weather,

        "congestion_level":
            congestion_level,

        # Emergency information
        "emergency_detected":
            emergency_detected,

        "emergency_type":
            emergency_type,

        "emergency_confidence":
            emergency_confidence,

        # Signal optimization
        **signal
    }


    db["signal_optimizations"].insert_one(
        signal_data
    )


    # -------------------------
    # 7. RESPONSE
    # -------------------------

    return {

        "message": (
            "Emergency signal priority activated"
            if emergency_detected
            else
            "AI traffic analysis completed successfully"
        ),

        "vehicle_detection":
            vehicle_data,

        "traffic_analysis": {

            "junction_id":
                junction_id,

            "average_speed":
                average_speed,

            "hour":
                hour,

            "day_of_week":
                day_of_week,

            "weather":
                weather,

            "congestion_level":
                congestion_level
        },

        "signal_optimization":
            signal
    }