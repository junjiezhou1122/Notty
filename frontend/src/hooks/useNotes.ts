import { useState, useEffect } from "react";
import type { Note, CreateNoteRequest, UpdateNoteRequest } from "../types/Note";
import { getNotes, createNote, updateNote, deleteNote } from "../services/api";

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all notes
  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      const notesData = await getNotes();
      setNotes(notesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
      console.error("Error loading notes:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new note
  const handleCreateNote = async (
    noteData: CreateNoteRequest
  ): Promise<Note | null> => {
    try {
      setError(null);
      const newNote = await createNote(noteData);
      setNotes((prevNotes) => [...prevNotes, newNote]);
      return newNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
      return null;
    }
  };

  // Update an existing note
  const handleUpdateNote = async (
    id: number,
    noteData: UpdateNoteRequest
  ): Promise<Note | null> => {
    try {
      setError(null);
      const updatedNote = await updateNote(id, noteData);
      setNotes((prevNotes) =>
        prevNotes.map((note) => (note.id === id ? updatedNote : note))
      );
      return updatedNote;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
      return null;
    }
  };

  // Delete a note
  const handleDeleteNote = async (id: number): Promise<boolean> => {
    try {
      setError(null);
      await deleteNote(id);
      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
      return false;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Load notes on mount
  useEffect(() => {
    loadNotes();
  }, []);

  return {
    notes,
    loading,
    error,
    loadNotes,
    createNote: handleCreateNote,
    updateNote: handleUpdateNote,
    deleteNote: handleDeleteNote,
    clearError,
  };
};
