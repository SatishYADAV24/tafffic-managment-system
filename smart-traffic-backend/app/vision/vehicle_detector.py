from ultralytics import YOLO
from pathlib import Path


# =====================================================
# MODEL PATHS
# =====================================================

BASE_DIR = Path(__file__).resolve().parents[2]

NORMAL_MODEL_PATH = (
    BASE_DIR / "yolo11n.pt"
)

EMERGENCY_MODEL_PATH = (
    BASE_DIR
    / "runs"
    / "emergency_detector"
    / "weights"
    / "best.pt"
)


# =====================================================
# LOAD MODELS ONCE
# =====================================================

normal_model = YOLO(
    str(NORMAL_MODEL_PATH)
)

emergency_model = YOLO(
    str(EMERGENCY_MODEL_PATH)
)


# =====================================================
# NORMAL VEHICLE CLASSES
# =====================================================

NORMAL_CLASSES = {
    "car": "cars",
    "motorcycle": "bikes",
    "bus": "buses",
    "truck": "trucks"
}


# =====================================================
# EMERGENCY CLASSES
# =====================================================

EMERGENCY_CLASSES = {
    "ambulance",
    "fire_truck",
    "police"
}


# =====================================================
# CONFIDENCE
# =====================================================

NORMAL_CONFIDENCE = 0.30

EMERGENCY_CONFIDENCE = 0.60


# =====================================================
# VEHICLE DETECTION
# =====================================================

def detect_vehicles(image_path):

    # -------------------------------------------------
    # NORMAL VEHICLE MODEL
    # -------------------------------------------------

    normal_results = normal_model.predict(
        source=image_path,
        conf=NORMAL_CONFIDENCE,
        imgsz=640,
        verbose=False
    )


    cars = 0
    bikes = 0
    buses = 0
    trucks = 0

    detections = []


    for result in normal_results:

        if result.boxes is None:
            continue


        for box in result.boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )

            class_name = normal_model.names[
                class_id
            ]


            category = NORMAL_CLASSES.get(
                class_name
            )


            if category == "cars":
                cars += 1

            elif category == "bikes":
                bikes += 1

            elif category == "buses":
                buses += 1

            elif category == "trucks":
                trucks += 1


            # -----------------------------------------
            # BOUNDING BOX
            # -----------------------------------------

            x1, y1, x2, y2 = (
                box.xyxy[0].tolist()
            )


            detections.append({

                "class_name":
                    class_name,

                "category":
                    category or class_name,

                "confidence":
                    round(
                        confidence,
                        3
                    ),

                "x1":
                    round(x1, 2),

                "y1":
                    round(y1, 2),

                "x2":
                    round(x2, 2),

                "y2":
                    round(y2, 2)

            })


    vehicle_count = (
        cars +
        bikes +
        buses +
        trucks
    )


    # =================================================
    # EMERGENCY MODEL
    # =================================================

    emergency_detections = []

    emergency_detected = False

    emergency_type = None

    emergency_confidence = 0.0


    emergency_results = (
        emergency_model.predict(

            source=image_path,

            conf=EMERGENCY_CONFIDENCE,

            imgsz=640,

            verbose=False

        )
    )


    for result in emergency_results:

        if result.boxes is None:
            continue


        for box in result.boxes:

            class_id = int(
                box.cls[0]
            )

            confidence = float(
                box.conf[0]
            )

            class_name = (
                emergency_model.names[
                    class_id
                ]
            )


            # -----------------------------------------
            # ONLY EMERGENCY CLASSES
            # -----------------------------------------

            if (
                class_name
                not in EMERGENCY_CLASSES
            ):
                continue


            if (
                confidence
                < EMERGENCY_CONFIDENCE
            ):
                continue


            x1, y1, x2, y2 = (
                box.xyxy[0].tolist()
            )


            emergency_detections.append({

                "class_name":
                    class_name,

                "confidence":
                    round(
                        confidence,
                        3
                    ),

                "x1":
                    round(x1, 2),

                "y1":
                    round(y1, 2),

                "x2":
                    round(x2, 2),

                "y2":
                    round(y2, 2)

            })


            # -----------------------------------------
            # EMERGENCY FOUND
            # -----------------------------------------

            emergency_detected = True


            # Keep highest confidence
            if (
                confidence
                > emergency_confidence
            ):

                emergency_confidence = (
                    confidence
                )

                emergency_type = (
                    class_name
                )


    # =================================================
    # RETURN
    # =================================================

    return {

        "vehicle_count":
            vehicle_count,

        "cars":
            cars,

        "bikes":
            bikes,

        "buses":
            buses,

        "trucks":
            trucks,

        "detections":
            detections,

        "emergency_detected":
            emergency_detected,

        "emergency_type":
            emergency_type,

        "emergency_confidence":
            round(
                emergency_confidence,
                3
            ),

        "emergency_detections":
            emergency_detections

    }