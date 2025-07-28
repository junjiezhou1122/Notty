import { useState } from "react";
import type { Note } from "./types/Note";
import { useNotes } from "./hooks/useNotes";
import Sidebar from "./components/layout/Sidebar";
import { NoteEditor, NoteViewer } from "./components/features";
import { ErrorBanner, EmptyState } from "./components/ui";

type ViewMode = "view" | "edit" | "create";

function App() {
  const {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    clearError,
  } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("view");

  const handleNoteSelect = (note: Note) => {
    setSelectedNote(note);
    setViewMode("view");
  };

  const handleNoteEdit = (note: Note) => {
    setSelectedNote(note);
    setViewMode("edit");
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setViewMode("create");
  };

  const handleNoteDelete = async (note: Note) => {
    if (!note.id) return;

    const success = await deleteNote(note.id);
    if (success && selectedNote?.id === note.id) {
      setSelectedNote(null);
      setViewMode("view");
    }
  };

  const handleSaveNote = async (data: { title: string; content: string }) => {
    if (viewMode === "create") {
      const newNote = await createNote(data);
      if (newNote) {
        setSelectedNote(newNote);
        setViewMode("view");
      }
    } else if (viewMode === "edit" && selectedNote?.id) {
      const updatedNote = await updateNote(selectedNote.id, data);
      if (updatedNote) {
        setSelectedNote(updatedNote);
        setViewMode("view");
      }
    }
  };

  const handleCancel = () => {
    if (viewMode === "create") {
      setSelectedNote(null);
    }
    setViewMode("view");
  };

  const renderMainContent = () => {
    if (viewMode === "edit" || viewMode === "create") {
      return (
        <NoteEditor
          note={selectedNote}
          onSave={handleSaveNote}
          onCancel={handleCancel}
        />
      );
    }

    if (selectedNote) {
      return <NoteViewer note={selectedNote} onEdit={handleNoteEdit} />;
    }

    return (
      <EmptyState
        title="Welcome to Notes"
        description="Select a note from the sidebar or create a new one to get started."
        actionLabel="Create Your First Note"
        onAction={handleNewNote}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        notes={notes}
        selectedNote={selectedNote}
        loading={loading}
        onNoteSelect={handleNoteSelect}
        onNoteEdit={handleNoteEdit}
        onNoteDelete={handleNoteDelete}
        onNewNote={handleNewNote}
      />

      <div className="flex-1 flex flex-col">
        {error && <ErrorBanner error={error} onDismiss={clearError} />}

        <div className="flex-1 p-8">{renderMainContent()}</div>
      </div>
    </div>
  );
}

export default App;
