package handlers

import (
	"github.com/gin-gonic/gin"
)

func HealthCheck(c *gin.Context) {
	c.JSON(200, map[string]string{
		"message": "Server is healthy",
	})
}
