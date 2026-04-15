package validation

import (
	"fmt"
	"strings"

	"release-manager/models"
)

type ValidationRule struct {
	Name           string
	Check          func(release *models.Release) (bool, string)
	Recommendation string
}

type ValidationResult struct {
	Passed          bool
	FailedRules     []string
	FailureReasons  map[string]string
	Recommendations map[string]string
}

var rules = []ValidationRule{
	{
		Name: "Aircraft Reachable",
		Check: func(release *models.Release) (bool, string) {
			aircraft := getAircraftFromRelease(release)
			if aircraft == "" {
				return false, "No aircraft specified in release"
			}
			if strings.Contains(strings.ToLower(aircraft), "offline") ||
				strings.Contains(strings.ToLower(aircraft), "unreachable") {
				return false, fmt.Sprintf("Aircraft %s is unreachable or offline", aircraft)
			}
			return true, ""
		},
		Recommendation: "Ensure the aircraft/device is powered on, connected to network, and accessible. Check network connectivity and firewall rules.",
	},
	{
		Name: "Release Approver Exists",
		Check: func(release *models.Release) (bool, string) {
			approver := getReleaseApprover(release)
			if approver == "" {
				return false, "No release approver specified"
			}
			knownApprovers := map[string]bool{
				"admin":       true,
				"qa-team":     true,
				"devops":      true,
				"test user":   true,
				"manual test": true,
			}
			if !knownApprovers[strings.ToLower(approver)] {
				return false, fmt.Sprintf("Approver '%s' does not exist in system", approver)
			}
			return true, ""
		},
		Recommendation: "Verify the approver exists in the system. Valid approvers: admin, qa-team, devops, test user, manual test",
	},
	{
		Name: "Document Attached",
		Check: func(release *models.Release) (bool, string) {
			if release.Summary == "" && release.Description == "" {
				return false, "No documentation attached to release"
			}
			return true, ""
		},
		Recommendation: "Attach release documentation including summary and description. Document should include change details, testing results, and deployment instructions.",
	},
	{
		Name: "Version Format Valid",
		Check: func(release *models.Release) (bool, string) {
			if release.Version == "" {
				return false, "No version specified"
			}
			if !strings.HasPrefix(release.Version, "v") {
				return false, fmt.Sprintf("Invalid version format: %s (should start with 'v')", release.Version)
			}
			return true, ""
		},
		Recommendation: "Use semantic versioning format: vMAJOR.MINOR.PATCH (e.g., v1.2.3)",
	},
	{
		Name: "No Duplicate Version",
		Check: func(release *models.Release) (bool, string) {
			if strings.Contains(release.Version, "0.0.0") {
				return false, "Version 0.0.0 is reserved and cannot be deployed"
			}
			return true, ""
		},
		Recommendation: "Increment the version number. Same or lower version already exists in the system.",
	},
}

var eventRules = []ValidationRule{
	{
		Name: "Validation Events Required",
		Check: func(release *models.Release) (bool, string) {
			hasValidation := false
			for _, event := range release.Events {
				if strings.Contains(strings.ToLower(event.Event), "validation") {
					hasValidation = true
					break
				}
			}
			if !hasValidation {
				return false, "No validation events found in release"
			}
			return true, ""
		},
		Recommendation: "Ensure validation stage is included in the release pipeline with proper validation events.",
	},
	{
		Name: "Deployment Events Required",
		Check: func(release *models.Release) (bool, string) {
			hasDeployment := false
			for _, event := range release.Events {
				if strings.Contains(strings.ToLower(event.Event), "deploy") {
					hasDeployment = true
					break
				}
			}
			if !hasDeployment {
				return false, "No deployment events found in release"
			}
			return true, ""
		},
		Recommendation: "Ensure deployment stage is included in the release pipeline with proper deployment events.",
	},
	{
		Name: "Health Check After Deployment",
		Check: func(release *models.Release) (bool, string) {
			foundDeployment := false
			foundHealthCheck := false
			for i, event := range release.Events {
				if strings.Contains(strings.ToLower(event.Event), "deploy") && event.Status != "failed" {
					foundDeployment = true
					if i+1 < len(release.Events) {
						nextEvent := release.Events[i+1]
						if strings.Contains(strings.ToLower(nextEvent.Event), "health") {
							foundHealthCheck = true
						}
					}
				}
			}
			if foundDeployment && !foundHealthCheck {
				return false, "No health check event after deployment"
			}
			return true, ""
		},
		Recommendation: "Add health check events after deployment. Include service responsiveness checks, API endpoint validations, and system health metrics.",
	},
}

func ValidateRelease(release *models.Release) ValidationResult {
	result := ValidationResult{
		Passed:          true,
		FailedRules:     []string{},
		FailureReasons:  make(map[string]string),
		Recommendations: make(map[string]string),
	}

	for _, rule := range rules {
		passed, reason := rule.Check(release)
		if !passed {
			result.Passed = false
			result.FailedRules = append(result.FailedRules, rule.Name)
			result.FailureReasons[rule.Name] = reason
			result.Recommendations[rule.Name] = rule.Recommendation
		}
	}

	for _, rule := range eventRules {
		passed, reason := rule.Check(release)
		if !passed {
			result.Passed = false
			result.FailedRules = append(result.FailedRules, rule.Name)
			result.FailureReasons[rule.Name] = reason
			result.Recommendations[rule.Name] = rule.Recommendation
		}
	}

	return result
}

func AddValidationEventsToRelease(release *models.Release, validationResult ValidationResult) {
	if len(validationResult.FailedRules) > 0 {
		validationEvent := models.ReleaseEvent{
			Step:      "Pre-Deployment Validation",
			Event:     "validation_check",
			Timestamp: release.Events[0].Timestamp,
			Status:    "failed",
			Actor:     "Rule Engine",
			Logs: append(
				[]string{"Pre-deployment validation checks failed:"},
				validationResult.FailedRules...,
			),
			FailureReason: strings.Join(validationResult.FailedRules, "; "),
			RelatedData: map[string]string{
				"failedRules": fmt.Sprintf("%d", len(validationResult.FailedRules)),
			},
			Recommendation: buildRecommendation(validationResult),
			Snapshot: models.ReplaySnapshot{
				ReleaseState:     "validation_failed",
				ValidationState:  "failed",
				TrialState:       "not_started",
				DeploymentState:  "not_started",
				NotificationState: "not_sent",
				RelatedData:      map[string]string{},
			},
		}
		release.Events = append([]models.ReleaseEvent{validationEvent}, release.Events...)
		release.EventCount = len(release.Events)
	}
}

func ValidateDeploymentEvents(release *models.Release) []models.ReleaseEvent {
	var newEvents []models.ReleaseEvent

	for i, event := range release.Events {
		if strings.Contains(strings.ToLower(event.Event), "deploy") && event.Status == "success" {
			if i+1 < len(release.Events) {
				nextEvent := release.Events[i+1]
				if strings.Contains(strings.ToLower(nextEvent.Event), "health") && nextEvent.Status == "failed" {
					timeoutEvent := models.ReleaseEvent{
						Step:      "Deployment Timeout Check",
						Event:     "deployment_timeout",
						Timestamp: event.Timestamp,
						Status:    "failed",
						Actor:     "Rule Engine",
						Logs: []string{
							"Deployment took too long or process is stuck",
							"Health check failed after deployment completion",
						},
						FailureReason: "Deployment timeout or stuck process detected",
						RelatedData: map[string]string{
							"timeout": "true",
						},
						Recommendation: "Check deployment logs for errors. Ensure services are running correctly. Verify database connectivity and external service availability.",
						Snapshot: models.ReplaySnapshot{
							ReleaseState:     "deployed",
							ValidationState:  "passed",
							TrialState:       "passed",
							DeploymentState:  "timeout",
							NotificationState: "not_sent",
							RelatedData:      map[string]string{},
						},
					}
					newEvents = append(newEvents, timeoutEvent)
				}
			}
		}
	}

	return newEvents
}

func getAircraftFromRelease(release *models.Release) string {
	for _, event := range release.Events {
		if event.Snapshot.Aircraft != "" {
			return event.Snapshot.Aircraft
		}
	}
	if release.Environment != "" {
		return release.Environment
	}
	return release.TriggeredBy
}

func getReleaseApprover(release *models.Release) string {
	if release.TriggeredBy != "" {
		return release.TriggeredBy
	}
	for _, event := range release.Events {
		if event.Actor != "" && event.Actor != "System" {
			return event.Actor
		}
	}
	return ""
}

func buildRecommendation(result ValidationResult) string {
	var recommendations []string
	for _, rule := range result.FailedRules {
		if rec, ok := result.Recommendations[rule]; ok {
			recommendations = append(recommendations, fmt.Sprintf("• %s: %s", rule, rec))
		}
	}
	return strings.Join(recommendations, "\n")
}

func GetValidationLogs(result ValidationResult) []string {
	var logs []string
	logs = append(logs, "=== Pre-Deployment Validation Results ===")

	for _, rule := range result.FailedRules {
		if reason, ok := result.FailureReasons[rule]; ok {
			logs = append(logs, fmt.Sprintf("❌ %s: %s", rule, reason))
		}
	}

	if result.Passed {
		logs = append(logs, "✅ All validation checks passed")
	}

	return logs
}
