"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer, Arrow, Image as KonvaImage } from "react-konva";
import StickyNote, { type Note } from "./StickyNote";
import useImage from "use-image";

type Connector = { id: string; fromId: string; toId: string };
type Mode = "select" | "connect";

const LS_NOTES = "stickyDigitizer_notes";
const LS_CONNS = "stickyDigitizer_connectors";

const randomColor = () => {
  const palette = ["#FEF3C7", "#E0F2FE", "#FCE7F3", "#DCFCE7", "#FFE4E6", "#EDE9FE"];
  return palette[Math.floor(Math.random() * palette.length)];
};

function useWindowSize() {
  const [wh, setWh] = useState({ w: 1024, h: 768 });
  useEffect(() => {
    const onR = () => setWh({ w: window.innerWidth, h: window.innerHeight - 68 });
    onR();
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);
  return wh;
}

function Background({ src, width, height }: { src: string | null; width: number; height: number }) {
  const [img] = useImage(src ?? "", "anonymous");
  if (!src || !img) return null;
  const scale = Math.min(width / img.width, height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return <KonvaImage image={img} width={w} height={h} x={(width - w) / 2} y={(height - h) / 2} />;
}

export default function CanvasStage({
  backgroundSrc,
  resetCounter
}: {
  backgroundSrc: string | null;
  resetCounter: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<any>(null);
  const { w, h } = useWindowSize();

  // --- persisted state ---
  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const raw = localStorage.getItem(LS_NOTES);
      if (raw) return JSON.parse(raw) as Note[];
    } catch {}
    return [
      { id: "n1", x: 120, y: 120, width: 180, height: 120, text: "Double-click to edit", color: randomColor() },
      { id: "n2", x: 420, y: 260, width: 200, height: 120, text: "Drag me around", color: randomColor() }
    ];
  });

  const [connectors, setConnectors] = useState<Connector[]>(() => {
    try {
      const raw = localStorage.getItem(LS_CONNS);
      if (raw) return JSON.parse(raw) as Connector[];
    } catch {}
    return [];
  });

  useEffect(() => { try { localStorage.setItem(LS_NOTES, JSON.stringify(notes)); } catch {} }, [notes]);
  useEffect(() => { try { localStorage.setItem(LS_CONNS, JSON.stringify(connectors)); } catch {} }, [connectors]);

  // --- interaction state ---
  const [mode, setMode] = useState<Mode>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);          // note selection
  const [selectedConnId, setSelectedConnId] = useState<string | null>(null);  // connector selection
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);

  // Editing overlay
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [editingRect, setEditingRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  // pan & zoom
  const [scale, setScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Reset board when resetCounter changes
  useEffect(() => {
    if (resetCounter < 1) return;
    setNotes([
      { id: "n1", x: 120, y: 120, width: 180, height: 120, text: "Double-click to edit", color: randomColor() },
      { id: "n2", x: 420, y: 260, width: 200, height: 120, text: "Drag me around", color: randomColor() }
    ]);
    setConnectors([]);
    try {
      localStorage.removeItem(LS_NOTES);
      localStorage.removeItem(LS_CONNS);
    } catch {}
    setScale(1);
    setStagePos({ x: 0, y: 0 });
    setMode("select");
    setPendingFrom(null);
    setSelectedId(null);
    setSelectedConnId(null);
  }, [resetCounter]);

  const noteMap = useMemo(() => Object.fromEntries(notes.map(n => [n.id, n])), [notes]);
  const getCenter = (n: Note) => ({ cx: n.x + n.width / 2, cy: n.y + n.height / 2 });

  const addNote = () => {
    const id = crypto.randomUUID();
    setNotes(prev => [
      ...prev,
      { id, x: 80 + Math.random() * 200, y: 80 + Math.random() * 200, width: 200, height: 120, text: "New note", color: randomColor() }
    ]);
    setMode("select");
    setSelectedConnId(null);
  };

  const startConnect = () => {
    setMode("connect");
    setPendingFrom(null);
    setSelectedId(null);
    setSelectedConnId(null);
  };

  const onNoteClick = (id: string) => {
    setSelectedConnId(null); // clicking a note deselects any connector
    if (mode === "connect") {
      if (!pendingFrom) {
        setPendingFrom(id);
        setSelectedId(id);
      } else if (pendingFrom !== id) {
        setConnectors(prev => [...prev, { id: crypto.randomUUID(), fromId: pendingFrom, toId: id }]);
        setPendingFrom(null);
        setMode("select");
        setSelectedId(id);
      }
    } else {
      setSelectedId(id);
    }
  };

  const onConnectorClick = (id: string, e: any) => {
    e.cancelBubble = true;        // don't let Stage clear selection
    setSelectedId(null);
    setSelectedConnId(id);
    setMode("select");
  };

  const onDragEnd = (id: string, x: number, y: number) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, x, y } : n)));
  };

  const onDblClick = (id: string) => {
    const n = notes.find(nn => nn.id === id);
    if (!n || !containerRef.current) return;
    setEditingId(id);
    setEditingText(n.text);
    const containerRect = containerRef.current.getBoundingClientRect();
    const left = containerRect.left + stagePos.x + n.x * scale + 8 * scale;
    const top = containerRect.top + stagePos.y + n.y * scale + 8 * scale;
    const width = (n.width - 16) * scale;
    const height = (n.height - 16) * scale;
    setEditingRect({ left, top, width, height });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setNotes(prev => prev.map(n => (n.id === editingId ? { ...n, text: editingText } : n)));
    setEditingId(null);
    setEditingRect(null);
  };

  // Keyboard handling (with guards)
  useEffect(() => {
    const isFormEl = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (editingId || isFormEl(e.target)) return;

      if (e.code === "Space") {
        setIsPanning(true);
        e.preventDefault();
      }

      if (e.key === "Escape") {
        setMode("select");
        setPendingFrom(null);
        setSelectedId(null);
        setSelectedConnId(null);
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        addNote();
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "l") {
        e.preventDefault();
        startConnect();
      }

      // Delete connector if one is selected; otherwise delete selected note
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedConnId) {
          setConnectors(prev => prev.filter(c => c.id !== selectedConnId));
          setSelectedConnId(null);
          return;
        }
        if (selectedId) {
          setNotes(prev => prev.filter(n => n.id !== selectedId));
          setConnectors(prev => prev.filter(c => c.fromId !== selectedId && c.toId !== selectedId));
          setSelectedId(null);
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsPanning(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [selectedId, selectedConnId, editingId]);

  const onWheel = (e: any) => {
    e.evt.preventDefault();
    if (!stageRef.current) return;
    const stage = stageRef.current;
    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.05;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    };

    setScale(Math.max(0.3, Math.min(newScale, 3)));
    setStagePos(newPos);
  };

  // Clear selection only when clicking empty canvas
  const onStageMouseDown = (e: any) => {
    const stage = e.target.getStage();
    if (e.target === stage) {
      setSelectedId(null);
      setSelectedConnId(null);
      if (mode === "connect") {
        setMode("select");
        setPendingFrom(null);
      }
    }
  };

  // cursor feedback
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.cursor = isPanning ? "grab" : "default";
  }, [isPanning]);

  const width = w;
  const height = h;

  return (
    <div ref={containerRef} className="w-full h-full relative select-none">
      {/* HUD */}
      <div className="absolute left-4 top-4 z-10 flex gap-2">
        <button className="px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-black" onClick={addNote} title="Add note (Ctrl/Cmd+N)">
          + Note
        </button>
        <button
          className={`px-3 py-1.5 rounded-lg border ${mode === "connect" ? "bg-gray-900 text-white" : "hover:bg-gray-100"}`}
          onClick={startConnect}
          title="Link notes (Ctrl/Cmd+L)"
        >
          Link
        </button>
        {pendingFrom && <span className="px-2 py-1 rounded bg-amber-100 text-amber-900">Pick a target note…</span>}
        <span className="ml-2 px-2 py-1 rounded bg-white/80 border text-xs">Click arrow to select • Delete to remove</span>
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={isPanning}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={scale}
        scaleY={scale}
        onDragEnd={() => {
          const st = stageRef.current;
          if (st) setStagePos({ x: st.x(), y: st.y() });
        }}
        onWheel={onWheel}
        onMouseDown={onStageMouseDown}
      >
        <Layer listening={false}>
          <Background src={backgroundSrc} width={width} height={height} />
        </Layer>

        <Layer>
          {/* Connectors */}
          {connectors.map(c => {
            const from = noteMap[c.fromId];
            const to = noteMap[c.toId];
            if (!from || !to) return null;
            const x1 = from.x + from.width / 2;
            const y1 = from.y + from.height / 2;
            const x2 = to.x + to.width / 2;
            const y2 = to.y + to.height / 2;
            const isSel = selectedConnId === c.id;
            return (
              <Arrow
                key={c.id}
                points={[x1, y1, x2, y2]}
                stroke={isSel ? "#2563EB" : "#111827"}
                fill={isSel ? "#2563EB" : "#111827"}
                pointerWidth={8}
                pointerLength={10}
                strokeWidth={isSel ? 4 : 2}
                hitStrokeWidth={12}           // easier to click
                onClick={(e) => onConnectorClick(c.id, e)}
              />
            );
          })}
        </Layer>

        <Layer>
          {/* Notes */}
          {notes.map(n => (
            <StickyNote
              key={n.id}
              note={n}
              isSelected={selectedId === n.id || pendingFrom === n.id}
              draggable={!isPanning}
              onDragEnd={onDragEnd}
              onDblClick={onDblClick}
              onClick={onNoteClick}
            />
          ))}
        </Layer>
      </Stage>

      {/* Textarea overlay for editing */}
      {editingId && editingRect && (
        <textarea
          autoFocus
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              saveEdit();
            }
          }}
          style={{
            position: "fixed",
            left: editingRect.left,
            top: editingRect.top,
            width: editingRect.width,
            height: editingRect.height,
            padding: 8,
            borderRadius: 12,
            border: "2px solid #111827",
            fontSize: 16,
            lineHeight: 1.2,
            resize: "none",
            background: "rgba(255,255,255,0.95)"
          }}
        />
      )}
    </div>
  );
}
