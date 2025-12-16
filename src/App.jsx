import Webcam from "react-webcam";
import { useRef, useState } from "react";
import "./App.css";

export default function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [countdown, setCountdown] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [webcamKey, setWebcamKey] = useState(0);
  const [webcamReady, setWebcamReady] = useState(false);

  const start = () => {
    // Check if webcam is ready before starting countdown
    if (!webcamReady || !webcamRef.current || !webcamRef.current.getScreenshot) {
      console.error("Webcam not ready, please wait...");
      return;
    }

    let i = 3;
    setCountdown(i);

    const timer = setInterval(() => {
      i--;
      setCountdown(i);

      if (i === 0) {
        clearInterval(timer);
        setCountdown(null);
        // Small delay to ensure countdown is cleared before capture
        setTimeout(() => {
          capture();
        }, 100);
      }
    }, 1000);
  };

  const capture = () => {
    // Check if webcam is ready
    if (!webcamRef.current || !webcamRef.current.getScreenshot) {
      console.error("Webcam not ready");
      return;
    }

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) {
      console.error("Failed to get screenshot");
      return;
    }

    const fanImg = new Image();
    fanImg.src = screenshot;

    const celebImg = new Image();
    celebImg.src = "/celebrity_selfie.png";

    let fanLoaded = false;
    let celebLoaded = false;

    const tryDraw = () => {
      if (fanLoaded && celebLoaded) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");

        // Square canvas - 1080 x 1080 pixels
        canvas.width = 1080;
        canvas.height = 1080;

        // Calculate size for famous image (45% for more realistic appearance)
        const famousSize = Math.floor(canvas.width * 0.60); // ~486 pixels

        // Draw fan image first (layer 2 - bottom/back)
        ctx.drawImage(fanImg, 0, 0, canvas.width, canvas.height);

        // Draw celebrity selfie in bottom right corner (layer 1 - top/front)
        // Position: bottom right corner
        const xPos = canvas.width - famousSize;
        const yPos = canvas.height - famousSize;
        ctx.drawImage(celebImg, xPos, yPos, famousSize, famousSize);

        setFinalImage(canvas.toDataURL("image/png"));
      }
    };

    fanImg.onload = () => {
      fanLoaded = true;
      tryDraw();
    };

    celebImg.onload = () => {
      celebLoaded = true;
      tryDraw();
    };

    // Handle case where images are already cached
    if (fanImg.complete) {
      fanLoaded = true;
      tryDraw();
    }
    if (celebImg.complete) {
      celebLoaded = true;
      tryDraw();
    }
  };

  const reset = () => {
    setFinalImage(null);
    setCountdown(null);
    setWebcamReady(false);
    setWebcamKey((prev) => prev + 1);
  };

  const downloadImage = () => {
    if (!finalImage) return;

    // Convert data URL to blob
    const link = document.createElement("a");
    link.download = "virtual-selfie.png";
    link.href = finalImage;
    link.click();
  };

  return (
    <div className="kiosk">
      <video
        src="/celebrity_video.mp4"
        autoPlay
        loop
        muted
        className="bg-video"
      />

      {!finalImage && (
        <Webcam
          key={webcamKey}
          ref={webcamRef}
          screenshotFormat="image/png"
          className="webcam"
          onUserMedia={() => {
            setWebcamReady(true);
          }}
          onUserMediaError={(error) => {
            console.error("Webcam error:", error);
            setWebcamReady(false);
          }}
        />
      )}

      {countdown && <div className="countdown">{countdown}</div>}

      {!finalImage && (
        <button className="start-btn" onClick={start}>
          START
        </button>
      )}

      {finalImage && (
        <div className="modal-overlay" onClick={reset}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <img src={finalImage} alt="Virtual Selfie" />
              <div className="result-buttons">
                <button className="save-btn" onClick={downloadImage}>
                  SAVE IMAGE
                </button>
                <button className="reset-btn" onClick={reset}>
                  TAKE ANOTHER
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
