# WebsitePay - Split Hosting Setup

This project uses a split hosting architecture:
- Frontend: Netlify
- Backend: Render

## Setup Instructions

### Frontend (Netlify)

1. Connect your GitHub repository to Netlify
2. Configure the build settings:
   - Base directory: `client`
   - Build command: `npm install && npm run build`
   - Publish directory: `build`
3. Add environment variables:
   - No environment variables needed for the frontend as they are hardcoded in the config.js file

### Backend (Render)

1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Configure the following settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
4. Add environment variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT token generation

## Development

For local development:

```bash
# Start the backend
npm run dev

# In a new terminal, start the frontend
cd client
npm start
```

## Architecture

- The frontend is built with React and communicates with the backend API
- The backend is a Node.js/Express server that provides API endpoints
- MongoDB is used as the database

## API Endpoints

- `/api/auth` - Authentication endpoints
- `/api/codes` - Code management endpoints
- `/api/status` - API status check

## Deployment Flow

1. Push changes to GitHub
2. Netlify and Render will automatically detect changes and deploy updates
3. The frontend will connect to the Render backend API using the configured URL in `client/src/config.js`

## Troubleshooting

- If the frontend can't connect to the backend, check the API URL in `client/src/config.js`
- The application has a fallback to mock API if the backend is unreachable

## Features

- Admin Portal:
  - Generate single or multiple random codes
  - View all generated codes and their status
  - Secure authentication

- Public Portal:
  - Verify codes
  - Simple and user-friendly interface

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Technologies Used

- Frontend:
  - React
  - React Router
  - Bootstrap
  - Axios

- Backend:
  - Node.js
  - Express
  - MongoDB
  - JWT Authentication 