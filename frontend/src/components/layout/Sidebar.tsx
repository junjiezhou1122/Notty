import React from "react";
import type { Note } from "../../types/Note";
import Button from "../ui/Button";
import NoteCard from "../features/NoteCard";

interface SidebarProps {
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  onNoteSelect: (note: Note) => void;
  onNoteEdit: (note: Note) => void;
  onNoteDelete: (note: Note) => void;
  onNewNote: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  notes,
  selectedNote,
  loading,
  onNoteSelect,
  onNoteEdit,
  onNoteDelete,
  onNewNote,
}) => {
  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">📝 Notes</h1>
          <Button onClick={onNewNote}>+ New Note</Button>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No notes yet.</p>
            <p className="text-sm mt-2">Click "New Note" to get started!</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={selectedNote?.id === note.id}
                onSelect={onNoteSelect}
                onEdit={onNoteEdit}
                onDelete={onNoteDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
