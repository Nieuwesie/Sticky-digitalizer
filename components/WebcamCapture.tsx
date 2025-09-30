"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
};

export default function WebcamCapture({ onCapture, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream;
    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (e) {
        setError("Could not access webcam. Please allow camera permissions.");
      }
    };
    void start();

    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const snap = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const url = canvas.toDataURL("image/png");
    onCapture(url);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Webcam Snapshot</h2>
        </div>
        <div className="p-4 grid grid-cols-1 gap-4">
          {error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <>
              <video ref={videoRef} className="w-full rounded-lg bg-black aspect-video" />
              <canvas ref={canvasRef} className="hidden" />
            </>
          )}
        </div>
        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-3 py-1.5 rounded-lg border hover:bg-gray-100" onClick={onCancel}>Cancel</button>
          <button className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black" onClick={snap} disabled={!!error}>Capture</button>
        </div>
      </div>
    </div>
  );
}
