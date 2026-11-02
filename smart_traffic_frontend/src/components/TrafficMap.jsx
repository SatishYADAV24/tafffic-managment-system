import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API = "http://127.0.0.1:8000";

const createMarker = (status) => {
  let color = "#22c55e";
  if (status === "Medium") color = "#eab308";
  if (status === "High") color = "#f97316";
  if (status === "Severe") color = "#ef4444";
  if (status === "Emergency") color = "#991b1b";

  return L.divIcon({
    className: "traffic-marker",
    html: `
      <div style="
        width:22px;
        height:22px;
        background:${color};
        border:3px solid white;
        border-radius:50%;
        box-shadow:0 2px 8px rgba(0,0,0,.6);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
};

export default function TrafficMap() {
  const [junctions, setJunctions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch(`${API}/junctions/map`);
        if (!response.ok) throw new Error(`Server error: ${response.status}`);
        const data = await response.json();
        setJunctions(data.junctions || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="trafficMap">
      <div className="mapStatusBar">
        {[
          ["#22c55e", "Low"],
          ["#eab308", "Medium"],
          ["#f97316", "High"],
          ["#ef4444", "Severe"],
          ["#991b1b", "Emergency"],
        ].map(([color, label]) => (
          <div className="mapStatusItem" key={label}>
            <span className="mapStatusDot" style={{ background: color }} />
            {label}
          </div>
        ))}
        <div className="junctionCount">{junctions.length} Junctions</div>
      </div>

      {error ? (
        <div className="compactMapError">
          Unable to load junction map
          <br />
          {error}
        </div>
      ) : (
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={12}
          scrollWheelZoom
          className="dashboardMap"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {junctions.map((junction) => (
            <Marker
              key={junction.junction_id}
              position={[junction.latitude, junction.longitude]}
              icon={createMarker(junction.status)}
            >
              <Popup>
                <div className="mapPopup">
                  <h3>🚦 {junction.name || junction.junction_id}</h3>
                  <div className="popupRow">
                    <span>Junction</span>
                    <strong>{junction.junction_id}</strong>
                  </div>
                  <div className="popupRow">
                    <span>Vehicles</span>
                    <strong>{junction.vehicle_count ?? 0}</strong>
                  </div>
                  <div className="popupRow">
                    <span>Speed</span>
                    <strong>{junction.average_speed ?? 0} km/h</strong>
                  </div>
                  <div className="popupRow">
                    <span>Congestion</span>
                    <strong>{junction.congestion_level || "Unknown"}</strong>
                  </div>
                  <div className="popupRow">
                    <span>Priority</span>
                    <strong>{junction.priority || "Normal"}</strong>
                  </div>

                  {junction.signal && (
                    <div className="popupSignal">
                      <strong>🚦 Signal Timing</strong>
                      <div>🟢 Green: {junction.signal.green_time}s</div>
                      <div>🟡 Yellow: {junction.signal.yellow_time}s</div>
                      <div>🔴 Red: {junction.signal.red_time}s</div>
                    </div>
                  )}

                  {junction.emergency && (
                    <div className="popupEmergency">
                      🚨 EMERGENCY ACTIVE
                      <div>Type: {junction.emergency.type}</div>
                      <div>Direction: {junction.emergency.direction}</div>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}
