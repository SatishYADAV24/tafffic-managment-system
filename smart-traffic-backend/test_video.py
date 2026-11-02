from app.vision.video_detector import track_vehicles


video_path = "traffic.mp4"

result = track_vehicles(video_path)

print("\nVIDEO ANALYSIS RESULT")
print("=====================")

for key, value in result.items():
    print(f"{key}: {value}")