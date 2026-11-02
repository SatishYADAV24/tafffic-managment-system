import random
import pandas as pd

records = []

junctions = ["J001", "J002", "J003", "J004"]
days = [
    "Monday","Tuesday","Wednesday",
    "Thursday","Friday","Saturday","Sunday"
]
weather_options = ["Sunny", "Cloudy", "Rainy"]

for _ in range(5000):

    junction = random.choice(junctions)
    hour = random.randint(0,23)
    day = random.choice(days)
    weather = random.choice(weather_options)

    if hour in [8,9,17,18,19]:
        vehicle_count = random.randint(60,140)
    elif hour in [12,13]:
        vehicle_count = random.randint(35,90)
    else:
        vehicle_count = random.randint(5,60)

    bikes = random.randint(
        int(vehicle_count*0.2),
        int(vehicle_count*0.4)
    )

    cars = random.randint(
        int(vehicle_count*0.4),
        int(vehicle_count*0.6)
    )

    buses = random.randint(1,8)
    trucks = random.randint(1,10)

    average_speed = max(
        10,
        60 - vehicle_count//3
    )

    if weather == "Rainy":
        average_speed -= random.randint(5,10)

    if vehicle_count < 20:
        congestion = "Low"
    elif vehicle_count < 50:
        congestion = "Medium"
    elif vehicle_count < 80:
        congestion = "High"
    else:
        congestion = "Severe"

    records.append({
        "junction_id": junction,
        "vehicle_count": vehicle_count,
        "cars": cars,
        "bikes": bikes,
        "buses": buses,
        "trucks": trucks,
        "average_speed": average_speed,
        "hour": hour,
        "day_of_week": day,
        "weather": weather,
        "congestion": congestion
    })

df = pd.DataFrame(records)

df.to_csv(
    "app/ml/traffic_dataset.csv",
    index=False
)

print("5000-record traffic dataset generated successfully.")