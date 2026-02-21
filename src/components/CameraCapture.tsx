import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Camera, X, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  disabled?: boolean;
}

export function CameraCapture({ onCapture, disabled }: CameraCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = useCallback(async () => {
    setLoading(true);
    setCameraReady(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for video to be ready
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraReady(true);
            setLoading(false);
          });
        };
      }
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      let errorMessage = "Unable to access camera. ";
      
      if (error.name === "NotAllowedError") {
        errorMessage += "Camera permission was denied. Please:\n1. Click the camera icon in your browser's address bar\n2. Allow camera access\n3. Refresh the page and try again";
      } else if (error.name === "NotFoundError") {
        errorMessage += "No camera found on this device.";
      } else if (error.name === "NotReadableError") {
        errorMessage += "Camera is already in use by another application.";
      } else {
        errorMessage += "Please use the file upload option instead.";
      }
      
      alert(errorMessage);
      setLoading(false);
      setShowCamera(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setCapturedImage(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Make sure video is playing and has dimensions
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL("image/jpeg", 0.9);
          setCapturedImage(imageData);
        }
      } else {
        alert("Camera is still loading. Please wait a moment and try again.");
      }
    }
  }, []);

  const confirmPhoto = useCallback(() => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
          onCapture(file);
          stopCamera();
        }
      }, "image/jpeg", 0.8);
    }
  }, [capturedImage, onCapture, stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
  }, []);

  if (showCamera) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Take Selfie</h3>
            <button onClick={stopCamera} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-sm">Loading camera...</div>
                  </div>
                )}
              </>
            ) : (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-3">
            {!capturedImage ? (
              <>
                <Button onClick={stopCamera} variant="outline" className="flex-1">
                  Cancel
                </Button>
                <Button onClick={capturePhoto} variant="action" className="flex-1" disabled={!cameraReady}>
                  <Camera className="w-4 h-4 mr-2" />
                  {cameraReady ? "Capture" : "Loading..."}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={retakePhoto} variant="outline" className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={confirmPhoto} variant="action" className="flex-1">
                  Use Photo
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={startCamera}
      variant="outline"
      className="w-full"
      disabled={disabled || loading}
    >
      <Camera className="w-4 h-4 mr-2" />
      {loading ? "Opening Camera..." : "Open Camera"}
    </Button>
  );
}
