from fastapi import APIRouter

from app.models.emergency import EmergencyRequest
from app.database import db


router = APIRouter(
    prefix="/emergency",
    tags=["Emergency Priority"]
)


@router.post("/priority")
def emergency_priority(data: EmergencyRequest):

    if not data.detected:
        return {
            "message": "No emergency vehicle detected",
            "data": {
                "junction_id": data.junction_id,
                "status": "NORMAL",
                "priority": "None",
                "signal_action": "Continue normal signal timing"
            }
        }

    emergency_type = data.emergency_type.lower()

    allowed_types = [
        "ambulance",
        "fire_truck",
        "police"
    ]

    if emergency_type not in allowed_types:
        return {
            "message": "Unsupported emergency vehicle type",
            "allowed_types": allowed_types
        }

    emergency_data = {
        "junction_id": data.junction_id,
        "emergency_type": emergency_type,
        "direction": data.direction,
        "status": "EMERGENCY",
        "priority": "CRITICAL",
        "signal_action": (
            f"GREEN signal priority granted to "
            f"{data.direction} direction"
        )
    }

    # Save emergency event
    db["emergency_events"].insert_one(
        emergency_data
    )

    emergency_data.pop("_id", None)

    return {
        "message": "Emergency vehicle priority activated",
        "data": emergency_data
    }


@router.get("/status/{junction_id}")
def emergency_status(junction_id: str):

    emergency = db["emergency_events"].find_one(
        {
            "junction_id": junction_id,
            "status": "EMERGENCY"
        },
        sort=[("_id", -1)]
    )

    if not emergency:
        return {
            "junction_id": junction_id,
            "status": "NORMAL",
            "priority": "None",
            "signal_action": "Normal AI signal timing"
        }

    emergency.pop("_id", None)

    return {
        "junction_id": junction_id,
        "status": emergency["status"],
        "priority": emergency["priority"],
        "emergency_type": emergency["emergency_type"],
        "direction": emergency["direction"],
        "signal_action": emergency["signal_action"]
    }

@router.post("/release/{junction_id}")
def release_emergency(junction_id: str):

    result = db["emergency_events"].update_many(
        {
            "junction_id": junction_id,
            "status": "EMERGENCY"
        },
        {
            "$set": {
                "status": "RELEASED",
                "priority": "None",
                "signal_action": "Return to normal AI signal timing"
            }
        }
    )

    if result.modified_count == 0:
        return {
            "message": "No active emergency found",
            "junction_id": junction_id,
            "status": "NORMAL"
        }

    return {
        "message": "Emergency priority released successfully",
        "junction_id": junction_id,
        "status": "NORMAL",
        "priority": "None",
        "signal_action": "Return to normal AI signal timing"
    }