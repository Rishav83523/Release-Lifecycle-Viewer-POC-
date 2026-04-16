import '../../styles/common/StatusOverview.css'

export default function StatusOverview({ releases = [] }) {
  const passed = releases.filter((release) => release.status === 'Passed').length
  const failed = releases.filter((release) => release.status === 'Failed').length
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
    <div className="overview-card">
      <h3>Overview</h3>
      <div className="progress-grid">
        <CircleProgress value={total} max={100} label="Total Releases" color="blue" />
        <CircleProgress value={passed} max={safeTotal} label="Passed" color="green" />
        <CircleProgress value={failed} max={safeTotal} label="Failed" color="red" />
        <CircleProgress value={successRate} max={100} label="Success Rate" color="blue" />
      </div>
    </div>
  )
}
