import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import StageDetails from '../components/StageDetails'
import StageTracker from '../components/StageTracker'
import '../styles/ReleaseViewer.css'

export default function ReleaseViewer({
  release,
  currentStage,
  setCurrentStage,
  onBack,
}) {
  const [logFilter, setLogFilter] = useState('All')

  const stageDetails = {
    0: {
      logs: [
        { time: '09:14:01', type: 'INFO', message: 'Cloning repository @ a3f91bc' },
        { time: '09:14:08', type: 'LOG', message: 'npm install — 847 packages' },
        { time: '09:14:31', type: 'SUCCESS', message: 'webpack compilation' },
        { time: '09:14:44', type: 'OK', message: 'webpack-bundle — 2.1 MB' },
        { time: '09:14:46', type: 'OK', message: 'Build artifacts uploaded to S3' },
      ],
      stats: {
        commit: 'a3f91bc',
        branch: 'main',
        exitCode: 0,
        artifacts: '3 built',
      },
    },
    1: {
      logs: [
        { time: '08:02:55', type: 'OK', message: '410 tests passed' },
      ],
      stats: {
        tests: '410 / 410',
        coverage: '86%',
      },
    },
    2: {
      logs: [
        { time: '08:05:58', type: 'OK', message: 'Integration suite passed' },
        { time: '08:05:59', type: 'SUCCESS', message: 'All tests completed successfully' },
      ],
      stats: {
        tests: '54 / 54',
        duration: '3m 31s',
      },
      error: {
        title: 'Failure detected',
        message: 'NullPointerException in UserSessionServicevalidateToken() at line 84. Auth middleware received undefined session context after Redis failover. Is integration tests failed with HTTP 500. Redis replica was promoted during the test run causing session store reconnect to fail silently.',
      },
    },
    3: {
      logs: [
        { time: '08:10:18', type: 'OK', message: 'Staging deploy successful' },
        { time: '08:10:11', type: 'OK', message: 'Smoke tests passed' },
      ],
      stats: {
        smokeTests: 'passed',
        rollback: 'not needed',
      },
    },
    4: {
      logs: [
        { time: '08:05:58', type: 'OK', message: 'Canary deployment initiated' },
      ],
      stats: {
        errorRate: '< 0.1%',
        latency: 'Normal',
      },
    },
    5: {
      logs: [
        { time: '08:05:58', type: 'OK', message: 'Production deployment completed' },
      ],
      stats: {
        deployment: 'Complete',
      },
    },
  }

  const currentStageData = stageDetails[currentStage] || stageDetails[0]
  const stage = release.stages[currentStage]

  const filteredLogs = logFilter === 'All'
    ? currentStageData.logs
    : currentStageData.logs.filter((log) => log.type.toLowerCase() === logFilter.toLowerCase() || log.type === logFilter)

  return (
    <div className="release-viewer">
      <header className="viewer-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            ←
          </button>
          <div className="release-info">
            <h1>{release.name}</h1>
            <p>{release.version}</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="action-btn status-btn" title={release.status}>
            {release.status}
          </button>
          <button className="action-btn">Run all stages</button>
          <button className="action-btn">Upload new</button>
        </div>
      </header>

      <div className="viewer-content">
        <Sidebar
          stages={release.stages}
          currentStage={currentStage}
          onSelectStage={setCurrentStage}
        />

        <div className="main-content">
          <StageTracker
            stages={release.stages}
            currentStage={currentStage}
            onSelectStage={setCurrentStage}
          />

          <StageDetails
            stage={stage}
            currentStageIndex={currentStage}
            stats={currentStageData.stats}
            error={currentStageData.error}
            logs={filteredLogs}
            logFilter={logFilter}
            onFilterChange={setLogFilter}
            onPrevStage={() => currentStage > 0 && setCurrentStage(currentStage - 1)}
            onNextStage={
              () => currentStage < release.stages.length - 1 && setCurrentStage(currentStage + 1)
            }
          />
        </div>
      </div>
    </div>
  )
}
