package models

import "time"

type Response struct {
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

type ReplaySnapshot struct {
	ReleaseState     string            `json:"releaseState"`
	ValidationState  string            `json:"validationState"`
	TrialState       string            `json:"trialState"`
	DeploymentState  string            `json:"deploymentState"`
	NotificationState string           `json:"notificationState"`
	Aircraft         string            `json:"aircraft"`
	TriggeredBy      string            `json:"triggeredBy"`
	RelatedData      map[string]string `json:"relatedData"`
}

type ReleaseEvent struct {
	Step           string            `json:"step"`
	Event          string            `json:"event"`
	Timestamp      string            `json:"timestamp"`
	Status         string            `json:"status"`
	Actor          string            `json:"actor"`
	Logs           []string          `json:"logs"`
	FailureReason  string            `json:"failureReason,omitempty"`
	RelatedData    map[string]string `json:"relatedData,omitempty"`
	Recommendation string            `json:"recommendation,omitempty"`
	Snapshot       ReplaySnapshot    `json:"snapshot"`
}

type Release struct {
	ID          string         `json:"id" bson:"_id"`
	Name        string         `json:"name"`
	Version     string         `json:"version"`
	Status      string         `json:"status"`
	EventCount  int            `json:"eventCount"`
	LastUpdated string         `json:"lastUpdated"`
	Environment string         `json:"environment"`
	TriggeredBy string         `json:"triggeredBy"`
	Summary     string         `json:"summary"`
	Description string         `json:"description"`
	Events      []ReleaseEvent `json:"events"`
	ContentHash string         `json:"contentHash" bson:"contentHash"`
	CreatedAt   time.Time      `json:"createdAt" bson:"createdAt"`
	UpdatedAt   time.Time      `json:"updatedAt" bson:"updatedAt"`
}

type ReplayResponse struct {
	Release       Release       `json:"release"`
	SelectedIndex int           `json:"selectedIndex"`
	SelectedEvent ReleaseEvent  `json:"selectedEvent"`
	VisibleEvents []ReleaseEvent `json:"visibleEvents"`
}
