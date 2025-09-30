"use client";

import { useRef, useState } from "react";
import WebcamCapture from "./WebcamCapture";

type Props = {
  onBackgroundChosen: (src: string | null) => void;
  onReset: () => void;
};

export default function Toolbar({ onBackgroundChosen, onReset }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onBackgroundChosen(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2">
          <h1 className="font-semibold mr-4">Sticky Digitizer</h1>

          <button
            className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black"
            onClick={() => fileRef.current?.click()}
            title="Upload background image"
          >
            Upload Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onFileChange}
          />

          <button
            className="px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-900"
            onClick={() => setWebcamOpen(true)}
            title="Capture background from webcam"
          >
            Webcam Snapshot
          </button>

          <button
            className="ml-auto px-3 py-1.5 rounded-lg border hover:bg-gray-100"
            onClick={() => onBackgroundChosen(null)}
            title="Clear background"
          >
            Clear BG
          </button>

          <button
            className="px-3 py-1.5 rounded-lg border border-red-500 text-red-600 hover:bg-red-50"
            onClick={onReset}
            title="Reset board (notes, links, background)"
          >
            Reset Board
          </button>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-2 text-sm text-gray-600">
          Tip: <kbd className="border px-1 rounded">Space</kbd> to pan • Scroll to zoom •
          Double-click note to edit • <kbd className="border px-1 rounded">Ctrl/Cmd</kbd> + <kbd className="border px-1 rounded">N</kbd> add note •
          <kbd className="border px-1 rounded">Delete</kbd> removes
        </div>
      </div>

      {webcamOpen && (
        <WebcamCapture
          onCancel={() => setWebcamOpen(false)}
          onCapture={(dataUrl) => {
            onBackgroundChosen(dataUrl);
            setWebcamOpen(false);
          }}
        />
      )}
    </>
  );
}
