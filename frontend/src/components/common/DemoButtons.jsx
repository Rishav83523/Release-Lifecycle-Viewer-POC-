import '../../styles/common/DemoButtons.css'

export default function DemoButtons({ onLoadDemo }) {
  return (
    <div className="demo-buttons">
      <button
        className="demo-btn demo-btn-failed"
        onClick={() => onLoadDemo('failed')}
      >
        Demo — failed release
      </button>
      <button
        className="demo-btn demo-btn-healthy"
        onClick={() => onLoadDemo('healthy')}
      >
        Demo — healthy release
      </button>

      <div className="json-schema">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9 18 15 12 9 6" />
        </svg>
        <span>JSON schema</span>
      </div>
    </div>
  )
}
