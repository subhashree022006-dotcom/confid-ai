import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function CameraFeed({ active, onSample, onStreamReady }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadModels() {
      try {
        const MODEL_URL = "/models";
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        setError("Could not load face-tracking models. See public/models/README.md.");
      }
    }
    loadModels();
  }, []);

  // Starts the camera/mic stream ONCE when the session becomes active.
  // Deliberately does NOT depend on modelsLoaded — if it did, this effect
  // would re-run when models finish loading, tearing down and recreating
  // the stream. That stops the original tracks mid-session, which kills
  // the MediaRecorder in the parent (its state silently becomes
  // "inactive"), so no video ever gets uploaded.
  useEffect(() => {
    if (!active) return;
    let stream;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        onStreamReady?.(stream);
      } catch (e) {
        setError("Camera/microphone permission was denied.");
      }
    }
    start();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Runs face-detection sampling once models are loaded, reusing the
  // already-running stream/video element. Separate effect so it never
  // touches the camera stream itself.
  useEffect(() => {
    if (!active || !modelsLoaded) return;
    const intervalId = setInterval(async () => {
      if (!videoRef.current) return;
      const result = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions();
      if (result) {
        const box = result.detection.box;
        const videoW = videoRef.current.videoWidth || 1;
        const videoH = videoRef.current.videoHeight || 1;
        const centerX = (box.x + box.width / 2) / videoW;
        const centerY = (box.y + box.height / 2) / videoH;
        onSample?.({
          timestamp: Date.now(),
          faceDetected: true,
          centeredness: 1 - (Math.abs(centerX - 0.5) * 2 + Math.abs(centerY - 0.5) * 2) / 2,
          expressions: result.expressions,
          boxSize: (box.width * box.height) / (videoW * videoH),
        });
      } else {
        onSample?.({ timestamp: Date.now(), faceDetected: false });
      }
    }, 700);
    return () => clearInterval(intervalId);
  }, [active, modelsLoaded]);

  return (
    <div className="w-full">
      <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
        {!modelsLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
            Loading face-tracking models...
          </div>
        )}
      </div>
      {error && <p className="text-sm text-rose-400 mt-2">{error}</p>}
    </div>
  );
}