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
  const logTypes = ['All', 'INFO', 'LOG', 'OK', 'SUCCESS', 'Errors', 'Warnings']

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

      {/* Stage Stats */}
      {stats && (
        <div className="stats-section">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="stat">
              <p className="stat-label">{key.charAt(0).toUpperCase() + key.slice(1)}</p>
              <p className="stat-value">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="error-alert">
          <div className="error-icon">⚠</div>
          <div className="error-content">
            <h3>{error.title}</h3>
            <p>{error.message}</p>
          </div>
        </div>
      )}

      {/* Logs */}
      <div className="logs-section">
        <h3>Logs</h3>
        <div className="logs-filters">
          {logTypes.map((type) => (
            <button
              key={type}
              className={`filter-btn ${logFilter === type ? 'active' : ''}`}
              onClick={() => onFilterChange(type)}
            >
              {type}
              {type !== 'All' && ` (${logs.length})`}
            </button>
          ))}
        </div>
        <LogsViewer logs={logs} />
      </div>
    </div>
  )
}
