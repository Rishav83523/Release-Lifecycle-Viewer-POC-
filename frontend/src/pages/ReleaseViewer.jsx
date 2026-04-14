import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import StageDetails from '../components/StageDetails'
import StageTracker from '../components/StageTracker'
import '../styles/ReleaseViewer.css'

// Helper function to generate logs based on stage status
const generateStageLogs = (stageName, status) => {
  if (status === 'failed') {
    return [
      { time: '08:05:45', type: 'LOG', message: `Running ${stageName} suite...` },
      { time: '08:05:52', type: 'OK', message: '48 / 54 tests passed' },
      { time: '08:05:58', type: 'ERROR', message: 'NullPointerException in UserSessionService.validateToken() at line 84' },
      { time: '08:05:59', type: 'ERROR', message: 'Auth middleware received undefined session context after Redis failover' },
      { time: '08:06:01', type: 'ERROR', message: `${stageName} suite failed with HTTP 500` },
    ]
  }

  // Passed stage logs
  return [
    { time: '08:05:45', type: 'LOG', message: `Running ${stageName} suite...` },
    { time: '08:05:52', type: 'OK', message: '54 / 54 tests passed' },
    { time: '08:05:59', type: 'SUCCESS', message: 'All tests completed successfully' },
  ]
}

export default function ReleaseViewer({
  release,
  currentStage,
  setCurrentStage,
  onBack,
}) {
  // Set initial stage to last stage if all stages are passed, otherwise first failed stage or current stage
  useEffect(() => {
    if (release && release.stages) {
      const allPassed = release.stages.every(stage => stage.status === 'passed')
      const failedIndex = release.stages.findIndex(stage => stage.status === 'failed')

      if (allPassed) {
        // Show last stage for fully passed releases
        setCurrentStage(release.stages.length - 1)
      } else if (failedIndex !== -1) {
        // Show failed stage if there's a failure
        setCurrentStage(failedIndex)
      }
    }
  }, [release, setCurrentStage])

  // Generate stage details dynamically based on release data
  const generateStageDetails = () => {
    const details = {}
    release.stages.forEach((stage, index) => {
      const status = stage.status
      const stageName = stage.name

      details[index] = {
        logs: generateStageLogs(stageName, status),
        stats: {
          tests: status === 'failed' ? '48 / 54' : '54 / 54',
          duration: stage.duration,
        },
      }

      // Add error only for failed stages
      if (status === 'failed') {
        details[index].error = {
          title: 'Failure detected',
          message: 'NullPointerException in UserSessionService.validateToken() at line 84. Auth middleware received undefined session context after Redis failover. Redis replica was promoted during the test run causing session store reconnect to fail silently.',
        }
      }
    })
    return details
  }

  const stageDetails = generateStageDetails()

  const currentStageData = stageDetails[currentStage] || stageDetails[0]
  const stage = release.stages[currentStage]

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
            logs={currentStageData.logs}
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
