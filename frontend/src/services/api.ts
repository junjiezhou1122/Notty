import type { Note, CreateNoteRequest, UpdateNoteRequest } from "../types/Note";

const API_BASE_URL = "http://localhost:8080/api";

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }
  return response.json();
}

// Get all notes
export async function getNotes(): Promise<Note[]> {
  const response = await fetch(`${API_BASE_URL}/notes`);
  return handleResponse<Note[]>(response);
}

// Get a specific note by ID
export async function getNote(id: number): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`);
  return handleResponse<Note>(response);
}

// Create a new note
export async function createNote(noteData: CreateNoteRequest): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(noteData),
  });
  return handleResponse<Note>(response);
}

// Update an existing note
export async function updateNote(
  id: number,
  noteData: UpdateNoteRequest
): Promise<Note> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(noteData),
  });
  return handleResponse<Note>(response);
}

// Delete a note
export async function deleteNote(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Network error" }));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }
}
