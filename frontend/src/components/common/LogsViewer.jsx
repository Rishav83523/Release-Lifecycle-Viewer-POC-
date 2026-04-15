import '../../styles/common/LogsViewer.css'

export default function LogsViewer({ logs }) {
  const getLogIcon = (type) => {
    switch (type) {
      case 'INFO':
        return 'ⓘ'
      case 'LOG':
        return '📋'
      case 'OK':
      case 'SUCCESS':
        return '✓'
      case 'ERROR':
        return '✕'
      case 'WARNING':
        return '⚠'
      default:
        return '•'
    }
  }

  return (
    <div className="logs-viewer">
      {logs.length === 0 ? (
        <div className="no-logs">No logs available</div>
      ) : (
        logs.map((log, index) => {
          if (typeof log === 'string') {
            return (
              <div key={index} className="log-entry info">
                <span className="log-icon">{getLogIcon('INFO')}</span>
                <span className="log-message">{log}</span>
              </div>
            )
          }

          return (
            <div key={index} className={`log-entry ${log.type.toLowerCase()}`}>
              {log.time && <span className="log-time">{log.time}</span>}
              <span className={`log-type ${log.type.toLowerCase()}`}>
                {log.type}
              </span>
              <span className="log-icon">{getLogIcon(log.type)}</span>
              <span className="log-message">{log.message}</span>
            </div>
          )
        })
      )}
    </div>
  )
}
