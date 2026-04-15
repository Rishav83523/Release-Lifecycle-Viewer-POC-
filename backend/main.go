package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"release-manager/config"
	"release-manager/handlers"
	"release-manager/middleware"
)

func main() {
	// Initialize database
	config.Init()
	defer func() {
		if err := config.Close(); err != nil {
			log.Printf("Error closing database: %v", err)
		}
	}()

	// Seed initial data
	config.Seed()

	// Create Gin router
	router := gin.Default()

	// Middleware
	router.Use(middleware.CORS())

	// Routes
	router.GET("/api/health", handlers.HealthCheck)

	// Releases CRUD
	router.GET("/api/releases", handlers.GetReleases)
	router.POST("/api/releases", handlers.CreateRelease)
	router.GET("/api/releases/:id", handlers.GetReleaseByID)
	router.PATCH("/api/releases/:id", handlers.UpdateRelease)
	router.DELETE("/api/releases/:id", handlers.DeleteRelease)

	// Replay
	router.GET("/api/releases/:id/replay", handlers.GetReplayState)

	// Run server
	port := ":8000"
	log.Printf("Server running on http://localhost%s\n", port)
	if err := router.Run(port); err != nil {
		log.Fatal(err)
	}
}
