import '../../styles/common/LatestActivity.css'

export default function LatestActivity({ releases = [] }) {
  const inProgress = releases.filter((release) => release.status === 'In Progress').length

  return (
    <div className="latest-activity-card">
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
  )
}
