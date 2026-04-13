import { useState } from 'react'
import './App.css'
import LandingPage from './pages/LandingPage'
import ReleaseViewer from './pages/ReleaseViewer'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [selectedRelease, setSelectedRelease] = useState(null)
  const [currentStage, setCurrentStage] = useState(0)

  const handleViewRelease = (release) => {
    setSelectedRelease(release)
    setCurrentStage(0)
    setCurrentPage('viewer')
  }

  const handleBackToLanding = () => {
    setCurrentPage('landing')
    setSelectedRelease(null)
  }

  return (
    <div className="app">
      {currentPage === 'landing' && (
        <LandingPage onViewRelease={handleViewRelease} />
      )}
      {currentPage === 'viewer' && selectedRelease && (
        <ReleaseViewer
          release={selectedRelease}
          currentStage={currentStage}
          setCurrentStage={setCurrentStage}
          onBack={handleBackToLanding}
        />
      )}
    </div>
  )
}

export default App
