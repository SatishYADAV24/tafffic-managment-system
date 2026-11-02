# Smart Traffic Command Center Frontend

This frontend turns the existing single-page dashboard into a multi-page command center.

## Pages

- Live Cameras (first page: 4-lane camera wall)
- Dashboard
- Live Monitoring
- Junction Map
- AI Analysis
- Emergency Control
- Traffic History
- Signal Optimization

## Existing FastAPI endpoints used

- `GET /dashboard/overview`
- `GET /dashboard/junctions`
- `GET /dashboard/latest`
- `GET /dashboard/history`
- `GET /dashboard/emergencies`
- `GET /junctions/map`
- `POST /vision/analyze`

The frontend expects FastAPI at:

`http://127.0.0.1:8000`

## Install

If your project already has Vite/React:

```bash
npm install lucide-react react-leaflet leaflet
npm run dev
```

Then replace your existing `src/App.jsx`, `src/main.jsx`, `src/styles.css`, and add:

`src/components/TrafficMap.jsx`

`src/components/CameraView.jsx`

No React Router is required; the sidebar switches views inside the same React app.


## Important: real all-lane CCTV feeds

The new first page displays four lane camera panels:
- North
- South
- East
- West

The panels are intentionally structured as camera slots so you can connect
four real CCTV/IP streams later.

A normal browser webcam (`getUserMedia`) usually represents one physical
camera. It cannot magically provide four independent road-lane cameras.
For a real deployment, each lane should provide its own stream (for example,
RTSP converted to HLS/WebRTC/MJPEG by your backend or a camera gateway).

The existing "Test Camera + AI" button still opens the working browser camera
and sends frames to `/vision/analyze`.
