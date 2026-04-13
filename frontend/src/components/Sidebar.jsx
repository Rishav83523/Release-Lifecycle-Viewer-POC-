import '../styles/Sidebar.css'

export default function Sidebar({ stages, currentStage, onSelectStage }) {
  const getStageStatus = (index) => {
    if (index < currentStage) return 'completed'
    if (index === currentStage) return 'current'
    return 'pending'
  }

  const getStatusIcon = (status) => {
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
          return (
            <button
              key={index}
              className={`stage-item ${status} ${stage.status}`}
              onClick={() => onSelectStage(index)}
              title={stage.name}
            >
              <span className={`stage-icon ${status}`}>
                {getStatusIcon(status)}
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
