import { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function CameraView({
  junctionId = "J003",
  onClose,
  onAnalysis
}) {
  const videoRef = useRef(null);
  const captureCanvasRef = useRef(null);
  const overlayCanvasRef = useRef(null);
  const streamRef = useRef(null);

  const timerRef = useRef(null);
  const analyzingRef = useRef(false);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  // =====================================================
  // START CAMERA
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        setCameraError("");

        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: {
                ideal: 640,
                max: 640
              },

              height: {
                ideal: 480,
                max: 480
              },

              frameRate: {
                ideal: 30,
                max: 30
              }
            },

            audio: false
          });

        if (!mounted) {
          stream
            .getTracks()
            .forEach(track => track.stop());

          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          await videoRef.current
            .play()
            .catch(() => {});
        }

        setCameraActive(true);
      }

      catch (error) {
        console.error(
          "Camera error:",
          error
        );

        setCameraError(
          error.message ||
          "Unable to access camera."
        );
      }
    };

    startCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, []);


  // =====================================================
  // STOP CAMERA
  // =====================================================

  const stopCamera = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(track => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };


  // =====================================================
  // DRAW NORMAL + EMERGENCY YOLO BOXES
  // =====================================================

  const drawDetections = (
    detections = [],
    emergencyDetections = []
  ) => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;

    if (!video || !canvas) {
      return;
    }

    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    if (
      displayWidth <= 0 ||
      displayHeight <= 0
    ) {
      return;
    }

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      displayWidth,
      displayHeight
    );

    const allDetections = [
      ...detections,
      ...emergencyDetections.map(
        detection => ({
          ...detection,
          category: "emergency"
        })
      )
    ];

    if (!allDetections.length) {
      return;
    }

    // YOLO coordinates are based on
    // uploaded frame dimensions.

    const sourceWidth =
      video.videoWidth || 640;

    const sourceHeight =
      video.videoHeight || 480;

    const scaleX =
      displayWidth /
      sourceWidth;

    const scaleY =
      displayHeight /
      sourceHeight;


    allDetections.forEach(
      detection => {

        const x =
          detection.x1 *
          scaleX;

        const y =
          detection.y1 *
          scaleY;

        const width =
          (
            detection.x2 -
            detection.x1
          ) *
          scaleX;

        const height =
          (
            detection.y2 -
            detection.y1
          ) *
          scaleY;


        // =================================================
        // DETECTION COLOR
        // =================================================

        let color = "#22c55e";

        if (
          detection.category ===
          "bikes"
        ) {
          color = "#3b82f6";
        }

        else if (
          detection.category ===
          "buses"
        ) {
          color = "#eab308";
        }

        else if (
          detection.category ===
          "trucks"
        ) {
          color = "#f97316";
        }

        // Emergency vehicle
        else if (
          detection.category ===
          "emergency"
        ) {
          color = "#ef4444";
        }


        // =================================================
        // BOX
        // =================================================

        ctx.strokeStyle = color;

        ctx.lineWidth =
          detection.category ===
          "emergency"
            ? 4
            : 3;

        ctx.strokeRect(
          x,
          y,
          width,
          height
        );


        // =================================================
        // LABEL
        // =================================================

        const confidence =
          Math.round(
            detection.confidence *
            100
          );

        const label =
          detection.category ===
          "emergency"
            ? `🚨 ${detection.class_name.toUpperCase()} ${confidence}%`
            : `${detection.class_name.toUpperCase()} ${confidence}%`;

        ctx.font =
          "bold 13px Arial";

        const textWidth =
          ctx.measureText(label).width;

        const labelWidth =
          textWidth + 14;

        const labelHeight =
          24;

        const labelY =
          Math.max(
            0,
            y - labelHeight
          );

        ctx.fillStyle = color;

        ctx.fillRect(
          x,
          labelY,
          labelWidth,
          labelHeight
        );

        ctx.fillStyle =
          "#ffffff";

        ctx.fillText(
          label,
          x + 7,
          labelY + 17
        );
      }
    );
  };


  // =====================================================
  // ANALYZE FRAME
  // =====================================================

  const analyzeCamera = async () => {

    if (
      analyzingRef.current
    ) {
      return;
    }

    if (
      !streamRef.current ||
      !videoRef.current
    ) {
      return;
    }

    if (
      videoRef.current.readyState < 2
    ) {
      scheduleNextAnalysis();
      return;
    }

    analyzingRef.current = true;
    setAnalyzing(true);

    try {

      const video =
        videoRef.current;

      const canvas =
        captureCanvasRef.current;

      if (!canvas) {
        return;
      }


      // =================================================
      // CAPTURE FRAME
      // =================================================

      const sourceWidth =
        video.videoWidth || 640;

      const sourceHeight =
        video.videoHeight || 480;

      const maxWidth = 640;

      const scale =
        Math.min(
          1,
          maxWidth /
          sourceWidth
        );

      canvas.width =
        Math.round(
          sourceWidth *
          scale
        );

      canvas.height =
        Math.round(
          sourceHeight *
          scale
        );

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height
      );


      // =================================================
      // COMPRESS IMAGE
      // =================================================

      const blob =
        await new Promise(
          resolve => {

            canvas.toBlob(
              resolve,
              "image/jpeg",
              0.60
            );

          }
        );

      if (!blob) {
        return;
      }


      // =================================================
      // FORM DATA
      // =================================================

      const now =
        new Date();

      const formData =
        new FormData();

      formData.append(
        "file",
        blob,
        `camera_${Date.now()}.jpg`
      );

      formData.append(
        "junction_id",
        junctionId
      );

      formData.append(
        "average_speed",
        "17"
      );

      formData.append(
        "hour",
        String(
          now.getHours()
        )
      );

      formData.append(
        "day_of_week",
        now.toLocaleDateString(
          "en-US",
          {
            weekday: "long"
          }
        )
      );

      formData.append(
        "weather",
        "Rainy"
      );


      // =================================================
      // SEND TO FASTAPI
      // =================================================

      const response =
        await fetch(
          `${API}/vision/analyze`,
          {
            method: "POST",
            body: formData
          }
        );

      if (!response.ok) {
        throw new Error(
          `AI server error: ${response.status}`
        );
      }

      const data =
        await response.json();


      // =================================================
      // SAVE RESULT
      // =================================================

      setAnalysis(data);


      // =================================================
      // GET NORMAL DETECTIONS
      // =================================================

      const detections =
        data
          ?.vehicle_detection
          ?.detections ||
        [];


      // =================================================
      // GET EMERGENCY DETECTIONS
      // =================================================

      const emergencyDetections =
        data
          ?.vehicle_detection
          ?.emergency_detections ||
        [];


      // =================================================
      // DRAW ALL BOXES
      // =================================================

      drawDetections(
        detections,
        emergencyDetections
      );


      // =================================================
      // SEND RESULT TO PARENT
      // =================================================

      if (onAnalysis) {
        onAnalysis(data);
      }

    }

    catch (error) {

      console.error(
        "AI analysis error:",
        error
      );

    }

    finally {

      analyzingRef.current =
        false;

      setAnalyzing(false);

      scheduleNextAnalysis();
    }
  };


  // =====================================================
  // SCHEDULE NEXT FRAME
  // =====================================================

  const scheduleNextAnalysis = () => {

    if (timerRef.current) {

      clearTimeout(
        timerRef.current
      );

    }

    if (streamRef.current) {

      timerRef.current =
        setTimeout(
          analyzeCamera,
          1200
        );

    }
  };


  // =====================================================
  // START AI
  // =====================================================

  useEffect(() => {

    if (!cameraActive) {
      return;
    }

    timerRef.current =
      setTimeout(
        analyzeCamera,
        500
      );

    return () => {

      if (timerRef.current) {

        clearTimeout(
          timerRef.current
        );

        timerRef.current = null;

      }

    };

  }, [cameraActive]);


  // =====================================================
  // CLOSE
  // =====================================================

  const closeCamera = () => {

    stopCamera();

    if (onClose) {
      onClose();
    }

  };


  // =====================================================
  // VALUES
  // =====================================================

  const vehicles =
    analysis
      ?.vehicle_detection;

  const signal =
    analysis
      ?.signal_optimization;


  // IMPORTANT:
  // Emergency status comes directly from
  // the emergency YOLO model.

  const emergencyDetected =
    vehicles
      ?.emergency_detected === true;


  const emergencyType =
    vehicles
      ?.emergency_type;


  const emergencyConfidence =
    vehicles
      ?.emergency_confidence;


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="cameraModal">

      <div className="cameraModalContent">


        {/* =================================================
            HEADER
        ================================================= */}

        <div className="cameraModalHeader">

          <div>

            <h2>
              🚦 LIVE TRAFFIC CAMERA
            </h2>

            <p>
              AI Vehicle Monitoring ·{" "}
              {junctionId}
            </p>

          </div>


          <button
            onClick={closeCamera}
            className="closeCameraButton"
          >
            ✕
          </button>

        </div>


        {/* =================================================
            CAMERA
        ================================================= */}

        <div
          className={
            `cameraVideoContainer ${
              emergencyDetected
                ? "emergencyCamera"
                : ""
            }`
          }
        >

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="cameraLiveVideo"
          />


          {/* YOLO OVERLAY */}

          <canvas
            ref={overlayCanvasRef}
            className="detectionOverlay"
          />


          {/* HIDDEN CAPTURE CANVAS */}

          <canvas
            ref={captureCanvasRef}
            style={{
              display: "none"
            }}
          />


          {/* LIVE */}

          {cameraActive && (

            <div
              className="cameraLiveLabel"
            >

              <span />

              LIVE

            </div>

          )}


          {/* RECORDING */}

          {cameraActive && (

            <div
              className="recordingLabel"
            >

              <span />

              AI MONITORING

            </div>

          )}


          {/* ANALYZING */}

          {analyzing && (

            <div
              className="aiScanning"
            >

              🔍 AI ANALYZING...

            </div>

          )}


          {/* ERROR */}

          {cameraError && (

            <div
              className="cameraErrorScreen"
            >

              <h3>
                Camera Error
              </h3>

              <p>
                {cameraError}
              </p>

            </div>

          )}

        </div>


        {/* =================================================
            EMERGENCY ALERT
        ================================================= */}

        {emergencyDetected && (

          <div
            className="cameraEmergencyAlert"
          >

            <h2>
              🚨 EMERGENCY DETECTED
            </h2>


            <div>

              <strong>
                🚑 Emergency:
              </strong>{" "}

              {
                emergencyType
                  ? emergencyType.replace(
                      "_",
                      " "
                    ).toUpperCase()
                  : "UNKNOWN"
              }

            </div>


            <div>

              <strong>
                Confidence:
              </strong>{" "}

              {
                emergencyConfidence
                  ? (
                      emergencyConfidence *
                      100
                    ).toFixed(1)
                  : "0"
              }%

            </div>


            <div>

              <strong>
                Direction:
              </strong>{" "}

              {
                signal?.emergency_direction ||
                "North"
              }

            </div>


            <div>

              <strong>
                Signal:
              </strong>{" "}

              {
                signal?.signal_action ||
                "Emergency priority activated"
              }

            </div>

          </div>

        )}


        {/* =================================================
            NORMAL STATUS
        ================================================= */}

        {!emergencyDetected &&
          analysis && (

          <div
            className="cameraNormalStatus"
          >

            <strong>
              ✅ NO EMERGENCY VEHICLE DETECTED
            </strong>

            <span>
              Traffic signal operating normally
            </span>

          </div>

        )}


        {/* =================================================
            VEHICLE STATISTICS
        ================================================= */}

        <div
          className="cameraResults"
        >

          <h3>
            🚗 LIVE YOLO DETECTION
          </h3>


          <div
            className="cameraDetectionGrid"
          >

            <DetectionCard
              label="CARS"
              value={
                vehicles?.cars ??
                0
              }
            />


            <DetectionCard
              label="BIKES"
              value={
                vehicles?.bikes ??
                0
              }
            />


            <DetectionCard
              label="BUSES"
              value={
                vehicles?.buses ??
                0
              }
            />


            <DetectionCard
              label="TRUCKS"
              value={
                vehicles?.trucks ??
                0
              }
            />


            <DetectionCard
              label="TOTAL"
              value={
                vehicles
                  ?.vehicle_count ??
                0
              }
              total
            />

          </div>


          {/* =================================================
              ML RESULT
          ================================================= */}

          <div
            className="cameraMLResult"
          >

            <div>

              <span>
                CONGESTION
              </span>

              <strong>

                {
                  analysis
                    ?.traffic_analysis
                    ?.congestion_level ||
                  "Waiting..."
                }

              </strong>

            </div>


            <div>

              <span>
                SPEED
              </span>

              <strong>

                {
                  analysis
                    ?.traffic_analysis
                    ?.average_speed ??
                  "-"
                }{" "}
                km/h

              </strong>

            </div>


            <div>

              <span>
                PRIORITY
              </span>

              <strong>

                {
                  signal?.priority ||
                  "-"
                }

              </strong>

            </div>

          </div>

        </div>


        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="cameraModalFooter"
        >

          <span>
            🟢 Camera Connected
          </span>

          <span>
            🟢 YOLO Active
          </span>

          <span>
            🟢 AI Monitoring
          </span>


          <button
            onClick={analyzeCamera}
            disabled={analyzing}
            className="analyzeButton"
          >

            {
              analyzing
                ? "Analyzing..."
                : "Analyze Now"
            }

          </button>

        </div>

      </div>

    </div>
  );
}


// =====================================================
// DETECTION CARD
// =====================================================

function DetectionCard({
  label,
  value,
  total = false
}) {

  return (

    <div
      className={
        `cameraDetectionCard ${
          total
            ? "totalCard"
            : ""
        }`
      }
    >

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>

  );
}