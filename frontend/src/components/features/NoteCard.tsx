import React from "react";
import type { Note } from "../../types/Note";
import Button from "../ui/Button";

interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  onSelect: (note: Note) => void;
  onEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      onDelete(note);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(note);
  };

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-blue-50 border-2 border-blue-200"
          : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
      }`}
      onClick={() => onSelect(note)}
    >
      <h3 className="font-semibold text-gray-900 truncate">
        {note.title || "Untitled"}
      </h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
        {note.content.substring(0, 100)}
        {note.content.length > 100 ? "..." : ""}
      </p>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-400">
          {note.created_at && new Date(note.created_at).toLocaleDateString()}
        </span>
        <div className="flex space-x-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800 bg-transparent hover:bg-blue-50 border-none"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            className="text-red-600 hover:text-red-800 bg-transparent hover:bg-red-50 border-none"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
