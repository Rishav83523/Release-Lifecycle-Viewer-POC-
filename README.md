# PAC-Timeline

Event replay POC for release and deployment lifecycles. The Go backend serves ordered mock audit events, and the React frontend lets you click any step to inspect the release state at that moment.

## Prerequisites

- Go 1.16 or newer
- Node.js 14 or newer
- Git

## Setup

### Backend

```bash
cd backend
go mod tidy
go run main.go
```

The API runs on `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

## What The POC Shows

- Ordered event history for healthy and failed releases
- Metadata per event, including timestamp, actor, logs, related data, and failure reason
- Replay view that opens a release and lets you travel back to any step
- Failure guidance for validation, trial, deployment, and pipeline issues

## API Endpoints

- `GET /api/health`
- `GET /api/releases`
- `GET /api/releases/{id}`
- `GET /api/releases/{id}/events`
- `GET /api/releases/{id}/replay?step={index}`

## Notes

- The backend uses in-memory mock data for the POC.
- Uploaded JSON files can be used to open a custom release replay in the frontend.
- The sample healthy and failed release payloads live at the repository root.
