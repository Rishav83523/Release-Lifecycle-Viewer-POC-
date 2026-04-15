import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import ReleaseViewer from './pages/ReleaseViewer'
import './styles/App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [selectedRelease, setSelectedRelease] = useState(null)

  const handleViewRelease = (release) => {
    setSelectedRelease(release)
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
          onBack={handleBackToLanding}
        />
      )}
    </div>
  )
}

export default App
