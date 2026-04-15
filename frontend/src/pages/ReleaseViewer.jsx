import { useEffect, useMemo, useRef, useState } from 'react'
import Sidebar from '../components/common/Sidebar'
import StageDetails from '../components/release/StageDetails'
import StageTracker from '../components/release/StageTracker'
import { buildReplayView, fetchReplayState } from '../lib/releaseModel'
import '../styles/pages/ReleaseViewer.css'

export default function ReleaseViewer({
  release,
  onBack,
}) {
  const [currentEventIndex, setCurrentEventIndex] = useState(0)
  const [serverReplay, setServerReplay] = useState(null)
  const [loadingReplay, setLoadingReplay] = useState(false)
  const [replayError, setReplayError] = useState('')
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [runningEventIndex, setRunningEventIndex] = useState(null)
  const [stepStatuses, setStepStatuses] = useState([])
  const stepDelayMs = 3000
  const autoRunTimerRef = useRef(null)
  const replayRunIdRef = useRef(0)

  useEffect(() => {
    if (!release?.events?.length) {
      return undefined
    }

    replayRunIdRef.current += 1
    const runId = replayRunIdRef.current

    setStepStatuses(new Array(release.events.length).fill('pending'))
    setCurrentEventIndex(0)
    setServerReplay(null)
    setReplayError('')
    setRunningEventIndex(null)
    setIsAutoRunning(false)

    if (autoRunTimerRef.current) {
      clearTimeout(autoRunTimerRef.current)
      autoRunTimerRef.current = null
    }

    // Delay kickoff by a tick so StrictMode cleanup can cancel the first mount run.
    autoRunTimerRef.current = setTimeout(() => {
      if (replayRunIdRef.current !== runId) {
        return
      }

      runReplaySequence(0, runId)
    }, 0)

    return () => {
      if (autoRunTimerRef.current) {
        clearTimeout(autoRunTimerRef.current)
        autoRunTimerRef.current = null
      }

      if (replayRunIdRef.current === runId) {
        replayRunIdRef.current += 1
      }
    }
  }, [release?.id, release?.events?.length])

  const runStep = async (stepIndex, runId = null) => {
    if (!release?.id) {
      return null
    }

    if (runId !== null && runId !== replayRunIdRef.current) {
      return null
    }

    setRunningEventIndex(stepIndex)
    setLoadingReplay(true)
    setReplayError('')
    setCurrentEventIndex(stepIndex)
    setStepStatuses((current) => {
      const next = current.length ? [...current] : new Array(release.events.length).fill('pending')
      for (let index = stepIndex; index < next.length; index += 1) {
        next[index] = 'pending'
      }
      next[stepIndex] = 'running'
      return next
    })

    try {
      if (runId !== null && runId !== replayRunIdRef.current) {
        return null
      }

      const replayData = await fetchReplayState(release.id, stepIndex)

      if (runId !== null && runId !== replayRunIdRef.current) {
        return null
      }

      setServerReplay(replayData)
      await new Promise((resolve) => {
        setTimeout(resolve, stepDelayMs)
      })

      if (runId !== null && runId !== replayRunIdRef.current) {
        return null
      }

      setStepStatuses((current) => {
        const next = [...current]
        next[stepIndex] = replayData?.selectedEvent?.status === 'failed' ? 'failed' : 'passed'
        return next
      })
      return replayData
    } catch (error) {
      setReplayError(error.message)
      setStepStatuses((current) => {
        const next = [...current]
        next[stepIndex] = 'failed'
        return next
      })
      return null
    } finally {
      if (runId === null || runId === replayRunIdRef.current) {
        setRunningEventIndex(null)
        setLoadingReplay(false)
      }
    }
  }

  const runReplaySequence = async (startIndex = 0, runId = replayRunIdRef.current) => {
    if (!release?.events?.length) {
      return
    }

    if (runId !== replayRunIdRef.current) {
      return
    }

    setIsAutoRunning(true)
    setReplayError('')
    setCurrentEventIndex(startIndex)
    setStepStatuses((current) => {
      const next = current.length ? [...current] : new Array(release.events.length).fill('pending')
      for (let index = 0; index < next.length; index += 1) {
        next[index] = index < startIndex ? 'passed' : 'pending'
      }
      return next
    })

    for (let index = startIndex; index < release.events.length; index += 1) {
      if (runId !== replayRunIdRef.current) {
        return
      }

      const replayData = await runStep(index, runId)
      if (!replayData || replayData.selectedEvent?.status === 'failed') {
        if (runId === replayRunIdRef.current) {
          setIsAutoRunning(false)
        }
        return
      }
    }

    if (runId === replayRunIdRef.current) {
      setIsAutoRunning(false)
    }
  }

  const replayView = useMemo(() => {
    const sourceRelease = serverReplay?.release || release

    if (!sourceRelease) {
      return null
    }

    // Always use currentEventIndex for display navigation, not server's selectedIndex
    return buildReplayView(sourceRelease, currentEventIndex)
  }, [currentEventIndex, release, serverReplay])

  if (!replayView || !replayView.release.events.length) {
    return null
  }

  const { selectedEvent, selectedIndex } = replayView
  const releaseStatus = replayView.release.status
  const displayEvent =
    runningEventIndex === selectedIndex
      ? {
          ...selectedEvent,
          status: 'running',
          failureReason: '',
          recommendation: '',
          logs: [],
        }
      : selectedEvent

  const handleManualSelect = (index) => {
    if (isAutoRunning) {
      return
    }

    setCurrentEventIndex(index)
    // Clear steps after this one
    setStepStatuses((current) => {
      const next = [...current]
      for (let i = index + 1; i < next.length; i++) {
        next[i] = 'pending'
      }
      return next
    })
  }

  const handleReplayAll = () => {
    if (isAutoRunning) {
      return
    }

    replayRunIdRef.current += 1
    runReplaySequence(0, replayRunIdRef.current)
  }

  const handleReplayCurrentStep = () => {
    if (isAutoRunning) {
      return
    }

    runStep(selectedIndex)
  }

  const handleNavigatePrev = () => {
    if (isAutoRunning) {
      return
    }

    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1
      setCurrentEventIndex(newIndex)
      // Clear steps after the previous step
      setStepStatuses((current) => {
        const next = [...current]
        for (let i = newIndex + 1; i < next.length; i++) {
          next[i] = 'pending'
        }
        return next
      })
    }
  }

  const handleNavigateNext = () => {
    if (isAutoRunning) {
      return
    }

    if (selectedIndex < replayView.release.events.length - 1) {
      const newIndex = selectedIndex + 1
      setCurrentEventIndex(newIndex)
      // Clear steps after the next step
      setStepStatuses((current) => {
        const next = [...current]
        for (let i = newIndex + 1; i < next.length; i++) {
          next[i] = 'pending'
        }
        return next
      })
    }
  }

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
          <button className="action-btn status-btn" title={releaseStatus}>
            {releaseStatus}
          </button>
          <button className="action-btn" onClick={handleReplayAll} disabled={isAutoRunning}>
            {isAutoRunning ? 'Replaying...' : 'Replay from start'}
          </button>
        </div>
      </header>

      <div className="viewer-content">
        <Sidebar
          events={replayView.release.events}
          currentEventIndex={selectedIndex}
          onSelectEvent={handleManualSelect}
          runningEventIndex={runningEventIndex}
          stepStatuses={stepStatuses}
          isAutoRunning={isAutoRunning}
        />

        <div className="main-content">
          <StageTracker
            events={replayView.release.events}
            currentEventIndex={selectedIndex}
            onSelectEvent={handleManualSelect}
            runningEventIndex={runningEventIndex}
            stepStatuses={stepStatuses}
            isAutoRunning={isAutoRunning}
          />

          <StageDetails
            event={displayEvent}
            eventIndex={selectedIndex}
            totalEvents={replayView.release.events.length}
            onPrevEvent={handleNavigatePrev}
            onNextEvent={handleNavigateNext}
            onReplay={handleReplayCurrentStep}
            replayError={replayError}
            isAutoRunning={isAutoRunning}
            runningEventIndex={runningEventIndex}
          />
        </div>
      </div>
    </div>
  )
}
