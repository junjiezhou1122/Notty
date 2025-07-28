package handlers

import (
	"net/http" // Standard library for HTTP client and server functionality
	"note/backend/models"
	"strconv" // Standard library for string conversions (string to int, float, etc.)
	"time"    // Standard library for time-related operations and formatting

	"github.com/labstack/echo/v4" // Echo web framework for building REST APIs
)

var notes []models.Note
var nextID int = 1

// c.Json send the notes to the client
func GetNotes(c echo.Context) error {
	return c.JSON(http.StatusOK, notes)
}

// Create the notes
func CreateNote(c echo.Context) error {
	note := new(models.Note)
	if err := c.Bind(note); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON"})
	}
	
	// Validate required fields
	if note.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Title is required"})
	}
	
	// Set server-generated fields
	note.ID = nextID
	nextID++
	note.CreatedAt = time.Now()
	
	notes = append(notes, *note)
	return c.JSON(http.StatusCreated, note)
}

// Get a specific note by ID
func GetNote(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid note ID"})
	}
	for _, note := range notes {
		if note.ID == id {
			return c.JSON(http.StatusOK, note)
		}
	}
	return c.JSON(http.StatusNotFound, map[string]string{"error": "Note not found"})
}

// Update a specific note by ID
func UpdateNote(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid note ID"})
	}
	
	// Parse JSON from request
	updatedNote := new(models.Note)
	if err := c.Bind(updatedNote); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid JSON"})
	}
	
	// Validate required fields
	if updatedNote.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Title is required"})
	}
	
	// Find and update the note
	for i, note := range notes {
		if note.ID == id {
			updatedNote.ID = id // Preserve the ID
			updatedNote.CreatedAt = note.CreatedAt // Preserve creation time
			notes[i] = *updatedNote
			return c.JSON(http.StatusOK, updatedNote)
		}
	}
	return c.JSON(http.StatusNotFound, map[string]string{"error": "Note not found"})
}

// Delete a specific note by ID
func DeleteNote(c echo.Context) error {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid note ID"})
	}
	for i, note := range notes {
		if note.ID == id {
			notes = append(notes[:i], notes[i+1:]...)
			return c.JSON(http.StatusOK, map[string]string{"message": "Note deleted successfully"})
		}
	}
	return c.JSON(http.StatusNotFound, map[string]string{"error": "Note not found"})
}


