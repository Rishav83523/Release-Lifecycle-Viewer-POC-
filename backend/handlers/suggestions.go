package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

type SuggestionRequest struct {
	FailureReason string `json:"failureReason" binding:"required"`
	EventType     string `json:"eventType"`
	ReleaseInfo   string `json:"releaseInfo"`
}

type GroqRequest struct {
	Model    string `json:"model"`
	Messages []map[string]string `json:"messages"`
	MaxTokens int `json:"max_tokens"`
}

type GroqResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func GenerateSuggestion(c *gin.Context) {
	var req SuggestionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		return
	}

	groqAPIKey := os.Getenv("GROQ_API_KEY")
	if groqAPIKey == "" {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "Groq API key not configured"})
		return
	}

	// Create the prompt for Groq
	prompt := fmt.Sprintf(`You are a deployment expert. A deployment failed with the following reason: "%s"

Event Type: %s
Release Info: %s

Provide a concise, actionable suggestion to fix this issue. Keep it to 1-2 sentences max.`,
		req.FailureReason, req.EventType, req.ReleaseInfo)

	groqReq := GroqRequest{
		Model: "llama-3.3-70b-versatile",
		Messages: []map[string]string{
			{
				"role":    "user",
				"content": prompt,
			},
		},
		MaxTokens: 150,
	}

	requestBody, err := json.Marshal(groqReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create request"})
		return
	}

	// Call Groq API
	httpReq, err := http.NewRequest("POST", "https://api.groq.com/openai/v1/chat/completions", bytes.NewBuffer(requestBody))
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create HTTP request"})
		return
	}

	httpReq.Header.Set("Authorization", "Bearer "+groqAPIKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to call Groq API"})
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to read response"})
		return
	}

	if resp.StatusCode != http.StatusOK {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": fmt.Sprintf("Groq API error: %s", string(body))})
		return
	}

	var groqResp GroqResponse
	if err := json.Unmarshal(body, &groqResp); err != nil {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to parse Groq response"})
		return
	}

	if len(groqResp.Choices) == 0 {
		c.JSON(http.StatusInternalServerError, map[string]string{"error": "No response from Groq"})
		return
	}

	suggestion := groqResp.Choices[0].Message.Content

	c.JSON(http.StatusOK, map[string]string{
		"suggestion": suggestion,
	})
}
