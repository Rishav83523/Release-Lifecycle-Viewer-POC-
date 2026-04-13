import { useState } from 'react'
import StatusOverview from '../components/StatusOverview'
import UploadArea from '../components/UploadArea'
import '../styles/LandingPage.css'

export default function LandingPage({ onViewRelease }) {
  const [pastReleases, setPastReleases] = useState([
    {
      id: 1,
      name: 'Time Travel Debugger',
      version: 'v4.2.1-RMT',
      status: 'Passed',
      stages: [
        { name: 'Build', duration: '1m 12s', status: 'passed' },
        { name: 'Unit tests', duration: '2m 04s', status: 'passed' },
        { name: 'Integration', duration: '3m 31s', status: 'passed' },
        { name: 'Staging deploy', duration: '45s', status: 'passed' },
        { name: 'Canary', duration: '2m 15s', status: 'passed' },
        { name: 'Production', duration: '3m 20s', status: 'passed' }
      ]
    },
    {
      id: 2,
      name: 'Analytics Service',
      version: 'v2.0.0',
      status: 'Failed',
      stages: [
        { name: 'Build', duration: '1m 08s', status: 'passed' },
        { name: 'Unit tests', duration: '2m', status: 'passed' },
        { name: 'Integration', duration: '3m 31s', status: 'failed' },
        { name: 'Staging deploy', duration: '-', status: 'pending' },
        { name: 'Canary', duration: '-', status: 'pending' },
        { name: 'Production', duration: '-', status: 'pending' }
      ]
    },
    {
      id: 3,
      name: 'API Gateway',
      version: 'v3.1.5',
      status: 'Passed',
      stages: [
        { name: 'Build', duration: '1m 20s', status: 'passed' },
        { name: 'Unit tests', duration: '1m 50s', status: 'passed' },
        { name: 'Integration', duration: '3m 15s', status: 'passed' },
        { name: 'Staging deploy', duration: '50s', status: 'passed' },
        { name: 'Canary', duration: '2m 10s', status: 'passed' },
        { name: 'Production', duration: '3m 05s', status: 'passed' }
      ]
    },
    {
      id: 4,
      name: 'WebSocket Handler',
      version: 'v1.5.2',
      status: 'Passed',
      stages: [
        { name: 'Build', duration: '55s', status: 'passed' },
        { name: 'Unit tests', duration: '1m 30s', status: 'passed' },
        { name: 'Integration', duration: '2m 45s', status: 'passed' },
        { name: 'Staging deploy', duration: '35s', status: 'passed' },
        { name: 'Canary', duration: '1m 55s', status: 'passed' },
        { name: 'Production', duration: '2m 50s', status: 'passed' }
      ]
    }
  ])

  const handleUpload = (file) => {
    const mockRelease = {
      id: Math.random(),
      name: file.name.replace('.json', ''),
      version: 'v1.0.0',
      status: 'In Progress',
      stages: [
        { name: 'Build', duration: '1m 12s', status: 'in-progress' },
        { name: 'Unit tests', duration: '-', status: 'pending' },
        { name: 'Integration', duration: '-', status: 'pending' },
        { name: 'Staging deploy', duration: '-', status: 'pending' },
        { name: 'Canary', duration: '-', status: 'pending' },
        { name: 'Production', duration: '-', status: 'pending' }
      ]
    }
    onViewRelease(mockRelease)
  }

  return (
    <div className="landing-page">
      <div className="landing-header">
        <h1>Release Lifecycle Viewer</h1>
        <p>A unified view to track, analyze, and debug the release lifecycle.</p>
      </div>

      <div className="landing-content">
        <div className="left-column">
          <UploadArea onUpload={handleUpload} />
          <div className="past-releases-section">
            <h2>Recent Releases</h2>
            <div className="releases-table">
              <div className="table-header">
                <div className="col-name">Name</div>
                <div className="col-version">Version</div>
                <div className="col-status">Status</div>
              </div>
              <div className="table-body">
                {pastReleases.map((release) => (
                  <div
                    key={release.id}
                    className={`table-row ${release.status === 'Failed' ? 'failed' : ''}`}
                    onClick={() => onViewRelease(release)}
                  >
                    <div className="col-name">{release.name}</div>
                    <div className="col-version">{release.version}</div>
                    <div className="col-status">
                      <span className={`status-badge ${release.status.toLowerCase()}`}>
                        {release.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="right-column">
          <StatusOverview />
        </div>
      </div>
    </div>
  )
}
