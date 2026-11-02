from fastapi import APIRouter

from app.database import db


router = APIRouter(
    prefix="/dashboard",
    tags=["Traffic Dashboard"]
)


# =====================================================
# 1. TRAFFIC OVERVIEW
# =====================================================

@router.get("/overview")
def traffic_overview():

    traffic_data = list(
        db["traffic"].find(
            {},
            {"_id": 0}
        )
    )

    if not traffic_data:

        return {
            "message": "No traffic data available",
            "total_junctions": 0,
            "total_vehicles": 0,
            "critical_junctions": 0,
            "high_congestion_junctions": 0,
            "junctions": []
        }

    junctions = {}

    for record in traffic_data:

        junction_id = record["junction_id"]

        # Keep latest record for each junction
        junctions[junction_id] = record

    latest_data = list(
        junctions.values()
    )

    total_vehicles = sum(
        item.get(
            "vehicle_count",
            0
        )
        for item in latest_data
    )

    critical_count = sum(
        1
        for item in latest_data
        if item.get(
            "congestion_level"
        ) == "Severe"
    )

    high_count = sum(
        1
        for item in latest_data
        if item.get(
            "congestion_level"
        ) == "High"
    )

    most_congested = max(
        latest_data,
        key=lambda x:
        x.get(
            "vehicle_count",
            0
        )
    )

    return {

        "total_junctions":
            len(latest_data),

        "total_vehicles":
            total_vehicles,

        "critical_junctions":
            critical_count,

        "high_congestion_junctions":
            high_count,

        "junctions":
            latest_data,

        "most_congested_junction":
            most_congested[
                "junction_id"
            ]
    }


# =====================================================
# 2. JUNCTION STATUS
# =====================================================

@router.get("/junctions")
def get_junction_status():

    traffic_data = list(
        db["traffic"].find(
            {},
            {"_id": 0}
        )
    )

    junctions = {}

    for record in traffic_data:

        junction_id = record[
            "junction_id"
        ]

        # Latest record
        junctions[junction_id] = record

    result = []

    for junction_id, traffic in junctions.items():

        congestion = traffic.get(
            "congestion_level",
            "Unknown"
        )

        # Check emergency
        emergency = db[
            "emergency_events"
        ].find_one(
            {
                "junction_id":
                    junction_id,

                "status":
                    "EMERGENCY"
            }
        )

        if emergency:

            status = "Emergency"

            priority = "Critical"

        else:

            status = congestion

            priority = traffic.get(
                "priority",
                "Normal"
            )

        result.append({

            "junction_id":
                junction_id,

            "vehicle_count":
                traffic.get(
                    "vehicle_count",
                    0
                ),

            "average_speed":
                traffic.get(
                    "average_speed",
                    0
                ),

            "congestion_level":
                congestion,

            "status":
                status,

            "priority":
                priority
        })

    return {

        "count":
            len(result),

        "junctions":
            result
    }


# =====================================================
# 3. LATEST TRAFFIC
# =====================================================

@router.get("/latest")
def get_latest_traffic():

    traffic = db[
        "traffic"
    ].find_one(
        {},
        {"_id": 0},
        sort=[
            ("_id", -1)
        ]
    )

    if not traffic:

        return {

            "message":
                "No traffic data available",

            "data":
                None
        }

    return {

        "data":
            traffic
    }


# =====================================================
# 4. TRAFFIC HISTORY
# =====================================================

# =====================================================
# 4. TRAFFIC HISTORY
# =====================================================

@router.get("/history")
def get_traffic_history():

    traffic_data = list(
        db["traffic"].find(
            {},
            {"_id": 0}
        ).sort(
            "_id",
            1
        )
    )

    if not traffic_data:

        return {
            "count": 0,
            "history": []
        }

    history = []

    for record in traffic_data:

        timestamp = record.get(
            "timestamp"
        )

        history.append({

            "timestamp": (
                timestamp.isoformat()
                if timestamp
                else None
            ),

            "junction_id":
                record.get(
                    "junction_id",
                    "Unknown"
                ),

            "vehicle_count":
                record.get(
                    "vehicle_count",
                    0
                ),

            "cars":
                record.get(
                    "cars",
                    0
                ),

            "bikes":
                record.get(
                    "bikes",
                    0
                ),

            "buses":
                record.get(
                    "buses",
                    0
                ),

            "trucks":
                record.get(
                    "trucks",
                    0
                ),

            "average_speed":
                record.get(
                    "average_speed",
                    0
                ),

            "congestion_level":
                record.get(
                    "congestion_level",
                    "Unknown"
                ),

            "hour":
                record.get(
                    "hour",
                    0
                ),

            "day_of_week":
                record.get(
                    "day_of_week",
                    "Unknown"
                ),

            "weather":
                record.get(
                    "weather",
                    "Unknown"
                )
        })

    return {

        "count":
            len(history),

        "history":
            history
    }


# =====================================================
# 5. ACTIVE EMERGENCIES
# =====================================================

@router.get("/emergencies")
def get_active_emergencies():

    emergencies = list(
        db[
            "emergency_events"
        ].find(
            {
                "status":
                    "EMERGENCY"
            },
            {
                "_id": 0
            }
        )
    )

    return {

        "count":
            len(emergencies),

        "emergencies":
            emergencies
    }