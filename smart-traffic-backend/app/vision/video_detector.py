import cv2
from ultralytics import YOLO


model = YOLO("yolo11n.pt")


VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck"
}


def track_vehicles(video_path: str):

    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        raise ValueError("Could not open video")

    unique_ids = set()

    vehicle_counts = {
        "cars": 0,
        "bikes": 0,
        "buses": 0,
        "trucks": 0
    }

    total_frames = 0

    while True:

        success, frame = cap.read()

        if not success:
            break

        total_frames += 1

        results = model.track(
            frame,
            persist=True,
            verbose=False
        )

        for result in results:

            if result.boxes.id is None:
                continue

            track_ids = result.boxes.id.int().cpu().tolist()
            classes = result.boxes.cls.int().cpu().tolist()

            for track_id, class_id in zip(
                track_ids,
                classes
            ):

                if class_id not in VEHICLE_CLASSES:
                    continue

                # Count only a vehicle ID once
                if track_id not in unique_ids:

                    unique_ids.add(track_id)

                    vehicle_type = VEHICLE_CLASSES[class_id]

                    if vehicle_type == "car":
                        vehicle_counts["cars"] += 1

                    elif vehicle_type == "motorcycle":
                        vehicle_counts["bikes"] += 1

                    elif vehicle_type == "bus":
                        vehicle_counts["buses"] += 1

                    elif vehicle_type == "truck":
                        vehicle_counts["trucks"] += 1

    cap.release()

    total_vehicles = sum(
        vehicle_counts.values()
    )

    return {
        "total_frames": total_frames,
        "unique_vehicle_count": total_vehicles,
        "vehicle_counts": vehicle_counts
    }