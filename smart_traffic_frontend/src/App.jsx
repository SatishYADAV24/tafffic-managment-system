import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Camera,
  Car,
  ChevronRight,
  Clock3,
  Gauge,
  LayoutDashboard,
  Map,
  Menu,
  Radio,
  Route,
  Settings2,
  Siren,
  TrafficCone,
  X,
  Zap,
} from "lucide-react";

import TrafficMap from "./components/TrafficMap";
import CameraView from "./components/CameraView";
import "./styles.css";

const API = "http://127.0.0.1:8000";

const navItems = [
  { id: "monitoring", label: "Live Cameras", icon: Camera },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "map", label: "Junction Map", icon: Map },
  { id: "ai", label: "AI Analysis", icon: Activity },
  { id: "emergency", label: "Emergency Control", icon: Siren },
  { id: "history", label: "Traffic History", icon: BarChart3 },
  { id: "signals", label: "Signal Optimization", icon: TrafficCone },
];

async function getJson(path) {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) {
    throw new Error(`Server error: ${response.status}`);
  }
  return response.json();
}

function App() {
  // First screen is the live multi-lane camera wall.
  const [page, setPage] = useState("monitoring");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedJunction, setSelectedJunction] = useState("J003");
  const [cameraOpen, setCameraOpen] = useState(false);

  const [overview, setOverview] = useState(null);
  const [junctions, setJunctions] = useState([]);
  const [latest, setLatest] = useState(null);
  const [emergencies, setEmergencies] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const loadData = async () => {
    try {
      const [overviewData, junctionData, latestData, emergencyData, historyData] =
        await Promise.all([
          getJson("/dashboard/overview"),
          getJson("/dashboard/junctions"),
          getJson("/dashboard/latest"),
          getJson("/dashboard/emergencies"),
          getJson("/dashboard/history"),
        ]);

      setOverview(overviewData);
      setJunctions(junctionData.junctions || []);
      setLatest(latestData.data || null);
      setEmergencies(emergencyData.emergencies || []);
      setHistory(historyData.history || []);
      setApiError("");
    } catch (error) {
      console.error(error);
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeEmergency = emergencies[0] || null;

  const openMonitoring = (junctionId) => {
    setSelectedJunction(junctionId || selectedJunction);
    setPage("monitoring");
    setSidebarOpen(false);
  };

  const openCamera = (junctionId) => {
    setSelectedJunction(junctionId || selectedJunction);
    setCameraOpen(true);
  };

  const renderPage = () => {
    if (loading && page !== "monitoring") {
      return <LoadingState />;
    }

    switch (page) {
      case "dashboard":
        return (
          <DashboardPage
            overview={overview}
            junctions={junctions}
            emergencies={emergencies}
            latest={latest}
            onNavigate={setPage}
            onMonitoring={openMonitoring}
            onCamera={openCamera}
          />
        );

      case "monitoring":
        return (
          <LiveMonitoringPage
            junctions={junctions}
            selectedJunction={selectedJunction}
            setSelectedJunction={setSelectedJunction}
            onCamera={openCamera}
          />
        );

      case "map":
        return (
          <MapPage
            onMonitoring={openMonitoring}
            onCamera={openCamera}
          />
        );

      case "ai":
        return (
          <AIAnalysisPage
            latest={latest}
            junctions={junctions}
            history={history}
            onCamera={openCamera}
          />
        );

      case "emergency":
        return (
          <EmergencyPage
            emergencies={emergencies}
            junctions={junctions}
            onMonitoring={openMonitoring}
            onCamera={openCamera}
          />
        );

      case "history":
        return <HistoryPage history={history} />;

      case "signals":
        return (
          <SignalPage
            junctions={junctions}
            onMonitoring={openMonitoring}
          />
        );

      default:
        return null;
    }
  };

  const currentNav =
    navItems.find((item) => item.id === page) || navItems[0];

  return (
    <div className="appShell">
      <aside className={`sidebar ${sidebarOpen ? "sidebarOpen" : ""}`}>
        <div className="brand">
          <div className="brandIcon">
            <TrafficCone size={22} />
          </div>
          <div>
            <div className="brandTitle">SMART TRAFFIC</div>
            <div className="brandSub">AI COMMAND CENTER</div>
          </div>
          <button
            className="mobileClose"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="navSectionLabel">CONTROL CENTER</div>

        <nav className="sidebarNav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;

            return (
              <button
                key={item.id}
                className={`navButton ${active ? "active" : ""}`}
                onClick={() => {
                  setPage(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {active && <ChevronRight size={15} className="navArrow" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebarBottom">
          <div className="systemCard">
            <div className="systemCardTop">
              <span className="statusPulse" />
              SYSTEM ONLINE
            </div>
            <div className="systemText">
              YOLO + ML + MongoDB connected
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebarOverlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <main className="mainArea">
        <header className="topbar">
          <button
            className="mobileMenu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div>
            <div className="breadcrumb">CONTROL CENTER / {currentNav.label}</div>
            <h1>{currentNav.label}</h1>
          </div>

          <div className="topbarRight">
            <div className="liveStatus">
              <span className="statusPulse" />
              LIVE
            </div>
            <div className="apiStatus">
              {apiError ? "API OFFLINE" : "API CONNECTED"}
            </div>
          </div>
        </header>

        {apiError && (
          <div className="apiWarning">
            <AlertTriangle size={17} />
            <span>
              Backend connection problem: {apiError}. Start FastAPI on
              http://127.0.0.1:8000
            </span>
          </div>
        )}

        <section className="pageContent">{renderPage()}</section>
      </main>

      {cameraOpen && (
        <CameraView
          junctionId={selectedJunction}
          onClose={() => setCameraOpen(false)}
          onAnalysis={loadData}
        />
      )}

      {activeEmergency && (
        <button
          className="floatingEmergency"
          onClick={() => setPage("emergency")}
        >
          <Siren size={18} />
          <span>
            EMERGENCY ACTIVE
            <small>
              {activeEmergency.emergency_type || activeEmergency.type || "Emergency"} ·{" "}
              {activeEmergency.direction || "Priority"}
            </small>
          </span>
        </button>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="emptyState large">
      <div className="loadingSpinner" />
      <h3>Loading command center</h3>
      <p>Connecting to traffic intelligence services...</p>
    </div>
  );
}

function DashboardPage({
  overview,
  junctions,
  emergencies,
  latest,
  onNavigate,
  onMonitoring,
  onCamera,
}) {
  const totalVehicles = overview?.total_vehicles || 0;
  const totalJunctions = overview?.total_junctions || 0;
  const high = overview?.high_congestion_junctions || 0;
  const severe = overview?.critical_junctions || 0;

  return (
    <div className="pageStack">
      <div className="heroPanel">
        <div>
          <div className="eyebrow">
            <Radio size={14} />
            REAL-TIME TRAFFIC INTELLIGENCE
          </div>
          <h2>Smart Traffic Command Center</h2>
          <p>
            Monitor junctions, analyze camera traffic with YOLO, predict
            congestion with ML, and activate emergency signal priority.
          </p>
        </div>

        <button className="primaryButton" onClick={() => onCamera("J003")}>
          <Camera size={17} />
          Open Live Camera
        </button>
      </div>

      <div className="metricGrid">
        <MetricCard
          icon={<Map size={19} />}
          label="Monitored Junctions"
          value={totalJunctions}
          detail="Live locations"
        />
        <MetricCard
          icon={<Car size={19} />}
          label="Vehicles"
          value={totalVehicles}
          detail="Latest junction snapshot"
        />
        <MetricCard
          icon={<AlertTriangle size={19} />}
          label="High Congestion"
          value={high}
          detail="Junctions requiring attention"
          danger={high > 0}
        />
        <MetricCard
          icon={<Siren size={19} />}
          label="Emergency"
          value={emergencies.length}
          detail="Active priority events"
          danger={emergencies.length > 0}
        />
      </div>

      <div className="sectionHeader">
        <div>
          <div className="sectionEyebrow">OPERATIONS</div>
          <h2>Junction Status</h2>
        </div>
        <button className="textButton" onClick={() => onNavigate("map")}>
          Open full map <ChevronRight size={15} />
        </button>
      </div>

      <div className="junctionGrid">
        {junctions.map((junction) => (
          <JunctionCard
            key={junction.junction_id}
            junction={junction}
            onOpen={() => onMonitoring(junction.junction_id)}
            onCamera={() => onCamera(junction.junction_id)}
          />
        ))}
      </div>

      <div className="dashboardColumns">
        <div className="panel">
          <PanelHeader
            title="Latest AI Analysis"
            icon={<Activity size={18} />}
            action="AI Analysis"
            onAction={() => onNavigate("ai")}
          />

          {latest ? (
            <div className="latestAnalysis">
              <div className="latestMain">
                <span className="mutedLabel">JUNCTION</span>
                <strong>{latest.junction_id}</strong>
                <StatusBadge status={latest.congestion_level} />
              </div>

              <div className="miniStats">
                <MiniStat label="Vehicles" value={latest.vehicle_count} />
                <MiniStat
                  label="Speed"
                  value={`${latest.average_speed} km/h`}
                />
                <MiniStat label="Weather" value={latest.weather} />
                <MiniStat label="Hour" value={`${latest.hour}:00`} />
              </div>
            </div>
          ) : (
            <EmptyText text="No analysis data available yet." />
          )}
        </div>

        <div className="panel">
          <PanelHeader
            title="Emergency Control"
            icon={<Siren size={18} />}
            action="Open control"
            onAction={() => onNavigate("emergency")}
          />

          {emergencies.length ? (
            <div className="emergencyPreview">
              {emergencies.slice(0, 2).map((emergency, index) => (
                <div className="emergencyRow" key={emergency._id || index}>
                  <div className="emergencyIcon">
                    <Siren size={18} />
                  </div>
                  <div className="emergencyInfo">
                    <strong>
                      {emergency.emergency_type || emergency.type || "Emergency"}
                    </strong>
                    <span>
                      {emergency.junction_id} ·{" "}
                      {emergency.direction || "Priority direction"}
                    </span>
                  </div>
                  <span className="criticalPill">CRITICAL</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="safeState">
              <span className="safeIcon">✓</span>
              No active emergency events
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LiveMonitoringPage({
  junctions,
  selectedJunction,
  setSelectedJunction,
  onCamera,
}) {
  const lanes = [
    { id: "lane-north", label: "NORTH LANE", direction: "North", camera: "CAM-01" },
    { id: "lane-south", label: "SOUTH LANE", direction: "South", camera: "CAM-02" },
    { id: "lane-east", label: "EAST LANE", direction: "East", camera: "CAM-03" },
    { id: "lane-west", label: "WEST LANE", direction: "West", camera: "CAM-04" },
  ];

  return (
    <div className="pageStack">
      <div className="cameraWallHero">
        <div>
          <div className="eyebrow">
            <span className="statusPulse" />
            LIVE CAMERA WALL · ALL LANES
          </div>
          <h2>Junction Camera Command View</h2>
          <p>
            Monitor every approach lane from one screen. Each camera tile can
            be connected to its own CCTV/IP stream and analyzed by YOLO.
          </p>
        </div>

        <div className="cameraWallControls">
          <select
            value={selectedJunction}
            onChange={(e) => setSelectedJunction(e.target.value)}
          >
            {junctions.length ? (
              junctions.map((junction) => (
                <option key={junction.junction_id} value={junction.junction_id}>
                  {junction.junction_id}
                </option>
              ))
            ) : (
              <option value="J003">J003</option>
            )}
          </select>

          <button
            className="primaryButton"
            onClick={() => onCamera(selectedJunction)}
          >
            <Camera size={17} />
            Test Camera + AI
          </button>
        </div>
      </div>

      <div className="cameraWall">
        {lanes.map((lane, index) => (
          <LaneCameraCard
            key={lane.id}
            lane={lane}
            laneNumber={index + 1}
            junctionId={selectedJunction}
            onOpen={() => onCamera(selectedJunction)}
          />
        ))}
      </div>

      <div className="cameraWallLegend">
        <div className="cameraLegendItem">
          <span className="legendLiveDot" />
          <strong>LIVE</strong>
          <span>Camera stream active</span>
        </div>
        <div className="cameraLegendItem">
          <span className="legendAiDot" />
          <strong>AI READY</strong>
          <span>YOLO vehicle detection available</span>
        </div>
        <div className="cameraLegendItem">
          <Activity size={15} />
          <strong>ML</strong>
          <span>Congestion prediction after frame analysis</span>
        </div>
      </div>

      <div className="panel">
        <PanelHeader title="How the camera wall works" icon={<Activity size={18} />} />
        <div className="pipeline">
          <PipelineStep number="01" title="CCTV / IP Camera" text="One feed per lane" icon={<Camera size={19} />} />
          <div className="pipelineArrow">→</div>
          <PipelineStep number="02" title="YOLO" text="Counts vehicles" icon={<Car size={19} />} />
          <div className="pipelineArrow">→</div>
          <PipelineStep number="03" title="ML" text="Predicts congestion" icon={<Activity size={19} />} />
          <div className="pipelineArrow">→</div>
          <PipelineStep number="04" title="Signal" text="Optimizes timing" icon={<TrafficCone size={19} />} />
          <div className="pipelineArrow">→</div>
          <PipelineStep number="05" title="Emergency" text="Priority override" icon={<Siren size={19} />} />
        </div>
      </div>
    </div>
  );
}

function LaneCameraCard({ lane, laneNumber, junctionId, onOpen }) {
  return (
    <div className="laneCameraCard">
      <div className="laneCameraHeader">
        <div>
          <span className="laneNumber">CAM {String(laneNumber).padStart(2, "0")}</span>
          <strong>{lane.label}</strong>
          <span>{junctionId} · {lane.direction}</span>
        </div>
        <div className="laneLiveBadge">
          <span />
          LIVE
        </div>
      </div>

      <div className="laneVideo">
        <div className="laneGridOverlay" />
        <div className="cameraPlaceholder">
          <Camera size={30} />
          <strong>{lane.camera}</strong>
          <span>Lane camera feed</span>
          <button className="smallButton blue" onClick={onOpen}>
            Open / Test Camera
          </button>
        </div>

        <div className="laneTopLabel">{lane.direction.toUpperCase()}</div>
        <div className="laneBottomLabel">
          <span className="recordingDot" />
          AI MONITORING
        </div>
      </div>

      <div className="laneCameraStats">
        <div>
          <span>VEHICLES</span>
          <strong>--</strong>
        </div>
        <div>
          <span>SPEED</span>
          <strong>-- km/h</strong>
        </div>
        <div>
          <span>STATUS</span>
          <strong className="waitingText">WAITING</strong>
        </div>
      </div>
    </div>
  );
}

function MapPage({ onMonitoring, onCamera }) {
  return (
    <div className="pageStack">
      <PageIntro
        eyebrow="GEO MONITORING"
        title="Live Junction Map"
        text="Every monitored junction is represented on the map with a color-coded traffic state."
      />

      <div className="fullMapPanel">
        <TrafficMap />
      </div>

      <div className="infoBanner">
        <Map size={19} />
        <div>
          <strong>How to demonstrate this page</strong>
          <span>
            Click a junction marker to show its vehicle count, congestion,
            priority, signal timing, and emergency state. Then open Live
            Monitoring to prove the camera is feeding the AI pipeline.
          </span>
        </div>
      </div>
    </div>
  );
}

function AIAnalysisPage({ latest, junctions, history, onCamera }) {
  const source = latest || {};
  const total =
    source.vehicle_count ||
    junctions.reduce((sum, item) => sum + (item.vehicle_count || 0), 0);

  return (
    <div className="pageStack">
      <PageIntro
        eyebrow="ARTIFICIAL INTELLIGENCE"
        title="AI Traffic Analysis"
        text="This page explains the complete computer-vision and machine-learning decision pipeline."
      />

      <Pipeline />

      <div className="metricGrid compact">
        <MetricCard icon={<Car size={19} />} label="Vehicles" value={total} />
        <MetricCard
          icon={<Gauge size={19} />}
          label="Average Speed"
          value={source.average_speed ? `${source.average_speed} km/h` : "--"}
        />
        <MetricCard
          icon={<Activity size={19} />}
          label="Congestion"
          value={source.congestion_level || "--"}
        />
        <MetricCard
          icon={<Clock3 size={19} />}
          label="Observation"
          value={source.hour !== undefined ? `${source.hour}:00` : "--"}
        />
      </div>

      <div className="dashboardColumns">
        <div className="panel">
          <PanelHeader title="Latest Model Decision" icon={<Activity size={18} />} />
          <div className="decisionBox">
            <span>JUNCTION</span>
            <strong>{source.junction_id || "--"}</strong>
            <StatusBadge status={source.congestion_level || "Unknown"} />
            <p>
              The detected traffic features are passed into the Random Forest
              congestion model. The predicted class is then used by signal
              optimization.
            </p>
          </div>
        </div>

        <div className="panel">
          <PanelHeader title="Camera Proof" icon={<Camera size={18} />} />
          <p className="panelText">
            Open the camera during your viva to show that the system captures
            real frames and sends them to the YOLO vehicle detector.
          </p>
          <button className="primaryButton" onClick={() => onCamera(source.junction_id || "J003")}>
            <Camera size={17} />
            Demonstrate Live AI
          </button>
        </div>
      </div>

      <div className="panel">
        <PanelHeader title="Recent Predictions" icon={<BarChart3 size={18} />} />
        <HistoryTable rows={history.slice(-8).reverse()} />
      </div>
    </div>
  );
}

function EmergencyPage({ emergencies, junctions, onMonitoring, onCamera }) {
  return (
    <div className="pageStack">
      <PageIntro
        eyebrow="PRIORITY RESPONSE"
        title="Emergency Control"
        text="Emergency events override normal signal timing and give priority to the affected direction."
      />

      {emergencies.length ? (
        <div className="emergencyHero">
          <div className="emergencyHeroIcon">
            <Siren size={34} />
          </div>
          <div>
            <div className="criticalLabel">EMERGENCY SIGNAL PRIORITY ACTIVE</div>
            <h2>
              {emergencies[0].emergency_type ||
                emergencies[0].type ||
                "Emergency vehicle"}
            </h2>
            <p>
              Junction {emergencies[0].junction_id} · Direction{" "}
              {emergencies[0].direction || "Unknown"}
            </p>
          </div>
          <button
            className="dangerButton"
            onClick={() => onCamera(emergencies[0].junction_id)}
          >
            <Camera size={17} />
            Show Camera
          </button>
        </div>
      ) : (
        <div className="safeState largeSafe">
          <span className="safeIcon">✓</span>
          <div>
            <strong>No active emergencies</strong>
            <span>The emergency priority system is standing by.</span>
          </div>
        </div>
      )}

      <div className="signalCards">
        <SignalTimingCard label="Normal Low" green="30" yellow="5" red="60" />
        <SignalTimingCard label="Normal Medium" green="45" yellow="5" red="50" />
        <SignalTimingCard label="Normal High" green="60" yellow="5" red="40" />
        <SignalTimingCard label="Emergency" green="120" yellow="5" red="15" emergency />
      </div>

      <div className="panel">
        <PanelHeader title="Emergency-Ready Junctions" icon={<Siren size={18} />} />
        <div className="junctionGrid">
          {junctions.map((junction) => (
            <JunctionCard
              key={junction.junction_id}
              junction={junction}
              onOpen={() => onMonitoring(junction.junction_id)}
              onCamera={() => onCamera(junction.junction_id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryPage({ history }) {
  const counts = history.reduce(
    (acc, row) => {
      const level = row.congestion_level || "Unknown";
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    },
    {}
  );

  return (
    <div className="pageStack">
      <PageIntro
        eyebrow="HISTORICAL INTELLIGENCE"
        title="Traffic History"
        text="Review the records generated by the camera analysis pipeline and stored in MongoDB."
      />

      <div className="metricGrid compact">
        <MetricCard icon={<BarChart3 size={19} />} label="Records" value={history.length} />
        <MetricCard icon={<Activity size={19} />} label="Low" value={counts.Low || 0} />
        <MetricCard icon={<AlertTriangle size={19} />} label="High" value={counts.High || 0} />
        <MetricCard icon={<Siren size={19} />} label="Severe" value={counts.Severe || 0} danger />
      </div>

      <div className="panel">
        <PanelHeader title="Stored Traffic Records" icon={<Clock3 size={18} />} />
        <HistoryTable rows={[...history].reverse()} />
      </div>
    </div>
  );
}

function SignalPage({ junctions, onMonitoring }) {
  return (
    <div className="pageStack">
      <PageIntro
        eyebrow="ADAPTIVE SIGNALS"
        title="Signal Optimization"
        text="Signal timings are selected from the predicted congestion class, with emergency events taking priority."
      />

      <div className="signalCards">
        <SignalTimingCard label="Low" green="30" yellow="5" red="60" />
        <SignalTimingCard label="Medium" green="45" yellow="5" red="50" />
        <SignalTimingCard label="High" green="60" yellow="5" red="40" />
        <SignalTimingCard label="Severe / Critical" green="90" yellow="5" red="30" />
        <SignalTimingCard label="Emergency" green="120" yellow="5" red="15" emergency />
      </div>

      <div className="panel">
        <PanelHeader title="Current Junction Decisions" icon={<TrafficCone size={18} />} />
        <div className="signalTable">
          <div className="signalTableHeader">
            <span>Junction</span>
            <span>Congestion</span>
            <span>Vehicles</span>
            <span>Priority</span>
            <span>Action</span>
          </div>

          {junctions.map((junction) => (
            <div className="signalTableRow" key={junction.junction_id}>
              <strong>{junction.junction_id}</strong>
              <StatusBadge status={junction.congestion_level} />
              <span>{junction.vehicle_count ?? 0}</span>
              <span>{junction.priority || "Normal"}</span>
              <button
                className="smallButton"
                onClick={() => onMonitoring(junction.junction_id)}
              >
                View
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function JunctionCard({ junction, onOpen, onCamera }) {
  return (
    <div className={`junctionCard status-${String(junction.status || "").toLowerCase()}`}>
      <div className="junctionTop">
        <div>
          <span className="mutedLabel">JUNCTION</span>
          <strong>{junction.junction_id}</strong>
        </div>
        <StatusBadge status={junction.status || junction.congestion_level} />
      </div>

      <div className="junctionNumbers">
        <div>
          <Car size={16} />
          <strong>{junction.vehicle_count ?? 0}</strong>
          <span>vehicles</span>
        </div>
        <div>
          <Gauge size={16} />
          <strong>{junction.average_speed ?? 0}</strong>
          <span>km/h</span>
        </div>
      </div>

      <div className="junctionFooter">
        <span>{junction.priority || "Normal priority"}</span>
        <div className="buttonGroup">
          <button className="smallButton" onClick={onOpen}>
            Details
          </button>
          <button className="smallButton blue" onClick={onCamera}>
            <Camera size={13} />
            Camera
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, danger }) {
  return (
    <div className={`metricCard ${danger ? "dangerMetric" : ""}`}>
      <div className="metricIcon">{icon}</div>
      <div className="metricLabel">{label}</div>
      <div className="metricValue">{value}</div>
      <div className="metricDetail">{detail || "Live system data"}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="miniStat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "Unknown");
  return (
    <span className={`statusBadge ${normalized.toLowerCase()}`}>
      <span />
      {normalized}
    </span>
  );
}

function PanelHeader({ title, icon, action, onAction }) {
  return (
    <div className="panelHeader">
      <div className="panelTitle">
        {icon}
        <h3>{title}</h3>
      </div>
      {action && (
        <button className="textButton" onClick={onAction}>
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

function PageIntro({ eyebrow, title, text }) {
  return (
    <div className="pageIntro">
      <div>
        <div className="sectionEyebrow">{eyebrow}</div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

function Pipeline() {
  return (
    <div className="pipeline">
      <PipelineStep number="01" title="Camera" text="Live frame" icon={<Camera size={19} />} />
      <div className="pipelineArrow">→</div>
      <PipelineStep number="02" title="YOLO" text="Vehicle detection" icon={<Car size={19} />} />
      <div className="pipelineArrow">→</div>
      <PipelineStep number="03" title="ML Model" text="Congestion prediction" icon={<Activity size={19} />} />
      <div className="pipelineArrow">→</div>
      <PipelineStep number="04" title="Signal" text="Timing optimization" icon={<TrafficCone size={19} />} />
      <div className="pipelineArrow">→</div>
      <PipelineStep number="05" title="Emergency" text="Priority override" icon={<Siren size={19} />} />
    </div>
  );
}

function PipelineStep({ number, title, text, icon }) {
  return (
    <div className="pipelineStep">
      <div className="pipelineIcon">{icon}</div>
      <span>{number}</span>
      <strong>{title}</strong>
      <small>{text}</small>
    </div>
  );
}

function SignalTimingCard({ label, green, yellow, red, emergency }) {
  return (
    <div className={`signalTimingCard ${emergency ? "emergencyTiming" : ""}`}>
      <div className="signalTimingHeader">
        <strong>{label}</strong>
        {emergency && <span>OVERRIDE</span>}
      </div>
      <div className="timingRow green">
        <span>GREEN</span>
        <strong>{green}s</strong>
      </div>
      <div className="timingRow yellow">
        <span>YELLOW</span>
        <strong>{yellow}s</strong>
      </div>
      <div className="timingRow red">
        <span>RED</span>
        <strong>{red}s</strong>
      </div>
    </div>
  );
}

function HistoryTable({ rows }) {
  if (!rows.length) {
    return <EmptyText text="No traffic history available." />;
  }

  return (
    <div className="historyTableWrap">
      <table className="historyTable">
        <thead>
          <tr>
            <th>Junction</th>
            <th>Vehicles</th>
            <th>Cars</th>
            <th>Bikes</th>
            <th>Bus</th>
            <th>Truck</th>
            <th>Speed</th>
            <th>Congestion</th>
            <th>Weather</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.junction_id}-${index}`}>
              <td>{row.junction_id}</td>
              <td>{row.vehicle_count ?? 0}</td>
              <td>{row.cars ?? 0}</td>
              <td>{row.bikes ?? 0}</td>
              <td>{row.buses ?? 0}</td>
              <td>{row.trucks ?? 0}</td>
              <td>{row.average_speed ?? 0} km/h</td>
              <td><StatusBadge status={row.congestion_level} /></td>
              <td>{row.weather || "Unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyText({ text }) {
  return <div className="emptyText">{text}</div>;
}

export default App;
