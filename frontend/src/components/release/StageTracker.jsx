import '../../styles/release/StageTracker.css'

export default function StageTracker({
  events,
  currentEventIndex,
  onSelectEvent,
  runningEventIndex,
  stepStatuses,
  isAutoRunning,
}) {
  const firstFailedIndex = events.findIndex((event) => event.status === 'failed')

  const hasFailed = firstFailedIndex !== -1

  const getStageStatus = (index) => {
    if (runningEventIndex === index) {
      return 'running'
    }

    if (stepStatuses[index] === 'failed') {
      return 'failed'
    }

    if (stepStatuses[index] === 'passed') {
      return 'completed'
    }

    if (stepStatuses[index] === 'failed') {
      return 'failed'
    }

    if (hasFailed && index > firstFailedIndex) {
      return 'disabled'
    }

    if (stepStatuses[index] === 'pending' || stepStatuses[index] === undefined) {
      if (index === currentEventIndex && runningEventIndex === null) {
        return 'current'
      }

      return 'pending'
    }

    if (index < currentEventIndex) return 'completed'
    if (index === currentEventIndex) return 'current'
    return 'pending'
  }

  const getStageIcon = (index) => {
    const stageStatus = getStageStatus(index)

    if (stageStatus === 'disabled') {
      return '✕'
    }

    if (stageStatus === 'running') {
      return '↻'
    }

    if (stageStatus === 'completed') {
      return '✓'
    }

    if (stageStatus === 'failed') {
      return '✕'
    }

    if (stageStatus === 'current') {
      return '●'
    }

    return ''
  }

  return (
    <div className="stage-tracker">
      <div className="tracker-content">
        {events.map((event, index) => {
          const statusClass = getStageStatus(index)
          const isDisabled = isAutoRunning || statusClass === 'disabled' || (hasFailed && index > firstFailedIndex)
          const isDone = statusClass === 'completed' || statusClass === 'failed'
          const isRunning = statusClass === 'running'
          const lineStatus = stepStatuses[index] === 'completed' ? 'completed' : 'pending'

          return (
            <div key={index} className="tracker-item">
              <button
                className={`tracker-dot ${statusClass}`}
                onClick={() => !isDisabled && onSelectEvent(index)}
                disabled={isDisabled}
                title={isDisabled ? `Cannot proceed - ${events[firstFailedIndex]?.step} failed` : event.step}
              >
                {isDone || statusClass === 'running' || statusClass === 'current' ? getStageIcon(index) : ''}
              </button>
              {isRunning && <span className="tracker-running-label">Running</span>}
              {index < events.length - 1 && (
                <div className={`tracker-line ${lineStatus}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
