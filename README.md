# Smart Traffic Management System

An AI-powered Smart Traffic Management System that uses computer vision and machine learning to detect vehicles, identify emergency vehicles, predict traffic congestion, and optimize traffic signal timing.

## Project Overview

The system uses live camera feeds to monitor traffic conditions at road junctions. YOLO-based object detection identifies vehicles and emergency vehicles, while a Random Forest classifier predicts congestion levels.

The backend processes traffic data, stores records in MongoDB, and provides APIs to the React dashboard.

## Key Features

- Real-time vehicle detection using YOLO.
- Vehicle classification: cars, bikes, buses and trucks.
- Emergency vehicle detection: ambulance, fire truck and police.
- Traffic congestion prediction using Random Forest.
- AI-based traffic signal timing optimization.
- Live camera monitoring with detection bounding boxes.
- Traffic history and analytics dashboard.
- MongoDB integration for traffic records.
- FastAPI backend and React frontend.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, CSS, JavaScript |
| Backend | Python, FastAPI |
| Computer Vision | YOLO, OpenCV |
| Machine Learning | Random Forest, Scikit-learn |
| Database | MongoDB Atlas |
| Model Training | Ultralytics YOLO |
| API Server | Uvicorn |

## Machine Learning Models

### 1. Normal Vehicle Detection
Uses pretrained YOLO11n to detect and classify normal road vehicles.

### 2. Emergency Vehicle Detection
Uses a custom-trained YOLO model to identify:
- Ambulance
- Fire Truck
- Police Vehicle

### 3. Traffic Congestion Prediction
Uses a Random Forest classifier with traffic parameters such as:
- Vehicle count
- Average speed
- Weather
- Hour of day
- Day of week

The model predicts four congestion levels: Low, Medium, High and Severe.

## Project Structure

```text
Smart-Traffic-Management-System/
│
├── smart-traffic-backend/
│   ├── app/
│   │   ├── ml/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── vision/
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── train_emergency.py
│   └── run.bat
│
├── smart_traffic_frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── styles.css
│   ├── package.json
│   └── index.html
│
└── README.md
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/SatishYADAV24/tafffic-managment-system.git
cd tafffic-managment-system
```

### 2. Backend Setup

```bash
cd smart-traffic-backend

python -m venv venv
```

Activate virtual environment on Windows:

```powershell
.\venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure MongoDB Atlas credentials in a `.env` file. Do not upload this file to GitHub.

### 3. Run Backend

```bash
python -m uvicorn app.main:app --reload
```

Backend API:

`http://127.0.0.1:8000`

API Documentation:

`http://127.0.0.1:8000/docs`

### 4. Frontend Setup

Open another terminal:

```bash
cd smart_traffic_frontend

npm install
npm run dev
```

Open the frontend at:

`http://localhost:5173`

## Future Enhancements

- Integration with physical traffic signal hardware.
- GPS-based emergency vehicle tracking.
- Multi-junction traffic coordination.
- Cloud-based traffic analytics.
- Improved model accuracy with larger datasets.

## Project Information

**Project:** Smart Traffic Management System  
**Domain:** Artificial Intelligence, Machine Learning, Computer Vision and IoT  
**Repository:** https://github.com/SatishYADAV24/tafffic-managment-system

---

*Developed as a B.Tech final-year project.*