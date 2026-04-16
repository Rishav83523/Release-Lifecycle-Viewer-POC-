import '../../styles/common/TrendingAnalytics.css'

export default function TrendingAnalytics({ releases = [] }) {
  // Calculate data for last 14 days
  const getLast14DaysData = () => {
    const data = {}
    for (let i = 13; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      data[key] = { passed: 0, failed: 0 }
    }

    // Count releases by date
    releases.forEach((release) => {
      const releaseDate = release.createdAt || new Date().toISOString()
      const key = releaseDate.split('T')[0]
      if (data[key]) {
        if (release.status === 'Passed') {
          data[key].passed++
        } else if (release.status === 'Failed') {
          data[key].failed++
        }
      }
    })

    return Object.values(data)
  }

  const data = getLast14DaysData()
  const maxCount = Math.max(...data.map((d) => d.passed + d.failed), 3)

  // SVG dimensions
  const width = 500
  const height = 200
  const padding = 40
  const graphWidth = width - padding * 2
  const graphHeight = height - padding * 2
  const pointSpacing = graphWidth / (data.length - 1 || 1)

  // Generate path for passed line
  const passedPath = data
    .map(
      (d, i) =>
        `${padding + i * pointSpacing},${
          padding + graphHeight - (d.passed / maxCount) * graphHeight
        }`
    )
    .join(' ')

  // Generate path for failed line
  const failedPath = data
    .map(
      (d, i) =>
        `${padding + i * pointSpacing},${
          padding + graphHeight - (d.failed / maxCount) * graphHeight
        }`
    )
    .join(' ')

  // Y-axis labels
  const yAxisLabels = [0, Math.ceil(maxCount / 2), maxCount]

  return (
    <div className="trending-analytics">
      <h3>Pass / fail over last 14 days</h3>
      <div className="chart-container">
        <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
          {/* Grid lines */}
          {yAxisLabels.map((label, idx) => (
            <g key={`grid-${idx}`}>
              <line
                x1={padding}
                y1={padding + (graphHeight / 2) * idx}
                x2={width - padding}
                y2={padding + (graphHeight / 2) * idx}
                className="grid-line"
              />
              <text
                x={padding - 8}
                y={padding + (graphHeight / 2) * idx + 4}
                className="y-axis-label"
              >
                {label}
              </text>
            </g>
          ))}

          {/* X-axis */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            className="axis-line"
          />

          {/* Y-axis */}
          <line x1={padding} y1={padding} x2={padding} y2={height - padding} className="axis-line" />

          {/* Passed line */}
          <polyline points={passedPath} className="line passed-line" />

          {/* Failed line */}
          <polyline points={failedPath} className="line failed-line" />

          {/* Data points for passed */}
          {data.map((d, i) => (
            <circle
              key={`passed-point-${i}`}
              cx={padding + i * pointSpacing}
              cy={padding + graphHeight - (d.passed / maxCount) * graphHeight}
              r="3"
              className="data-point passed-point"
            />
          ))}

          {/* Data points for failed */}
          {data.map((d, i) => (
            <circle
              key={`failed-point-${i}`}
              cx={padding + i * pointSpacing}
              cy={padding + graphHeight - (d.failed / maxCount) * graphHeight}
              r="3"
              className="data-point failed-point"
            />
          ))}
        </svg>
      </div>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-dot passed"></span>
          <span>Passed</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot failed"></span>
          <span>Failed</span>
        </div>
      </div>
    </div>
  )
}
