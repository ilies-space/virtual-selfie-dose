import Webcam from "react-webcam";
import { useRef, useState, useEffect } from "react";
import "./App.css";

export default function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

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
    // Check if webcam is ready
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

    // Wait 5.5 seconds before capturing
    setTimeout(() => {
      capture();
    }, 5500);
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

        // Match canvas resolution to celebrity image for realism
        // Use celebrity image dimensions as base resolution
        const celebWidth = celebImg.naturalWidth || celebImg.width;
        const celebHeight = celebImg.naturalHeight || celebImg.height;
        const baseSize = Math.max(celebWidth, celebHeight, 1080);

        canvas.width = baseSize;
        canvas.height = baseSize;
        console.log('[DEBUG] Canvas size matched to celebrity:', canvas.width, 'x', canvas.height);
        console.log('[DEBUG] Celebrity natural size:', celebWidth, 'x', celebHeight);

        // Calculate celebrity size - maintain aspect ratio
        const celebAspectRatio = celebWidth / celebHeight;
        const celebrityDisplaySize = Math.floor(canvas.width * 0.60);
        const celebrityWidth = celebrityDisplaySize;
        const celebrityHeight = Math.floor(celebrityDisplaySize / celebAspectRatio);
        console.log('[DEBUG] Celebrity display size:', celebrityWidth, 'x', celebrityHeight);

        // Scale user image to match resolution while maintaining aspect ratio
        const userWidth = fanImg.naturalWidth || fanImg.width;
        const userHeight = fanImg.naturalHeight || fanImg.height;
        const userAspectRatio = userWidth / userHeight;
        console.log('[DEBUG] User image natural size:', userWidth, 'x', userHeight);

        let userDisplayWidth, userDisplayHeight;

        // Scale to fill canvas while maintaining aspect ratio
        if (userAspectRatio > 1) {
          // User image is wider - fit to height
          userDisplayHeight = canvas.height;
          userDisplayWidth = canvas.height * userAspectRatio;
        } else {
          // User image is taller - fit to width
          userDisplayWidth = canvas.width;
          userDisplayHeight = canvas.width / userAspectRatio;
        }

        // Center the user image
        const userX = (canvas.width - userDisplayWidth) / 2;
        const userY = (canvas.height - userDisplayHeight) / 2;

        console.log('[DEBUG] User image scaled to:', userDisplayWidth, 'x', userDisplayHeight);
        console.log('[DEBUG] User image centered at:', userX, userY);

        // Draw user image first (layer 2 - bottom/back) maintaining aspect ratio
        ctx.drawImage(fanImg, userX, userY, userDisplayWidth, userDisplayHeight);

        // Draw celebrity selfie in bottom right corner (layer 1 - top/front)
        // Position: bottom right corner, maintaining aspect ratio
        const xPos = canvas.width - celebrityWidth;
        const yPos = canvas.height - celebrityHeight;
        console.log('[DEBUG] Celebrity position:', xPos, yPos);
        ctx.drawImage(celebImg, xPos, yPos, celebrityWidth, celebrityHeight);

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
        <div className="webcam-container">
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
          <div className="safe-zone-overlay">
            <div className="safe-zone-box">
              <div className="safe-zone-text">KEEP IT SAFE</div>
            </div>
          </div>
        </div>
      )}

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
