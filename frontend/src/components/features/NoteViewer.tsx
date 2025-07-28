import React from "react";
import type { Note } from "../../types/Note";
import Button from "../ui/Button";

interface NoteViewerProps {
  note: Note;
  onEdit: (note: Note) => void;
}

const NoteViewer: React.FC<NoteViewerProps> = ({ note, onEdit }) => {
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
        <Button onClick={() => onEdit(note)}>Edit Note</Button>
      </div>

      <div className="flex-1 prose max-w-none">
        {note.content.split("\n").map((paragraph, index) => (
          <p key={index} className="text-lg leading-relaxed text-gray-700 mb-4">
            {paragraph || "\u00A0"}
          </p>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Created:{" "}
          {note.created_at && new Date(note.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default NoteViewer;
