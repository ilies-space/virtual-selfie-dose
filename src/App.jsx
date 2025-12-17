import Webcam from "react-webcam";
import { useRef, useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  const [countdown, setCountdown] = useState(null);
  const [finalImage, setFinalImage] = useState(null);
  const [webcamKey, setWebcamKey] = useState(0);
  const [webcamReady, setWebcamReady] = useState(false);

  // Initialize video to paused at 0 seconds
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        video.pause();
        video.currentTime = 0;
      };

      if (video.readyState >= 1) {
        // Video metadata already loaded
        video.pause();
        video.currentTime = 0;
      } else {
        // Wait for metadata to load
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
      }

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, []);

  const start = () => {
    // Check if webcam is ready before starting countdown
    if (!webcamReady || !webcamRef.current || !webcamRef.current.getScreenshot) {
      console.error("Webcam not ready, please wait...");
      return;
    }

    // Start video playback
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch((error) => {
        console.error("Error playing video:", error);
      });
    }

    let i = 6;
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

    // Get high quality screenshot - use the video element directly for better quality
    const video = webcamRef.current.video;
    if (!video) {
      console.error("Video element not available");
      return;
    }

    // Create a temporary canvas to capture from video at full resolution
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = video.videoWidth || 1920;
    tempCanvas.height = video.videoHeight || 1080;
    const tempCtx = tempCanvas.getContext("2d");
    
    // Use imageSmoothingEnabled for better quality
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = "high";
    
    // Draw video frame to temp canvas at full resolution
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // Get high quality screenshot from temp canvas
    const screenshot = tempCanvas.toDataURL("image/png");

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

        // Enable high quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Higher resolution canvas for better quality - 2160 x 2160 pixels (2x for retina)
        canvas.width = 2160;
        canvas.height = 2160;

        // Calculate size for famous image (45% for more realistic appearance)
        const famousSize = Math.floor(canvas.width * 0.60);

        // Draw fan image first (layer 2 - bottom/back) at high quality
        ctx.drawImage(fanImg, 0, 0, canvas.width, canvas.height);

        // Draw celebrity selfie in bottom right corner (layer 1 - top/front)
        // Position: bottom right corner
        const xPos = canvas.width - famousSize;
        const yPos = canvas.height - famousSize;
        ctx.drawImage(celebImg, xPos, yPos, famousSize, famousSize);

        // Use PNG format for highest quality (no compression)
        setFinalImage(canvas.toDataURL("image/png"));

        // Pause video and reset to 0 after capturing
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
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

    // Reset video to paused at 0 seconds
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const downloadImage = () => {
    if (!finalImage) return;

    // Convert data URL to blob
    const link = document.createElement("a");
    link.download = "virtual-selfie.png";
    link.href = finalImage;
    link.click();

    // Reset video to paused at 0 seconds after download
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div className="kiosk">
      <video
        ref={videoRef}
        src="/celebrity_video.mp4"
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
          videoConstraints={{
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: "user"
          }}
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
