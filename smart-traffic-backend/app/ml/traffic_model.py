import os
import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import LabelEncoder


MODEL_PATH = "app/ml/traffic_model.pkl"
DATASET_PATH = "app/ml/traffic_dataset.csv"


FEATURES = [
    "junction_id",
    "vehicle_count",
    "cars",
    "bikes",
    "buses",
    "trucks",
    "average_speed",
    "hour",
    "day_of_week",
    "weather",
    "traffic_pressure"
]


def calculate_traffic_pressure(
    vehicle_count,
    average_speed,
    weather
):

    # Higher vehicles increase pressure
    vehicle_factor = vehicle_count / 10

    # Lower speed means higher congestion pressure
    if average_speed <= 15:
        speed_factor = 5

    elif average_speed <= 25:
        speed_factor = 4

    elif average_speed <= 35:
        speed_factor = 3

    elif average_speed <= 45:
        speed_factor = 2

    else:
        speed_factor = 1

    # Rainy weather increases traffic pressure
    weather_factor = 1

    if str(weather).lower() in [
        "rainy",
        "storm",
        "heavy rain"
    ]:
        weather_factor = 2

    pressure = (
        vehicle_factor
        + speed_factor
        + weather_factor
    )

    return pressure


def train_model():

    print("Loading traffic dataset...")

    df = pd.read_csv(
        DATASET_PATH
    )

    print(
        f"Dataset size: {len(df)} rows"
    )

    # -------------------------
    # Traffic pressure feature
    # -------------------------

    df["traffic_pressure"] = df.apply(
        lambda row:
        calculate_traffic_pressure(
            row["vehicle_count"],
            row["average_speed"],
            row["weather"]
        ),
        axis=1
    )

    # -------------------------
    # Encode categorical columns
    # -------------------------

    encoders = {}

    categorical_columns = [
        "junction_id",
        "day_of_week",
        "weather"
    ]

    for column in categorical_columns:

        encoder = LabelEncoder()

        df[column] = encoder.fit_transform(
            df[column].astype(str)
        )

        encoders[column] = encoder

    # -------------------------
    # Features
    # -------------------------

    X = df[FEATURES]

    # -------------------------
    # Target
    # -------------------------

    y = df["congestion"]

    # -------------------------
    # Train / test split
    # -------------------------

    X_train, X_test, y_train, y_test = train_test_split(

        X,
        y,

        test_size=0.20,

        random_state=42,

        stratify=y
    )

    # -------------------------
    # Random Forest
    # -------------------------

    model = RandomForestClassifier(

        n_estimators=300,

        max_depth=12,

        min_samples_leaf=2,

        class_weight="balanced",

        random_state=42
    )

    model.fit(
        X_train,
        y_train
    )

    # -------------------------
    # Evaluation
    # -------------------------

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    print(
        f"\nModel accuracy: "
        f"{accuracy:.2f}"
    )

    print("\nClassification Report:")

    print(
        classification_report(
            y_test,
            predictions,
            zero_division=0
        )
    )

    # -------------------------
    # Feature importance
    # -------------------------

    print("\nFeature Importance:")

    importance = pd.Series(
        model.feature_importances_,
        index=FEATURES
    ).sort_values(
        ascending=False
    )

    print(
        importance
    )

    # -------------------------
    # Save model
    # -------------------------

    model_data = {

        "model": model,

        "encoders": encoders,

        "features": FEATURES
    }

    os.makedirs(
        os.path.dirname(MODEL_PATH),
        exist_ok=True
    )

    joblib.dump(
        model_data,
        MODEL_PATH
    )

    print(
        "\nTraffic ML model "
        "saved successfully."
    )

    return model_data


def load_model():

    if not os.path.exists(
        MODEL_PATH
    ):

        return train_model()

    return joblib.load(
        MODEL_PATH
    )


def predict_congestion(

    junction_id: str,

    vehicle_count: int,

    cars: int,

    bikes: int,

    buses: int,

    trucks: int,

    average_speed: float,

    hour: int,

    day_of_week: str,

    weather: str

):

    model_data = load_model()

    model = model_data["model"]

    encoders = model_data["encoders"]

    # -------------------------
    # Safe categorical encoding
    # -------------------------

    junction_encoder = encoders[
        "junction_id"
    ]

    day_encoder = encoders[
        "day_of_week"
    ]

    weather_encoder = encoders[
        "weather"
    ]

    # Junction
    if junction_id in junction_encoder.classes_:

        junction_encoded = junction_encoder.transform(
            [junction_id]
        )[0]

    else:

        junction_encoded = 0

    # Day
    if day_of_week in day_encoder.classes_:

        day_encoded = day_encoder.transform(
            [day_of_week]
        )[0]

    else:

        day_encoded = 0

    # Weather
    if weather in weather_encoder.classes_:

        weather_encoded = weather_encoder.transform(
            [weather]
        )[0]

    else:

        weather_encoded = 0

    # -------------------------
    # Traffic pressure
    # -------------------------

    traffic_pressure = calculate_traffic_pressure(

        vehicle_count,

        average_speed,

        weather
    )

    # -------------------------
    # Input dataframe
    # -------------------------

    input_data = pd.DataFrame([{

        "junction_id":
            junction_encoded,

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

        "average_speed":
            average_speed,

        "hour":
            hour,

        "day_of_week":
            day_encoded,

        "weather":
            weather_encoded,

        "traffic_pressure":
            traffic_pressure
    }])

    # -------------------------
    # ML prediction
    # -------------------------

    prediction = model.predict(
        input_data
    )[0]

    ml_prediction = prediction

    # -------------------------
    # Safety correction layer
    # -------------------------

    # Very low speed + many vehicles
    if (
    average_speed <= 15
    and vehicle_count >= 30
   ):

      prediction = "Severe"


# High traffic:
# Low speed + moderate traffic
    elif (
    average_speed <= 20
    and vehicle_count >= 15
    ):

     prediction = "High"


# Rain makes slow traffic worse
    elif (
    weather.lower() == "rainy"
    and average_speed <= 25
    and vehicle_count >= 10
    ):

     prediction = "Medium"


# Moderate congestion
    elif (
    average_speed <= 30
    and vehicle_count >= 20
    ):

     prediction = "Medium"

    # -------------------------
    # Debug information
    # -------------------------

    print(
        f"\nML Prediction: "
        f"{ml_prediction}"
    )

    print(
        f"Traffic Pressure: "
        f"{traffic_pressure:.2f}"
    )

    print(
        f"Final Congestion: "
        f"{prediction}"
    )

    return prediction