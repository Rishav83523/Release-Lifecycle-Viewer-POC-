import '../styles/Sidebar.css'

export default function Sidebar({ stages, currentStage, onSelectStage }) {
  // Find the first failed stage
  const firstFailedIndex = stages.findIndex(stage => stage.status === 'failed')
  const hasFailed = firstFailedIndex !== -1

  const getStageStatus = (index) => {
    // If there's a failure, stages after it can't be accessed
    if (hasFailed && index > firstFailedIndex) {
      return 'disabled'
    }

    if (index < currentStage) return 'completed'
    if (index === currentStage) return 'current'
    return 'pending'
  }

  const getStatusIcon = (index, status) => {
    if (status === 'disabled') {
      return '✕'
    }

    if (stages[index]?.status === 'passed') {
      return '✓'
    }

    if (stages[index]?.status === 'failed') {
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
        <h3>Pipeline stages</h3>
      </div>
      <div className="stages-list">
        {stages.map((stage, index) => {
          const status = getStageStatus(index)
          const isDisabled = status === 'disabled'

          return (
            <button
              key={index}
              className={`stage-item ${status} ${stage.status}`}
              onClick={() => !isDisabled && onSelectStage(index)}
              disabled={isDisabled}
              title={isDisabled ? `Cannot proceed - ${stages[firstFailedIndex]?.name} failed` : stage.name}
            >
              <span className={`stage-icon ${status}`}>
                {getStatusIcon(index, status)}
              </span>
              <div className="stage-text">
                <p className="stage-name">{stage.name}</p>
                <p className="stage-duration">{stage.duration}</p>
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
