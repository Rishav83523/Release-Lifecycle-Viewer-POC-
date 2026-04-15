import '../../styles/common/Sidebar.css'

export default function Sidebar({
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

  const getStatusIcon = (index, status) => {
    if (status === 'disabled') {
      return '✕'
    }

    if (status === 'running') {
      return '↻'
    }

    if (status === 'completed') {
      return '✓'
    }

    if (status === 'failed') {
      return '✕'
    }

    if (status === 'failed') {
      return '✕'
    }

    switch (status) {
      case 'completed':
        return '✓'
      case 'current':
        return '●'
      default:
        return '○'
    }
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h3>Event history</h3>
      </div>
      <div className="stages-list">
        {events.map((event, index) => {
          const status = getStageStatus(index)
          const isDisabled = isAutoRunning || status === 'disabled'
          const isDone = status === 'completed' || status === 'failed'
          const isRunning = status === 'running'

          return (
            <button
              key={index}
              className={`stage-item ${status}`}
              onClick={() => !isDisabled && onSelectEvent(index)}
              disabled={isDisabled}
              title={isDisabled ? `Cannot proceed - ${events[firstFailedIndex]?.step} failed` : event.step}
            >
              <span className={`stage-icon ${status}`}>
                {isDone || status === 'running' || status === 'current' ? getStatusIcon(index, status) : ''}
              </span>
              {isRunning && <span className="stage-running-label">Running</span>}
              <div className="stage-text">
                <p className="stage-name">{event.step}</p>
                <p className="stage-duration">{event.timestamp || event.status}</p>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
