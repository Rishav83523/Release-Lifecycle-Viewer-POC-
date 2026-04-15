export const API_BASE = "http://localhost:8000/api";

export function normalizeReleaseSummary(release) {
  const events = normalizeEvents(release.events || release.stages || []);
  const selectedStatus = release.status || deriveReleaseStatus(events);

  return {
    id:
      release.id ||
      release.ID ||
      release.releaseId ||
      slugify(release.name || release.fileName || "release"),
    name:
      release.name || release.Name || release.fileName || "Untitled Release",
    version: release.version || release.Version || "v0.0.0",
    status: selectedStatus,
    environment: release.environment || release.Environment || "Unknown",
    triggeredBy: release.triggeredBy || release.TriggeredBy || "System",
    summary:
      release.summary ||
      release.Summary ||
      release.description ||
      release.Description ||
      "",
    description: release.description || release.Description || "",
    events,
  };
}

export function normalizeEvents(events) {
  return events.map((event, index) => {
    const rawSnapshot = event.snapshot || {};
    const { relatedData: _ignoredRelatedData, ...snapshotWithoutRelatedData } =
      rawSnapshot;

    if (event.step || event.event) {
      return {
        id: event.id || `${index}`,
        step: event.step || event.name || event.event,
        event:
          event.event || slugify(event.step || event.name || `event-${index}`),
        timestamp: event.timestamp || event.time || "",
        status: event.status || "success",
        actor: event.actor || "System",
        logs: Array.isArray(event.logs) ? event.logs : [],
        failureReason: event.failureReason || event.reason || "",
        recommendation: event.recommendation || "",
        snapshot: snapshotWithoutRelatedData,
        duration: event.duration || "",
      };
    }

    const status = event.status || "success";
    const step = event.step || event.name || `Step ${index + 1}`;
    const failureReason = event.reason || "";
    const isFailed = status === "failed";

    return {
      id: `${index}`,
      step,
      event: slugify(step),
      timestamp: event.timestamp || "",
      status: isFailed ? "failed" : status === "passed" ? "success" : "pending",
      actor: event.actor || "System",
      logs: buildLogsFromLegacyStage(step, status, failureReason),
      failureReason,
      recommendation: isFailed
        ? "Investigate the failing gate and replay the event trail."
        : "",
      snapshot: {},
      duration: event.duration || "",
    };
  });
}

export function deriveReleaseStatus(events) {
  if (!events.length) {
    return "Unknown";
  }

  const hasFailure = events.some((event) => event.status === "failed");
  if (hasFailure) {
    return "Failed";
  }

  const hasPending = events.some((event) => event.status === "pending");
  if (hasPending) {
    return "In Progress";
  }

  return "Passed";
}

export function buildReplayView(release, selectedIndex) {
  const normalizedRelease = normalizeReleaseSummary(release);
  const clampedIndex = Math.max(
    0,
    Math.min(selectedIndex, normalizedRelease.events.length - 1),
  );
  const selectedEvent = normalizedRelease.events[clampedIndex] || null;
  const visibleEvents = normalizedRelease.events.slice(0, clampedIndex + 1);

  return {
    release: normalizedRelease,
    selectedIndex: clampedIndex,
    selectedEvent,
    visibleEvents,
  };
}

export function createUploadRelease(fileName, parsedData) {
  const release = normalizeReleaseSummary(parsedData);
  return {
    ...release,
    id: release.id || slugify(fileName.replace(/\.json$/i, "")),
    name:
      release.name === "Untitled Release"
        ? fileName.replace(/\.json$/i, "")
        : release.name,
  };
}

export async function fetchReplayState(releaseId, stepIndex) {
  const response = await fetch(
    `${API_BASE}/releases/${releaseId}/replay?step=${stepIndex}`,
  );
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Failed to fetch replay state");
  }

  return payload.data;
}

export async function uploadReleasePayload(payload) {
  const response = await fetch(`${API_BASE}/releases`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const responsePayload = await response.json();
  if (!response.ok) {
    throw new Error(responsePayload.error || "Failed to upload release");
  }

  return responsePayload.data;
}

function buildLogsFromLegacyStage(step, status, failureReason) {
  const logs = [
    `${step} started.`,
    status === "failed" ? "Gate evaluation failed." : "Gate evaluation passed.",
  ];

  if (failureReason) {
    logs.push(failureReason);
  }

  return logs;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
