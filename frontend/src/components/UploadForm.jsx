import { useState } from 'react'
import './UploadForm.css'

export default function UploadForm({ onUploadSuccess }) {
  const [file, setFile] = useState(null)
  const [version, setVersion] = useState('')
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file || !version) {
      setMessage('Please select a file and enter a version')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('version', version)
    formData.append('description', description)

    try {
      setUploading(true)
      setMessage('')

      const response = await fetch('http://localhost:8000/api/releases/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('✓ Release uploaded successfully!')
        setFile(null)
        setVersion('')
        setDescription('')
        document.querySelector('input[type="file"]').value = ''
        onUploadSuccess()
      } else {
        setMessage(`✗ Error: ${data.error}`)
      }
    } catch (error) {
      setMessage(`✗ Error: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="upload-form">
      <h2>Upload Release</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="file">Select File</label>
          <input
            type="file"
            id="file"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="version">Version *</label>
          <input
            type="text"
            id="version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g., 1.0.0"
            disabled={uploading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Release notes or description"
            disabled={uploading}
          />
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Release'}
        </button>

        {message && <div className={`message ${message.startsWith('✓') ? 'success' : 'error'}`}>{message}</div>}
      </form>
    </div>
  )
}
