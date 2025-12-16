import Webcam from "react-webcam";
import { useRef, useState } from "react";
import "./App.css";

export default function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [countdown, setCountdown] = useState(null);
  const [finalImage, setFinalImage] = useState(null);

  const start = () => {
    let i = 3;
    setCountdown(i);

    const timer = setInterval(() => {
      i--;
      setCountdown(i);

      if (i === 0) {
        clearInterval(timer);
        capture();
        setCountdown(null);
      }
    }, 1000);
  };

  const capture = () => {
    const fanImg = new Image();
    fanImg.src = webcamRef.current.getScreenshot();

    const celebImg = new Image();
    celebImg.src = "/celebrity_selfie.png";

    fanImg.onload = () => {
      celebImg.onload = () => {
        const canvas = canvasRef.current;
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
      };
    };
  };

  const reset = () => {
    setFinalImage(null);
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
          ref={webcamRef}
          screenshotFormat="image/png"
          className="webcam"
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
