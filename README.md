# Code Verification System

A web application with admin and public portals for generating and verifying codes.

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

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=mongodb://localhost:27017/website-pay
   JWT_SECRET=your-super-secret-key-change-this-in-production
   PORT=5001
   ```

4. Start MongoDB service

5. Start the development servers:
   ```bash
   # Terminal 1 (Backend)
   npm run dev

   # Terminal 2 (Frontend)
   cd client
   npm start
   ```

## Usage

1. Access the public portal at `http://localhost:3000`
2. Access the admin portal at `http://localhost:3000/admin`
3. Login with admin credentials to generate and manage codes
4. Use the public portal to verify codes

## Security Notes

- Change the JWT_SECRET in production
- Use environment variables for sensitive data
- Implement proper password policies
- Use HTTPS in production

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