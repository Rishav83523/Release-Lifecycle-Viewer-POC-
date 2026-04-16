import { useEffect, useMemo, useState } from 'react'
import ReleasesList from '../components/release/ReleasesList'
import StatusOverview from '../components/common/StatusOverview'
import TrendingAnalytics from '../components/common/TrendingAnalytics'
import LatestActivity from '../components/common/LatestActivity'
import UploadArea from '../components/release/UploadArea'
import { API_BASE, normalizeReleaseSummary, uploadReleasePayload } from '../lib/releaseModel'
import '../styles/pages/LandingPage.css'

export default function LandingPage({ onViewRelease }) {
  const [pastReleases, setPastReleases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const loadReleases = async () => {
      try {
        setLoading(true)
        setError('')

        const response = await fetch(`${API_BASE}/releases`)
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to fetch releases')
        }

        const items = Array.isArray(payload.data) ? payload.data : []
        const releases = items.map((item) => normalizeReleaseSummary(item))

        if (!cancelled) {
          setPastReleases(releases)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError.message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReleases()

    return () => {
      cancelled = true
    }
  }, [])

  const openRelease = async (release) => {
    try {
      const response = await fetch(`${API_BASE}/releases/${release.id}`)
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load release')
      }

      const detail = payload.data || release
      onViewRelease(normalizeReleaseSummary(detail))
    } catch (loadError) {
      setError(loadError.message)
    }
  }

  const handleUpload = async (file) => {
    try {
      const fileContents = await file.text()
      const parsedData = JSON.parse(fileContents)

      if (!parsedData.id) {
        parsedData.id = `upload-${Date.now()}`
      }

      if (!parsedData.name) {
        parsedData.name = file.name.replace(/\.json$/i, '')
      }

      const uploadedRelease = await uploadReleasePayload(parsedData)
      const normalizedUploaded = normalizeReleaseSummary(uploadedRelease)

      setPastReleases((existing) => {
        const withoutSame = existing.filter((item) => item.id !== normalizedUploaded.id)
        return [normalizedUploaded, ...withoutSame]
      })

      onViewRelease(normalizedUploaded)
    } catch (uploadError) {
      setError(uploadError.message)
    }
  }

  const handleEditRelease = async (releaseId, file) => {
    try {
      setError('')
      const fileContents = await file.text()
      const parsedData = JSON.parse(fileContents)

      // Ensure ID matches the release being updated
      parsedData.id = releaseId

      // Patch the release
      const response = await fetch(`${API_BASE}/releases/${releaseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedData),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update release')
      }

      const updatedRelease = normalizeReleaseSummary(payload.data || parsedData)

      setPastReleases((existing) => {
        const updated = existing.map((item) =>
          item.id === releaseId ? updatedRelease : item
        )
        return updated
      })

      // Navigate to viewer to show replay
      onViewRelease(updatedRelease)
    } catch (editError) {
      setError(`❌ Failed to patch release: ${editError.message}`)
    }
  }

  const handleDeleteRelease = async (releaseId) => {
    try {
      setError('')
      const response = await fetch(`${API_BASE}/releases/${releaseId}`, {
        method: 'DELETE',
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete release')
      }

      const deletedReleaseName = pastReleases.find((r) => r.id === releaseId)?.name

      setPastReleases((existing) => existing.filter((item) => item.id !== releaseId))
      setError(`✅ Release "${deletedReleaseName}" deleted successfully!`)
    } catch (deleteError) {
      setError(`❌ Failed to delete release: ${deleteError.message}`)
    }
  }

  const overviewReleases = useMemo(() => pastReleases, [pastReleases])

  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1>Release Event Replay</h1>
        <p>Replay ordered business and system events to inspect the release state at any point in time.</p>
      </div>

      <div className="landing-content">
        <div className="left-column">
          <UploadArea onUpload={handleUpload} />
          <div className="past-releases-section">
            <ReleasesList
              releases={overviewReleases}
              loading={loading}
              onSelectRelease={openRelease}
              onEditRelease={handleEditRelease}
              onDeleteRelease={handleDeleteRelease}
            />
            {error && <p className="landing-error">{error}</p>}
          </div>
        </div>

        <div className="right-column">
          <StatusOverview releases={overviewReleases} />
          <TrendingAnalytics releases={overviewReleases} />
          <LatestActivity releases={overviewReleases} />
        </div>
      </div>
    </div>
  )
}
