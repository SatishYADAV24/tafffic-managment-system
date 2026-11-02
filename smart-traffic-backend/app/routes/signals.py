from fastapi import APIRouter

from app.models.signal import SignalRequest
from app.database import db
from app.ml.traffic_model import predict_congestion


router = APIRouter(
    prefix="/signals",
    tags=["Signal Optimization"]
)


def calculate_signal_timing(congestion: str):

    if congestion == "Low":
        return {
            "green_time": 30,
            "yellow_time": 5,
            "red_time": 60,
            "priority": "Low"
        }

    elif congestion == "Medium":
        return {
            "green_time": 45,
            "yellow_time": 5,
            "red_time": 50,
            "priority": "Medium"
        }

    elif congestion == "High":
        return {
            "green_time": 60,
            "yellow_time": 5,
            "red_time": 40,
            "priority": "High"
        }

    else:
        return {
            "green_time": 90,
            "yellow_time": 5,
            "red_time": 30,
            "priority": "Critical"
        } 

def get_emergency_priority(junction_id: str):

    emergency = db["emergency_events"].find_one(
        {
            "junction_id": junction_id,
            "status": "EMERGENCY"
        },
        sort=[("_id", -1)]
    )

    if not emergency:
        return None

    return emergency    

@router.post("/optimize")
def optimize_traffic_signal(data: SignalRequest):

    # Predict congestion using the ML model
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
    emergency = get_emergency_priority(
        data.junction_id
    )

    # Calculate signal timing
    if emergency:

        result = {
            "green_time": 120,
            "yellow_time": 5,
            "red_time": 15,
            "priority": "EMERGENCY",
            "emergency_type": emergency["emergency_type"],
            "emergency_direction": emergency["direction"],
            "signal_action": (
                f"GREEN priority for "
                f"{emergency['direction']} direction"
            )
        }

    # Normal AI signal optimization
    else:

        result = calculate_signal_timing(
            congestion
        ) 

    signal_data = {
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
        "congestion_level": congestion,
        **result
        
    }

    # Store optimization result in MongoDB
    db["signal_optimizations"].insert_one(signal_data)

    # Remove MongoDB ObjectId before returning response
    signal_data.pop("_id", None)

    return {
        "message": (
            "Emergency signal priority activated"
            if emergency
            else "Signal timing optimized successfully"
        ),
        "data": signal_data
    } 

@router.get("/optimize/{junction_id}")
def optimize_from_traffic_data(junction_id: str):

    # Get latest traffic record for this junction
    traffic = db["traffic"].find_one(
        {"junction_id": junction_id},
        sort=[("_id", -1)]
    )

    if not traffic:
        return {
            "message": "No traffic data found",
            "junction_id": junction_id
        }

    # Get traffic features
    vehicle_count = traffic.get("vehicle_count", 0)
    cars = traffic.get("cars", 0)
    bikes = traffic.get("bikes", 0)
    buses = traffic.get("buses", 0)
    trucks = traffic.get("trucks", 0)
    average_speed = traffic.get("average_speed", 0)

    hour = traffic.get("hour", 12)
    day_of_week = traffic.get(
        "day_of_week",
        "Monday"
    )
    weather = traffic.get(
        "weather",
        "Sunny"
    )

    # ML congestion prediction
    congestion = predict_congestion(
        junction_id=junction_id,
        vehicle_count=vehicle_count,
        cars=cars,
        bikes=bikes,
        buses=buses,
        trucks=trucks,
        average_speed=average_speed,
        hour=hour,
        day_of_week=day_of_week,
        weather=weather
    )

    # Check for active emergency
    emergency = get_emergency_priority(
        junction_id
    )

    # Emergency signal timing
    if emergency:

        result = {
            "green_time": 120,
            "yellow_time": 5,
            "red_time": 15,
            "priority": "EMERGENCY",

            "emergency_type":
                emergency["emergency_type"],

            "emergency_direction":
                emergency["direction"],

            "signal_action": (
                f"GREEN priority for "
                f"{emergency['direction']} direction"
            )
        }

    # Normal AI signal optimization
    else:

        result = calculate_signal_timing(
            congestion
        )

    signal_data = {
        "junction_id": junction_id,
        "vehicle_count": vehicle_count,
        "cars": cars,
        "bikes": bikes,
        "buses": buses,
        "trucks": trucks,
        "average_speed": average_speed,
        "hour": hour,
        "day_of_week": day_of_week,
        "weather": weather,
        "congestion_level": congestion,
        **result
    }

    # Store result in MongoDB
    db["signal_optimizations"].insert_one(
        signal_data
    )

    # Remove MongoDB ObjectId
    signal_data.pop("_id", None)

    return {
        "message": (
            "Emergency signal priority activated"
            if emergency
            else "AI signal optimized using MongoDB traffic data"
        ),
        "data": signal_data
    }