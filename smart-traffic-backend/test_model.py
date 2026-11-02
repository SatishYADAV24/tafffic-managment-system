from app.ml.traffic_model import predict_congestion


result = predict_congestion(
    vehicle_count=72,
    average_speed=18
)

print("Predicted congestion:", result)