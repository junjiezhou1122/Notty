import React, { useState, useEffect } from "react";
import type { Note, CreateNoteRequest, UpdateNoteRequest } from "../../types/Note";
import Button from "../ui/Button";

interface NoteEditorProps {
  note?: Note | null;
  onSave: (data: CreateNoteRequest | UpdateNoteRequest) => Promise<void>;
  onCancel: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });
  const [saving, setSaving] = useState(false);

  // Update form when note changes
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content,
      });
    } else {
      setFormData({
        title: "",
        content: "",
      });
    }
  }, [note]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Note title..."
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full text-3xl font-bold border-none outline-none bg-transparent placeholder-gray-400"
          autoFocus
          disabled={saving}
        />
      </div>

      <div className="flex-1 mb-6">
        <textarea
          placeholder="Write your note here..."
          value={formData.content}
          onChange={(e) =>
            setFormData({ ...formData, content: e.target.value })
          }
          className="w-full h-full resize-none border-none outline-none bg-transparent placeholder-gray-400 text-lg leading-relaxed"
          disabled={saving}
        />
      </div>

      <div className="flex space-x-4">
        <Button type="submit" disabled={!formData.title.trim() || saving}>
          {saving ? "Saving..." : note ? "Update Note" : "Create Note"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default NoteEditor;
