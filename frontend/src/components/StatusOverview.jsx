import '../styles/StatusOverview.css'

export default function StatusOverview() {
  const stats = {
    total: 45,
    passed: 35,
    failed: 10,
    successRate: 77,
  }

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
          <CircleProgress value={stats.total} max={100} label="Total Releases" color="blue" />
          <CircleProgress value={stats.passed} max={stats.total} label="Passed" color="green" />
          <CircleProgress value={stats.failed} max={stats.total} label="Failed" color="red" />
          <CircleProgress value={stats.successRate} max={100} label="Success Rate" color="blue" />
        </div>
      </div>

      <div className="overview-card">
        <h3>Latest Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-dot passed"></span>
            <div className="activity-info">
              <p>Time Travel Debugger</p>
              <span>v4.2.1-RMT</span>
            </div>
            <span className="time">2m ago</span>
          </div>
          <div className="activity-item">
            <span className="activity-dot failed"></span>
            <div className="activity-info">
              <p>Analytics Service</p>
              <span>v2.0.0</span>
            </div>
            <span className="time">1h ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}
