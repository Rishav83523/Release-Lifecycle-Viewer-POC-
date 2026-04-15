package handlers

import (
	"context"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"release-manager/config"
	"release-manager/models"
)

func GetReplayState(c *gin.Context) {
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

	index := len(release.Events) - 1
	if queryStep := c.Query("step"); queryStep != "" {
		if parsedIndex, err := strconv.Atoi(queryStep); err == nil {
			index = parsedIndex
		}
	}

	if index < 0 {
		index = 0
	}
	if index >= len(release.Events) {
		index = len(release.Events) - 1
	}

	c.JSON(200, models.Response{
		Message: "Replay state fetched successfully",
		Data: models.ReplayResponse{
			Release:       release,
			SelectedIndex: index,
			SelectedEvent: release.Events[index],
			VisibleEvents: release.Events[:index+1],
		},
	})
}
