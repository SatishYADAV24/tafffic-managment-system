from ultralytics import YOLO
from pathlib import Path


# =====================================================
# MODEL
# =====================================================

model_path = Path(
    "runs/emergency_detector/weights/best.pt"
)


# =====================================================
# TEST IMAGE
# =====================================================

image_path = Path(
    "ambulance.jpg"
)


# =====================================================
# LOAD MODEL
# =====================================================

model = YOLO(
    str(model_path)
)


print()
print("======================================")
print("EMERGENCY MODEL TEST")
print("======================================")
print()

print("Model:")
print(model_path)

print()

print("Classes:")
print(model.names)

print()


# =====================================================
# RUN DETECTION
# =====================================================

results = model.predict(

    source=str(image_path),

    conf=0.30,

    imgsz=640,

    save=True,

    verbose=True
)


# =====================================================
# DISPLAY RESULTS
# =====================================================

for result in results:

    print()
    print("Detected objects:")
    print("--------------------------------------")

    if result.boxes is None:
        print("No objects detected.")
        continue

    if len(result.boxes) == 0:
        print("No objects detected.")
        continue


    for box in result.boxes:

        class_id = int(
            box.cls[0]
        )

        confidence = float(
            box.conf[0]
        )

        class_name = model.names[
            class_id
        ]

        print(
            f"{class_name}: "
            f"{confidence * 100:.1f}%"
        )


print()
print("======================================")
print("TEST COMPLETED")
print("======================================")
print()
print(
    "Annotated result saved inside "
    "runs/detect/"
)