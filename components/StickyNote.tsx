"use client";

import { Group, Rect, Text } from "react-konva";
import { KonvaEventObject } from "konva/lib/Node";

export type Note = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
};

type Props = {
  note: Note;
  isSelected: boolean;
  draggable?: boolean;
  onDragEnd: (id: string, x: number, y: number) => void;
  onDblClick: (id: string) => void;
  onClick: (id: string) => void;
};

export default function StickyNote({
  note,
  isSelected,
  draggable = true,
  onDragEnd,
  onDblClick,
  onClick
}: Props) {
  return (
    <Group
      x={note.x}
      y={note.y}
      draggable={draggable}
      onDragEnd={(e: KonvaEventObject<DragEvent>) => {
        onDragEnd(note.id, e.target.x(), e.target.y());
      }}
      onDblClick={() => onDblClick(note.id)}
      onClick={(e) => {
        e.cancelBubble = true; // prevent Stage from clearing/link-cancelling
        onClick(note.id);
      }}
    >
      <Rect
        width={note.width}
        height={note.height}
        fill={note.color}
        shadowBlur={isSelected ? 12 : 6}
        shadowOpacity={0.2}
        cornerRadius={12}
        stroke={isSelected ? "#111827" : "#000000"}
        strokeWidth={isSelected ? 1.8 : 0.6}
      />
      <Text
        text={note.text}
        width={note.width - 16}
        height={note.height - 16}
        x={8}
        y={8}
        fontSize={16}
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
        fill="#111827"
        listening={false}
      />
    </Group>
  );
}
