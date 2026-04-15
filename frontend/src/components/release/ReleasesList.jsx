import { useState } from 'react'
import '../../styles/release/ReleasesList.css'

export default function ReleasesList({ releases, loading, onSelectRelease, onEditRelease, onDeleteRelease }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
  const [editingReleaseId, setEditingReleaseId] = useState(null)
  const [fileInput, setFileInput] = useState(null)

  const handleEditClick = (e, releaseId) => {
    e.stopPropagation()
    setEditingReleaseId(releaseId)
    document.getElementById(`file-input-${releaseId}`)?.click()
  }

  const handleFileSelect = (e, releaseId) => {
    const file = e.target.files?.[0]
    if (file && onEditRelease) {
      onEditRelease(releaseId, file)
      setEditingReleaseId(null)
    }
  }

  const handleDeleteClick = (e, releaseId) => {
    e.stopPropagation()
    setShowDeleteConfirm(releaseId)
  }

  const confirmDelete = (releaseId) => {
    if (onDeleteRelease) {
      onDeleteRelease(releaseId)
      setShowDeleteConfirm(null)
    }
  }

  if (loading) {
    return <div className="loading">Loading releases...</div>
  }

  if (!releases || releases.length === 0) {
    return <div className="empty-state">No releases yet. Upload one to get started!</div>
  }

  return (
    <div className="releases-list">
      <h2>Recent Releases</h2>
      <p className="releases-subtitle">Open any release to replay the event trail and inspect the selected step.</p>
      <div className="releases-container">
        {releases.map((release, index) => (
          <div key={release.id || index} className="release-card-wrapper">
            <button className="release-card" onClick={() => onSelectRelease?.(release)}>
              <div className="release-header">
                <h3>{release.name || release.fileName}</h3>
                <span className="version-badge">{release.version}</span>
              </div>
              <div className="release-info">
                <p><strong>Status:</strong> {release.status}</p>
                <p><strong>Events:</strong> {release.eventCount ?? release.events?.length ?? 0}</p>
              </div>
              {release.description && <p className="description">{release.description}</p>}
            </button>
            <div className="release-actions">
              <button
                className="action-btn edit-btn"
                onClick={(e) => handleEditClick(e, release.id)}
                title="Patch/Update this release"
              >
                ✏️ Patch
              </button>
              <button
                className="action-btn delete-btn"
                onClick={(e) => handleDeleteClick(e, release.id)}
                title="Delete this release"
              >
                🗑️ Delete
              </button>
              <input
                id={`file-input-${release.id}`}
                type="file"
                accept=".json"
                onChange={(e) => handleFileSelect(e, release.id)}
                style={{ display: 'none' }}
              />
            </div>
            {showDeleteConfirm === release.id && (
              <div className="delete-confirm">
                <p>Delete "{release.name}"?</p>
                <button onClick={() => confirmDelete(release.id)} className="confirm-btn">
                  Yes, Delete
                </button>
                <button onClick={() => setShowDeleteConfirm(null)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
