from ultralytics import YOLO
from pathlib import Path


# =====================================================
# PROJECT PATH
# =====================================================

BASE_DIR = Path(__file__).resolve().parent


# =====================================================
# MODEL
# =====================================================

MODEL_PATH = BASE_DIR / "yolo11n.pt"


# =====================================================
# DATASET
# =====================================================

DATA_PATH = (
    BASE_DIR
    / "emergency_dataset"
    / "data.yaml"
)


# =====================================================
# CHECK FILES
# =====================================================

if not MODEL_PATH.exists():

    raise FileNotFoundError(
        f"Model not found: {MODEL_PATH}"
    )


if not DATA_PATH.exists():

    raise FileNotFoundError(
        f"Dataset not found: {DATA_PATH}"
    )


print()
print("======================================")
print("EMERGENCY VEHICLE MODEL TRAINING")
print("======================================")

print()
print("Model:")
print(MODEL_PATH)

print()
print("Dataset:")
print(DATA_PATH)

print()


# =====================================================
# LOAD YOLO11
# =====================================================

model = YOLO(
    str(MODEL_PATH)
)


# =====================================================
# TRAIN
# =====================================================

results = model.train(

    data=str(DATA_PATH),

    epochs=10,

    imgsz=640,

    batch=8,

    patience=10,

    workers=2,

    project=str(
        BASE_DIR / "runs"
    ),

    name="emergency_detector",

    exist_ok=True,

    pretrained=True,

    verbose=True
)


# =====================================================
# DONE
# =====================================================

print()
print("======================================")
print("TRAINING COMPLETED")
print("======================================")

print()
print(
    "Best model should be here:"
)

print(
    BASE_DIR
    / "runs"
    / "emergency_detector"
    / "weights"
    / "best.pt"
)

print()