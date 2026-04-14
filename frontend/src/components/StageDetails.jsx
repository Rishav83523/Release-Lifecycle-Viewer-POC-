import '../styles/StageDetails.css'
import LogsViewer from './LogsViewer'

export default function StageDetails({
  stage,
  currentStageIndex,
  stats,
  error,
  logs,
  logFilter,
  onFilterChange,
  onPrevStage,
  onNextStage,
}) {
  return (
    <div className="stage-details">
      <div className="details-header">
        <div className="stage-title">
          <h2>{stage.name}</h2>
          <div className="stage-meta">
            <span className={`status-badge ${stage.status}`}>
              {stage.status === 'passed'
                ? 'Passed'
                : stage.status === 'failed'
                  ? 'Failed'
                  : 'Pending'}
            </span>
            <span className="duration">{stage.duration}</span>
          </div>
        </div>
        <div className="navigation-buttons">
          <button
            className="nav-btn"
            onClick={onPrevStage}
            disabled={currentStageIndex === 0}
          >
            ← Prev
          </button>
          <button className="replay-btn">⟲ Replay</button>
          <button
            className="nav-btn"
            onClick={onNextStage}
            disabled={currentStageIndex === 5}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Context Section */}
      {stats && (
        <div className="context-section">
          <h3>Context</h3>
          <div className="context-grid">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="context-item">
                <p className="context-label">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
                <p className="context-value">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failure Points */}
      {error && stage.status === 'failed' && (
        <div className="failure-points-section">
          <h3>Failure Point</h3>
          <div className="error-alert">
            <div className="error-icon">⚠</div>
            <div className="error-content">
              <h4>{error.title}</h4>
              <p>{error.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="logs-section">
        <h3>Logs</h3>
        <LogsViewer logs={logs} />
      </div>
    </div>
  )
}
