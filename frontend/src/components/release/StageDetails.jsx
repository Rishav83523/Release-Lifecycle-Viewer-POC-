import { useState, useEffect, useRef } from 'react'
import '../../styles/release/StageDetails.css'
import LogsViewer from '../common/LogsViewer'

export default function StageDetails({
  event,
  eventIndex,
  totalEvents,
  onPrevEvent,
  onNextEvent,
  onReplay,
  replayError,
  isAutoRunning,
  runningEventIndex,
}) {
  const [suggestion, setSuggestion] = useState(event?.recommendation || '')
  const [loadingSuggestion, setLoadingSuggestion] = useState(false)
  const fetchedFailureRef = useRef(null)

  useEffect(() => {
    if (!event || !event.failureReason || event.status !== 'failed') {
      return
    }

    // Skip if we already fetched for this failure reason
    if (fetchedFailureRef.current === event.failureReason) {
      return
    }

    // Always fetch suggestion from Groq API for failures
    const fetchSuggestion = async () => {
      setLoadingSuggestion(true)
      try {
        const response = await fetch('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            failureReason: event.failureReason,
            eventType: event.step || event.event,
            releaseInfo: `Status: ${event.status}`,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          setSuggestion(data.suggestion)
          fetchedFailureRef.current = event.failureReason
        } else {
          setSuggestion('Unable to generate suggestion. Please review the logs.')
        }
      } catch (error) {
        console.error('Failed to fetch suggestion:', error)
        setSuggestion('Unable to generate suggestion. Please review the logs.')
      } finally {
        setLoadingSuggestion(false)
      }
    }

    fetchSuggestion()
  }, [event?.failureReason, event?.status])

  if (!event) {
    return null
  }

  const snapshotEntries = Object.entries(event.snapshot || {}).filter(([key]) => key !== 'relatedData')
  const isRunning = runningEventIndex === eventIndex
  const statusLabel = isRunning
    ? 'Running'
    : event.status === 'failed'
      ? 'Failed'
      : 'success' === event.status || event.status === 'passed'
        ? 'Passed'
        : 'Pending'

  return (
    <div className="stage-details">
      <div className="details-header">
        <div className="stage-title">
          <h2>{event.step}</h2>
          <div className="stage-meta">
            <span className={`status-badge ${event.status}`}>
              {statusLabel}
            </span>
            <span className="duration">{event.timestamp || 'Timestamp unavailable'}</span>
          </div>
        </div>
        <div className="navigation-buttons">
          <button
            className="nav-btn"
            onClick={onPrevEvent}
            disabled={eventIndex === 0 || isAutoRunning}
          > 
            ← Prev
          </button>
          <button className="replay-btn" onClick={onReplay} disabled={isAutoRunning}>
            {isAutoRunning ? 'Running...' : '⟲ Replay step'}
          </button>
          <button
            className="nav-btn"
            onClick={onNextEvent}
            disabled={eventIndex === totalEvents - 1 || isAutoRunning}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="context-section">
        <h3>Event Metadata</h3>
        <div className="context-grid">
          <div className="context-item">
            <p className="context-label">Actor</p>
            <p className="context-value">{event.actor || 'System'}</p>
          </div>
          <div className="context-item">
            <p className="context-label">Event</p>
            <p className="context-value">{event.event || 'n/a'}</p>
          </div>
          <div className="context-item">
            <p className="context-label">Step</p>
            <p className="context-value">{eventIndex + 1} / {totalEvents}</p>
          </div>
          <div className="context-item">
            <p className="context-label">Triggered By</p>
            <p className="context-value">{event.snapshot?.triggeredBy || 'System'}</p>
          </div>
          <div className="context-item">
            <p className="context-label">Running Now</p>
            <p className="context-value">{runningEventIndex === eventIndex ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {!isRunning && event.failureReason && (
        <div className="failure-points-section">
          <h3>Failure Reason</h3>
          <div className="error-alert">
            <div className="error-content">
              <h4>{event.failureReason}</h4>
              <div className="suggestion-box">
                <span className="suggestion-label">
                  💡 Suggestion:{loadingSuggestion ? ' Generating...' : ''}
                </span>
                <p>{suggestion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {replayError && (
        <div className="failure-points-section">
          <h3>Replay API Error</h3>
          <div className="error-alert">
            <div className="error-icon">⚠</div>
            <div className="error-content">
              <h4>Step trigger failed</h4>
              <p>{replayError}</p>
            </div>
          </div>
        </div>
      )}

      <div className="context-section">
        <h3>State Snapshot</h3>
        <div className="context-grid">
          {snapshotEntries.map(([key, value]) => (
            <div key={key} className="context-item">
              <p className="context-label">{key.replace(/([A-Z])/g, ' $1').replace(/^./, (character) => character.toUpperCase())}</p>
              <p className="context-value">{typeof value === 'object' ? JSON.stringify(value) : value || 'n/a'}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="logs-section">
        <h3>Logs</h3>
        {isRunning ? (
          <div className="logs-viewer running-state">
            <div className="no-logs">Logs will appear after this step completes</div>
          </div>
        ) : (
          <LogsViewer logs={event.logs || []} />
        )}
      </div>
    </div>
  )
}
