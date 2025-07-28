package main

import (
    "github.com/labstack/echo/v4"
    "github.com/labstack/echo/v4/middleware"
    "note/backend/handlers"
)

func main() {
	// Create Echo instance
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Routes
	e.GET("/api/notes", handlers.GetNotes)
	e.POST("/api/notes", handlers.CreateNote)
	e.GET("/api/notes/:id", handlers.GetNote)
	e.PUT("/api/notes/:id", handlers.UpdateNote)
	e.DELETE("/api/notes/:id", handlers.DeleteNote)

	// Start server. If it fails to start, it will log the error and exit the program
	e.Logger.Fatal(e.Start(":8080"))

}