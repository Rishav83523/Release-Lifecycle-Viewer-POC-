import '../styles/StageTracker.css'

export default function StageTracker({ stages, currentStage, onSelectStage }) {
  // Find the first failed stage
  const firstFailedIndex = stages.findIndex(stage => stage.status === 'failed')

  // Check if any stage has failed
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

  const getStageIcon = (index) => {
    const stageStatus = getStageStatus(index)

    if (stageStatus === 'disabled') {
      return '✕'
    }

    if (stages[index]?.status === 'passed') {
      return '✓'
    }

    if (stages[index]?.status === 'failed') {
      return '✕'
    }

    if (stageStatus === 'completed') {
      return '✓'
    }

    if (stageStatus === 'current') {
      return '●'
    }

    return ''
  }

  return (
    <div className="stage-tracker">
      <div className="tracker-content">
        {stages.map((stage, index) => {
          const statusClass = getStageStatus(index)
          const isDisabled = statusClass === 'disabled' || (hasFailed && index > firstFailedIndex)

          return (
            <div key={index} className="tracker-item">
              <button
                className={`tracker-dot ${statusClass} ${stage.status}`}
                onClick={() => !isDisabled && onSelectStage(index)}
                disabled={isDisabled}
                title={isDisabled ? `Cannot proceed - ${stages[firstFailedIndex]?.name} failed` : stage.name}
              >
                {getStageIcon(index)}
              </button>
              {index < stages.length - 1 && (
                <div className={`tracker-line ${statusClass}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
