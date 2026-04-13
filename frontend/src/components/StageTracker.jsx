import '../styles/StageTracker.css'

export default function StageTracker({ stages, currentStage, onSelectStage }) {
  return (
    <div className="stage-tracker">
      <div className="tracker-content">
        {stages.map((stage, index) => {
          let statusClass = 'pending'
          if (index < currentStage) statusClass = 'completed'
          else if (index === currentStage) statusClass = 'current'

          return (
            <div key={index} className="tracker-item">
              <button
                className={`tracker-dot ${statusClass} ${stage.status}`}
                onClick={() => onSelectStage(index)}
                title={stage.name}
              >
                {statusClass === 'completed' && '✓'}
                {statusClass === 'current' && '●'}
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
