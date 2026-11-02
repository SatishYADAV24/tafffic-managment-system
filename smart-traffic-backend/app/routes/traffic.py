from fastapi import APIRouter, HTTPException

from app.models.traffic import TrafficData
from app.database import traffic_collection
from app.ml.traffic_model import predict_congestion


router = APIRouter(
    prefix="/traffic",
    tags=["Traffic"]
)


@router.post("/")
def add_traffic(data: TrafficData):

    congestion = predict_congestion(
        junction_id=data.junction_id,
        vehicle_count=data.vehicle_count,
        cars=data.cars,
        bikes=data.bikes,
        buses=data.buses,
        trucks=data.trucks,
        average_speed=data.average_speed,
        hour=data.hour,
        day_of_week=data.day_of_week,
        weather=data.weather
    )

    traffic_record = {
        "junction_id": data.junction_id,
        "vehicle_count": data.vehicle_count,
        "cars": data.cars,
        "bikes": data.bikes,
        "buses": data.buses,
        "trucks": data.trucks,
        "average_speed": data.average_speed,
        "hour": data.hour,
        "day_of_week": data.day_of_week,
        "weather": data.weather,
        "congestion_level": congestion
    }

    traffic_collection.insert_one(
        traffic_record
    )

    traffic_record.pop("_id", None)

    return {
        "message": "Traffic data added successfully",
        "data": traffic_record
    }


@router.get("/")
def get_all_traffic():

    data = list(
        traffic_collection.find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(data),
        "data": data
    }


@router.get("/{junction_id}")
def get_junction_traffic(
    junction_id: str
):

    data = list(
        traffic_collection.find(
            {"junction_id": junction_id},
            {"_id": 0}
        )
    )

    if not data:
        raise HTTPException(
            status_code=404,
            detail="Junction not found"
        )

    return {
        "junction_id": junction_id,
        "data": data
    }