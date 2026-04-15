package config

import (
	"context"
	"log"
	"time"

	"release-manager/models"
)

func Seed() {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	count, err := ReleasesCollection.EstimatedDocumentCount(ctx)
	if err != nil {
		log.Printf("Error checking collection: %v", err)
		return
	}

	if count > 0 {
		log.Println("Collection already has data, skipping seed")
		return
	}

	now := time.Now().UTC()
	seedData := []models.Release{
		{
			ID:          "payment-service-v2-5-0",
			Name:        "Payment Service",
			Version:     "v2.5.0",
			Status:      "Passed",
			EventCount:  3,
			LastUpdated: now.Format(time.RFC3339),
			Environment: "Production",
			TriggeredBy: "Pipeline",
			Summary:     "Payment service release",
			Description: "Successful payment service deployment",
			Events: []models.ReleaseEvent{
				{
					Step:      "Release Created",
					Event:     "release_created",
					Timestamp: now.Format(time.RFC3339),
					Status:    "success",
					Actor:     "Pipeline",
					Logs:      []string{"Release created successfully"},
					RelatedData: map[string]string{"releaseId": "payment-service-v2-5-0"},
					Snapshot: models.ReplaySnapshot{
						ReleaseState:     "created",
						ValidationState:  "not_started",
						TrialState:       "not_started",
						DeploymentState:  "not_started",
						NotificationState: "not_sent",
						Aircraft:         "PROD",
						TriggeredBy:      "Pipeline",
						RelatedData:      map[string]string{},
					},
				},
				{
					Step:      "Validation Passed",
					Event:     "validation_passed",
					Timestamp: now.Add(2 * time.Minute).Format(time.RFC3339),
					Status:    "success",
					Actor:     "Validator",
					Logs:      []string{"All checks passed"},
					RelatedData: map[string]string{"checks": "50/50"},
					Snapshot: models.ReplaySnapshot{
						ReleaseState:     "validated",
						ValidationState:  "passed",
						TrialState:       "not_started",
						DeploymentState:  "not_started",
						NotificationState: "not_sent",
						Aircraft:         "PROD",
						TriggeredBy:      "Validator",
						RelatedData:      map[string]string{},
					},
				},
				{
					Step:      "Deployment Completed",
					Event:     "deployment_completed",
					Timestamp: now.Add(5 * time.Minute).Format(time.RFC3339),
					Status:    "success",
					Actor:     "Deployment",
					Logs:      []string{"Deployment successful"},
					RelatedData: map[string]string{"env": "production"},
					Snapshot: models.ReplaySnapshot{
						ReleaseState:     "deployed",
						ValidationState:  "passed",
						TrialState:       "passed",
						DeploymentState:  "deployed",
						NotificationState: "sent",
						Aircraft:         "PROD",
						TriggeredBy:      "Deployment",
						RelatedData:      map[string]string{},
					},
				},
			},
			CreatedAt: now,
			UpdatedAt: now,
		},
	}

	ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	for _, release := range seedData {
		_, err := ReleasesCollection.InsertOne(ctx, release)
		if err != nil {
			log.Printf("Error inserting seed data: %v", err)
		}
	}

	log.Println("✅ Seeded initial data into MongoDB")
}
