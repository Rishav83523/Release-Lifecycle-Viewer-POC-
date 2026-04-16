package handlers

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"release-manager/config"
	"release-manager/models"
	"release-manager/validation"
)

func GetReleases(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	limit := 100
	offset := 0
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 1000 {
			limit = l
		}
	}
	if offsetStr := c.Query("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	total, err := config.ReleasesCollection.EstimatedDocumentCount(ctx)
	if err != nil {
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}

	opts := options.Find().SetSkip(int64(offset)).SetLimit(int64(limit)).SetSort(bson.M{"updatedAt": -1})
	cursor, err := config.ReleasesCollection.Find(ctx, bson.M{}, opts)
	if err != nil {
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}
	defer cursor.Close(ctx)

	var releases []models.Release
	if err = cursor.All(ctx, &releases); err != nil {
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}

	summaries := make([]map[string]interface{}, 0)
	for _, release := range releases {
		summaries = append(summaries, map[string]interface{}{
			"id":          release.ID,
			"name":        release.Name,
			"version":     release.Version,
			"status":      release.Status,
			"eventCount":  release.EventCount,
			"lastUpdated": release.LastUpdated,
			"environment": release.Environment,
			"triggeredBy": release.TriggeredBy,
		})
	}

	c.JSON(200, map[string]interface{}{
		"message": "Releases fetched successfully",
		"data":    summaries,
		"pagination": map[string]interface{}{
			"total":  total,
			"limit":  limit,
			"offset": offset,
			"count":  len(summaries),
		},
	})
}

func CreateRelease(c *gin.Context) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var payload models.Release
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Error: "Invalid release payload"})
		return
	}

	if len(payload.Events) == 0 {
		c.JSON(http.StatusBadRequest, models.Response{Error: "Release must include at least one event"})
		return
	}

	for _, event := range payload.Events {
		if event.Logs == nil || len(event.Logs) == 0 {
			c.JSON(http.StatusBadRequest, models.Response{Error: "Each event must have logs field"})
			return
		}
		if event.Snapshot.ReleaseState == "" {
			c.JSON(http.StatusBadRequest, models.Response{Error: "Each event must have snapshot field"})
			return
		}
	}

	// Compute content hash to prevent duplicates
	contentHash, err := computeContentHash(payload.Events)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.Response{Error: "Failed to process release"})
		return
	}

	// Check if content already exists
	existing := config.ReleasesCollection.FindOne(ctx, bson.M{"contentHash": contentHash})
	if existing.Err() == nil {
		// Content already exists
		c.JSON(http.StatusConflict, models.Response{Error: "This release content already exists. Uploading the same JSON multiple times is not allowed."})
		return
	} else if existing.Err() != mongo.ErrNoDocuments {
		// Database error
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}

	payload.ContentHash = contentHash

	validationResult := validation.ValidateRelease(&payload)

	if !validationResult.Passed {
		validation.AddValidationEventsToRelease(&payload, validationResult)
	}

	additionalEvents := validation.ValidateDeploymentEvents(&payload)
	if len(additionalEvents) > 0 {
		payload.Events = append(payload.Events, additionalEvents...)
	}

	now := time.Now().UTC()
	payload.LastUpdated = now.Format(time.RFC3339)
	payload.EventCount = len(payload.Events)
	payload.Status = deriveStatus(payload.Events)
	payload.UpdatedAt = now

	existing = config.ReleasesCollection.FindOne(ctx, bson.M{"_id": payload.ID})
	if existing.Err() == nil {
		_, err := config.ReleasesCollection.ReplaceOne(ctx, bson.M{"_id": payload.ID}, payload)
		if err != nil {
			c.JSON(500, models.Response{Error: "Failed to update release"})
			return
		}
		c.JSON(200, models.Response{Message: "Release updated successfully", Data: payload})
		return
	}

	payload.CreatedAt = now
	_, err = config.ReleasesCollection.InsertOne(ctx, payload)
	if err != nil {
		c.JSON(500, models.Response{Error: "Failed to create release"})
		return
	}

	c.JSON(201, models.Response{Message: "Release uploaded successfully", Data: payload})
}

func GetReleaseByID(c *gin.Context) {
	releaseID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var release models.Release
	err := config.ReleasesCollection.FindOne(ctx, bson.M{"_id": releaseID}).Decode(&release)
	if err == mongo.ErrNoDocuments {
		c.JSON(404, models.Response{Error: "Release not found"})
		return
	}
	if err != nil {
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}

	c.JSON(200, models.Response{Message: "Release fetched successfully", Data: release})
}

func UpdateRelease(c *gin.Context) {
	releaseID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var payload models.Release
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, models.Response{Error: "Invalid request payload"})
		return
	}

	if len(payload.Events) > 0 {
		for _, event := range payload.Events {
			if event.Logs == nil || len(event.Logs) == 0 {
				c.JSON(http.StatusBadRequest, models.Response{Error: "Each event must have logs field"})
				return
			}
			if event.Snapshot.ReleaseState == "" {
				c.JSON(http.StatusBadRequest, models.Response{Error: "Each event must have snapshot field"})
				return
			}
		}
	}

	var existing models.Release
	err := config.ReleasesCollection.FindOne(ctx, bson.M{"_id": releaseID}).Decode(&existing)
	if err == mongo.ErrNoDocuments {
		c.JSON(404, models.Response{Error: "Release not found"})
		return
	}
	if err != nil {
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}

	if payload.Name != "" {
		existing.Name = payload.Name
	}
	if payload.Environment != "" {
		existing.Environment = payload.Environment
	}
	if payload.Description != "" {
		existing.Description = payload.Description
	}
	if payload.Summary != "" {
		existing.Summary = payload.Summary
	}
	if len(payload.Events) > 0 {
		existing.Events = payload.Events
		existing.EventCount = len(payload.Events)
		existing.Status = deriveStatus(payload.Events)
	}

	existing.UpdatedAt = time.Now().UTC()
	existing.LastUpdated = existing.UpdatedAt.Format(time.RFC3339)

	_, err = config.ReleasesCollection.ReplaceOne(ctx, bson.M{"_id": releaseID}, existing)
	if err != nil {
		c.JSON(500, models.Response{Error: "Failed to update release"})
		return
	}

	c.JSON(200, models.Response{Message: "Release updated successfully", Data: existing})
}

func DeleteRelease(c *gin.Context) {
	releaseID := c.Param("id")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := config.ReleasesCollection.DeleteOne(ctx, bson.M{"_id": releaseID})
	if err != nil {
		c.JSON(500, models.Response{Error: "Database error"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(404, models.Response{Error: "Release not found"})
		return
	}

	c.JSON(200, models.Response{
		Message: "Release deleted successfully",
		Data:    map[string]string{"id": releaseID},
	})
}

func deriveStatus(events []models.ReleaseEvent) string {
	if len(events) == 0 {
		return "Unknown"
	}

	for _, event := range events {
		if event.Status == "failed" {
			return "Failed"
		}
	}

	return "Passed"
}

func computeContentHash(events []models.ReleaseEvent) (string, error) {
	// Serialize events to JSON for hashing to get consistent hash
	eventsJSON, err := json.Marshal(events)
	if err != nil {
		return "", fmt.Errorf("failed to marshal events: %w", err)
	}

	hash := sha256.Sum256(eventsJSON)
	return hex.EncodeToString(hash[:]), nil
}
