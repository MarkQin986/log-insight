# Log Insight Project

A comprehensive log collection and management system with React frontend and Node.js backend.

## Project Structure

```
log-insight/
├── log-insight-backend/    # Node.js backend service
│   ├── server.js           # Main server file
│   ├── logger.js           # Pino logging configuration
│   ├── middleware/         # Authentication middleware
│   ├── services/           # Log service
│   ├── .env               # Environment variables
│   └── package.json       # Backend dependencies
└── log-insight-ui/         # React frontend application
    ├── src/
    │   ├── components/     # React components
    │   ├── contexts/       # Authentication context
    │   ├── services/       # API services
    │   └── App.js         # Main app component
    └── package.json       # Frontend dependencies
```

## Features

### Backend (log-insight-backend)
- **Authentication API**: Login system with JWT tokens
- **General Log API**: Accept logs from any source (no auth required)
- **Login Log API**: Track user login events
- **Token Usage API**: Track LLM token consumption (no auth required)
- **Log Management**: View, search, filter, and delete logs
- **Pino Logging**: Rotating file-based logging system

### Frontend (log-insight-ui)
- **Secure Authentication**: Login required for all pages
- **Log Dashboard**: View and manage all log types
- **Search & Filter**: Real-time log filtering and search
- **Pagination**: Handle large log datasets efficiently
- **Log Deletion**: Conditional log cleanup
- **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd log-insight-backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables (edit `.env` if needed):
```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
LOG_LEVEL=info
LOG_DIR=./logs
```

4. Start the backend server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd log-insight-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the frontend development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Usage

### Accessing the Dashboard

1. Open your browser and go to `http://localhost:3000`
2. Login with the default credentials:
   - Username: `admin`
   - Password: `admin123`
3. You'll be redirected to the dashboard where you can view and manage logs

### API Endpoints

#### Public Endpoints (No Authentication Required)

**Submit General Log:**
```bash
POST http://localhost:3001/api/logs/general
Content-Type: application/json

{
  "level": "info",
  "message": "User performed action",
  "data": {
    "userId": "123",
    "action": "view_profile"
  }
}
```

**Submit Token Usage:**
```bash
POST http://localhost:3001/api/logs/tokens
Content-Type: application/json

{
  "model": "gpt-4",
  "promptTokens": 150,
  "completionTokens": 300,
  "totalTokens": 450,
  "requestId": "req_123",
  "userId": "user_456",
  "endpoint": "/api/chat",
  "duration": 1500
}
```

#### Protected Endpoints (Authentication Required)

**Login:**
```bash
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Get Logs:**
```bash
GET http://localhost:3001/api/logs/general?page=1&limit=50&search=error
Authorization: Bearer <your-jwt-token>
```

**Delete Logs:**
```bash
DELETE http://localhost:3001/api/logs/general
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "startDate": "2023-01-01",
  "endDate": "2023-12-31",
  "search": "error"
}
```

### Log Types

1. **General Logs** (`/api/logs/general`): Application logs from various sources
2. **Login Logs** (`/api/logs/login`): User authentication events
3. **Token Logs** (`/api/logs/tokens`): LLM token usage tracking
4. **App Logs** (`/api/logs/app`): Internal application events

### Production Deployment

1. **Backend:**
   - Change the JWT secret in `.env`
   - Use a proper password hash for admin credentials
   - Set up proper log rotation and archival
   - Configure CORS for your frontend domain
   - Use a process manager like PM2

2. **Frontend:**
   - Update API base URL in `src/services/api.js`
   - Build for production: `npm run build`
   - Serve static files with nginx or similar

## Security Considerations

- Change default credentials before production use
- Use strong JWT secrets
- Implement rate limiting (already included)
- Use HTTPS in production
- Regularly rotate log files and clean up old logs
- Consider implementing log encryption for sensitive data

## Development

### Adding New Log Types

1. Add the log type to the logger configuration in `logger.js`
2. Create corresponding API endpoints in `server.js`
3. Update the frontend log type selector in `Dashboard.js`

### Customizing the Frontend

The frontend uses Tailwind CSS for styling. You can customize:
- Colors and themes in `tailwind.config.js`
- Components in `src/components/`
- API endpoints in `src/services/api.js`

## Troubleshooting

**Backend won't start:**
- Check if port 3001 is available
- Verify all dependencies are installed
- Check the logs directory permissions

**Frontend can't connect to backend:**
- Ensure backend is running on port 3001
- Check CORS configuration
- Verify the API base URL in the frontend

**Logs not appearing:**
- Check log file permissions in the backend
- Verify the log directory exists
- Check backend console for errors
