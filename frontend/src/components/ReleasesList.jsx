import './ReleasesList.css'

export default function ReleasesList({ releases, loading }) {
  if (loading) {
    return <div className="loading">Loading releases...</div>
  }

  if (!releases || releases.length === 0) {
    return <div className="empty-state">No releases yet. Upload one to get started!</div>
  }

  return (
    <div className="releases-list">
      <h2>Recent Releases</h2>
      <div className="releases-container">
        {releases.map((release, index) => (
          <div key={index} className="release-card">
            <div className="release-header">
              <h3>{release.fileName}</h3>
              <span className="version-badge">{release.version}</span>
            </div>
            <div className="release-info">
              <p><strong>Size:</strong> {(release.fileSize / 1024).toFixed(2)} KB</p>
              <p><strong>Uploaded:</strong> {new Date(release.uploadedAt).toLocaleDateString()}</p>
            </div>
            {release.description && <p className="description">{release.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
