import { useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture, disabled = false, onError }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  };

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported on this browser/device.');
      }

      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
      setStream(s);
      setCameraOpen(true);
    } catch (error) {
      if (onError) {
        onError(error.message || 'Unable to open camera.');
      }
    }
  };

  const capture = async () => {
    if (!videoRef.current || !videoRef.current.videoWidth || !videoRef.current.videoHeight) {
      if (onError) {
        onError('Camera is not ready yet. Please wait one moment and retry.');
      }
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
    await onCapture(base64);
    stopCamera();
  };

  return (
    <div className="live-camera-wrap">
      <video
        className="live-camera-preview"
        ref={videoRef}
        autoPlay
        playsInline
        muted
      />
      <div className="live-camera-actions">
        <button
          type="button"
          className="camera-inline-btn"
          onClick={startCamera}
          disabled={disabled || cameraOpen}
        >
          {cameraOpen ? 'Camera Open' : 'Use Live Camera'}
        </button>
        <button
          type="button"
          className="camera-inline-btn"
          onClick={capture}
          disabled={disabled || !cameraOpen}
        >
          Capture Photo
        </button>
        {cameraOpen ? (
          <button
            type="button"
            className="camera-inline-btn camera-stop-btn"
            onClick={stopCamera}
            disabled={disabled}
          >
            Close Camera
          </button>
        ) : null}
      </div>
    </div>
  );
}