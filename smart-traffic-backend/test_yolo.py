from app.vision.vehicle_detector import detect_vehicles


image_path = "traffic.jpg"

result = detect_vehicles(image_path)

print("Vehicle Detection Result:")
print(result)