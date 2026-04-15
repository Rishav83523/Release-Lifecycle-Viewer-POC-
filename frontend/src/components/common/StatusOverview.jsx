import '../../styles/common/StatusOverview.css'

export default function StatusOverview({ releases = [] }) {
  const passed = releases.filter((release) => release.status === 'Passed').length
  const failed = releases.filter((release) => release.status === 'Failed').length
  const inProgress = releases.filter((release) => release.status === 'In Progress').length
  const total = releases.length
  const safeTotal = total || 1
  const successRate = total === 0 ? 0 : Math.round((passed / total) * 100)

  const CircleProgress = ({ value, max, label, color }) => {
    const percentage = (value / max) * 100
    const circumference = 2 * Math.PI * 45
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div className="circle-progress-item">
        <div className="circle-progress-wrapper">
          <svg viewBox="0 0 100 100" className="circle-progress-svg">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="circle-background"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`circle-progress ${color}`}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset: strokeDashoffset,
              }}
            />
          </svg>
          <div className="circle-content">
            <div className="circle-value">{value}</div>
            <div className="circle-percent">{Math.round(percentage)}%</div>
          </div>
        </div>
        <div className="circle-label">{label}</div>
      </div>
    )
  }

  return (
    <div className="status-overview">
      <div className="overview-card">
        <h3>Overview</h3>
        <div className="progress-grid">
          <CircleProgress value={total} max={100} label="Total Releases" color="blue" />
          <CircleProgress value={passed} max={safeTotal} label="Passed" color="green" />
          <CircleProgress value={failed} max={safeTotal} label="Failed" color="red" />
          <CircleProgress value={successRate} max={100} label="Success Rate" color="blue" />
        </div>
      </div>

      <div className="overview-card">
        <h3>Latest Activity</h3>
        <div className="activity-list">
          {releases.slice(0, 2).map((release) => (
            <div key={release.id} className="activity-item">
              <span className={`activity-dot ${release.status.toLowerCase()}`}></span>
              <div className="activity-info">
                <p>{release.name}</p>
                <span>{release.version}</span>
              </div>
              <span className="time">{release.environment}</span>
            </div>
          ))}
          {inProgress > 0 && (
            <div className="activity-item">
              <span className="activity-dot in-progress"></span>
              <div className="activity-info">
                <p>{inProgress} release{inProgress > 1 ? 's' : ''} replaying</p>
                <span>Event history available</span>
              </div>
              <span className="time">now</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
