from fastapi import APIRouter

from app.models.junction import JunctionCreate
from app.database import db


router = APIRouter(
    prefix="/junctions",
    tags=["Junction Management"]
)


@router.post("/")
def create_junction(data: JunctionCreate):

    junction = {
        "junction_id": data.junction_id,
        "name": data.name,
        "latitude": data.latitude,
        "longitude": data.longitude
    }

    db["junctions"].update_one(
        {"junction_id": data.junction_id},
        {"$set": junction},
        upsert=True
    )

    return {
        "message": "Junction created successfully",
        "data": junction
    }


@router.get("/")
def get_junctions():

    junctions = list(
        db["junctions"].find(
            {},
            {"_id": 0}
        )
    )

    return {
        "count": len(junctions),
        "junctions": junctions
    }


@router.get("/map")
def get_map_data():

    junctions = list(
        db["junctions"].find(
            {},
            {"_id": 0}
        )
    )

    result = []

    for junction in junctions:

        junction_id = junction["junction_id"]

        # Latest traffic record
        traffic = db["traffic"].find_one(
            {"junction_id": junction_id},
            sort=[("_id", -1)]
        )

                # Latest signal optimization
        signal = db["signal_optimizations"].find_one(
            {"junction_id": junction_id},
            sort=[("_id", -1)]
        )

        # Active emergency
        emergency = db["emergency_events"].find_one(
            {
                "junction_id": junction_id,
                "status": "EMERGENCY"
            },
            sort=[("_id", -1)]
        )

        if traffic:

            congestion = traffic.get(
                "congestion_level",
                "Unknown"
            )

            vehicle_count = traffic.get(
                "vehicle_count",
                0
            )

            average_speed = traffic.get(
                "average_speed",
                0
            )

        else:

            congestion = "Unknown"
            vehicle_count = 0
            average_speed = 0

        # Determine map status
        if emergency:

            status = "Emergency"
            priority = "Critical"

        else:

            status = congestion

            if congestion == "Severe":
                priority = "Critical"

            elif congestion == "High":
                priority = "High"

            elif congestion == "Medium":
                priority = "Medium"

            elif congestion == "Low":
                priority = "Low"

            else:
                priority = "Unknown"

        result.append({
            "junction_id": junction_id,
            "name": junction["name"],
            "latitude": junction["latitude"],
            "longitude": junction["longitude"],
            "vehicle_count": vehicle_count,
            "average_speed": average_speed,
            "congestion_level": congestion,
            "status": status,
            "priority": priority,
            "emergency": (
                {
                    "type": emergency["emergency_type"],
                    "direction": emergency["direction"]
                }
                if emergency
                else None
            ),
            "signal": (
                {
                    "green_time": signal.get(
                        "green_time", 0
                    ),
                    "yellow_time": signal.get(
                        "yellow_time", 0
                    ),
                    "red_time": signal.get(
                        "red_time", 0
                    ),
                    "priority": signal.get(
                        "priority", "Normal"
                    )
                }
                if signal
                else None
            )
        })

    return {
        "count": len(result),
        "junctions": result
    }